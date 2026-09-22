import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "./supabase-server";

const checkoutItemSchema = z.object({
  variantId: z.string(),
  productId: z.string(),
  qty: z.number().int().positive(),
});

const checkoutInputSchema = z.object({
  buyerName: z.string().min(1),
  buyerPhone: z.string().min(1),
  buyerEmail: z.string().email(),
  items: z.array(checkoutItemSchema).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export interface CheckoutOrderItem {
  quantity: number;
  productName: string;
  sku: string;
  color: string;
  size: string;
  unitPrice: number;
  subtotal: number;
}

export interface CheckoutOrderResult {
  id: number;
  orderNumber: string;
  total: number;
  items: CheckoutOrderItem[];
}

export type CheckoutIssue =
  | { variantId: string; problem: "unavailable" }
  | { variantId: string; problem: "insufficient_stock"; maxStock: number };

export type CheckoutResult =
  | { ok: true; order: CheckoutOrderResult }
  | { ok: false; reason: "invalid_items"; issues: CheckoutIssue[] };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function currentProductPrice(product: { price: number; sale_price: number | null }): number {
  const price = Number(product.price);
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null;
  return salePrice != null && salePrice < price ? salePrice : price;
}

// Cria o pedido a partir de um checkout público. Roda exclusivamente no
// servidor (createServerFn) e usa a chave de serviço do Supabase para poder
// escrever em `orders`/`order_items`, cujas políticas RLS restringem escrita
// direta a utilizadores autenticados — o comprador na loja nunca é um deles.
// Preço e stock são sempre revalidados aqui; o que o cliente enviou nunca é
// usado diretamente para o total ou para decidir disponibilidade.
export const checkoutServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => checkoutInputSchema.parse(data))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const variantIds = [...new Set(data.items.map((i) => i.variantId))];
    const productIds = [...new Set(data.items.map((i) => i.productId))];

    const [
      { data: variants, error: ve },
      { data: products, error: pe },
      { data: colors, error: ce },
    ] = await Promise.all([
      supabaseAdmin.from("product_variants").select("*").in("id", variantIds),
      supabaseAdmin.from("products").select("*").in("id", productIds),
      supabaseAdmin.from("colors").select("*"),
    ]);
    if (ve) throw ve;
    if (pe) throw pe;
    if (ce) throw ce;

    const issues: CheckoutIssue[] = [];
    const resolvedItems: Array<CheckoutOrderItem & { productId: string; variantId: string }> = [];

    for (const item of data.items) {
      const variant = (variants ?? []).find((v) => v.id === item.variantId);
      const product = (products ?? []).find((p) => p.id === item.productId);
      const active =
        !!variant && !!product && variant.status === "published" && product.status === "published";

      if (!active) {
        issues.push({ variantId: item.variantId, problem: "unavailable" });
        continue;
      }
      if (variant.stock <= 0 || item.qty > variant.stock) {
        issues.push({
          variantId: item.variantId,
          problem: "insufficient_stock",
          maxStock: variant.stock,
        });
        continue;
      }

      const unitPrice = currentProductPrice(product);
      const colorName = colors?.find((c) => c.id === variant.color_id)?.name ?? "";
      resolvedItems.push({
        productId: product.id,
        variantId: variant.id,
        quantity: item.qty,
        productName: product.name,
        sku: variant.id,
        color: colorName,
        size: variant.size,
        unitPrice,
        subtotal: unitPrice * item.qty,
      });
    }

    if (issues.length > 0) {
      return { ok: false, reason: "invalid_items", issues };
    }

    const total = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const { data: orderRow, error: oe } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.buyerName,
        customer_phone: data.buyerPhone,
        customer_email: data.buyerEmail,
        total,
        status: "whatsapp_iniciado",
      })
      .select("*")
      .single();
    if (oe) throw oe;

    const itemRows = resolvedItems.map((i) => ({
      id: `oi-${uid()}`,
      order_id: orderRow.id,
      product_id: i.productId,
      variant_id: i.variantId,
      product_name: i.productName,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));
    const { error: ie } = await supabaseAdmin.from("order_items").insert(itemRows);
    if (ie) throw ie;

    const { error: he } = await supabaseAdmin.from("order_status_history").insert({
      id: `osh-${uid()}`,
      order_id: orderRow.id,
      status: "whatsapp_iniciado",
      note: "Pedido criado pelo cliente via checkout do site.",
    });
    if (he) throw he;

    return {
      ok: true,
      order: {
        id: orderRow.id,
        orderNumber: orderRow.order_number,
        total,
        items: resolvedItems.map(({ productId: _pid, variantId: _vid, ...rest }) => rest),
      },
    };
  });
