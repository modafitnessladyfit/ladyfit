import { supabase } from "./supabase-client";
import type { CartItem } from "@/store/cartStore";

export interface CartIssue {
  unavailable: boolean;
  priceChanged: boolean;
  currentPrice?: number;
  quantityExceedsStock: boolean;
  maxStock?: number;
}

export interface ValidatedCartItem {
  item: CartItem;
  issue: CartIssue;
}

function currentProductPrice(product: { price: number; sale_price: number | null }): number {
  const price = Number(product.price);
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null;
  return salePrice != null && salePrice < price ? salePrice : price;
}

/**
 * Revalida o carrinho contra o catálogo atual: variante/produto ainda
 * publicados, stock disponível e preço atual — usado ao restaurar o
 * carrinho e antes de finalizar pelo WhatsApp.
 */
export async function validateCart(items: CartItem[]): Promise<ValidatedCartItem[]> {
  if (items.length === 0) return [];

  const variantIds = [...new Set(items.map((i) => i.variantId))];
  const productIds = [...new Set(items.map((i) => i.productId))];

  const [{ data: variants, error: ve }, { data: products, error: pe }] = await Promise.all([
    supabase.from("product_variants").select("*").in("id", variantIds),
    supabase.from("products").select("*").in("id", productIds),
  ]);
  if (ve) throw ve;
  if (pe) throw pe;

  return items.map((item) => {
    const variant = (variants ?? []).find((v) => v.id === item.variantId);
    const product = (products ?? []).find((p) => p.id === item.productId);

    const active =
      !!variant &&
      !!product &&
      variant.status === "published" &&
      product.status === "published" &&
      variant.stock > 0;

    if (!active) {
      return {
        item,
        issue: { unavailable: true, priceChanged: false, quantityExceedsStock: false },
      };
    }

    const currentPrice = currentProductPrice(product);
    const priceChanged = Math.abs(currentPrice - item.unitPrice) > 0.001;
    const quantityExceedsStock = item.qty > variant.stock;

    return {
      item,
      issue: {
        unavailable: false,
        priceChanged,
        quantityExceedsStock,
        ...(priceChanged ? { currentPrice } : {}),
        ...(quantityExceedsStock ? { maxStock: variant.stock } : {}),
      },
    };
  });
}

export function hasBlockingIssues(validated: ValidatedCartItem[]): boolean {
  return validated.some((v) => v.issue.unavailable || v.issue.quantityExceedsStock);
}
