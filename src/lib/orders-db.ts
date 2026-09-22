import { supabase } from "./supabase-client";

export const ORDER_STATUSES = [
  "whatsapp_iniciado",
  "em_negociacao",
  "confirmado",
  "pago",
  "enviado",
  "concluido",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  whatsapp_iniciado: "WhatsApp iniciado",
  em_negociacao: "Em negociação",
  confirmado: "Confirmado",
  pago: "Pago",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderStatusEvent {
  id: string;
  status: OrderStatus;
  note: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  notes: string;
  stockDeducted: boolean;
  items: OrderItem[];
  history: OrderStatusEvent[];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderItem(r: any): OrderItem {
  return {
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id,
    productName: r.product_name,
    color: r.color,
    size: r.size,
    quantity: r.quantity,
    unitPrice: Number(r.unit_price),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderStatusEvent(r: any): OrderStatusEvent {
  return { id: r.id, status: r.status as OrderStatus, note: r.note ?? "", createdAt: r.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(r: any, items: OrderItem[], history: OrderStatusEvent[]): Order {
  return {
    id: r.id,
    orderNumber:
      r.order_number ??
      `LF-${new Date(r.created_at).getFullYear()}-${String(r.id).padStart(6, "0")}`,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    total: Number(r.total),
    status: r.status as OrderStatus,
    notes: r.notes ?? "",
    stockDeducted: r.stock_deducted,
    items,
    history,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const [{ data: orderRows, error: oe }, { data: itemRows, error: ie }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
  ]);
  if (oe) throw oe;
  if (ie) throw ie;

  return (orderRows ?? []).map((r) => {
    const items = (itemRows ?? []).filter((i) => i.order_id === r.id).map(toOrderItem);
    return toOrder(r, items, []);
  });
}

export async function fetchOrderHistory(orderId: number): Promise<OrderStatusEvent[]> {
  const { data, error } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toOrderStatusEvent);
}

export interface OrderDraft {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  items: Array<{
    productId: string | null;
    variantId: string | null;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
}

function computeTotal(items: OrderDraft["items"]) {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

export async function createOrder(draft: OrderDraft): Promise<Order> {
  const total = computeTotal(draft.items);

  const { data: orderRow, error: oe } = await supabase
    .from("orders")
    .insert({
      customer_name: draft.customerName,
      customer_phone: draft.customerPhone,
      customer_email: draft.customerEmail,
      notes: draft.notes,
      total,
      status: "whatsapp_iniciado",
    })
    .select("*")
    .single();
  if (oe) throw oe;

  const itemRows = draft.items.map((i) => ({
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
  if (itemRows.length > 0) {
    const { error: ie } = await supabase.from("order_items").insert(itemRows);
    if (ie) throw ie;
  }

  const { error: he } = await supabase.from("order_status_history").insert({
    id: `osh-${uid()}`,
    order_id: orderRow.id,
    status: "whatsapp_iniciado",
    note: "Pedido criado.",
  });
  if (he) throw he;

  return toOrder(orderRow, itemRows.map(toOrderItem), []);
}

export async function updateOrderDetails(
  id: number,
  patch: { customerName: string; customerPhone: string; customerEmail: string; notes: string },
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: patch.customerName,
      customer_phone: patch.customerPhone,
      customer_email: patch.customerEmail,
      notes: patch.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function replaceOrderItems(
  orderId: number,
  items: OrderDraft["items"],
): Promise<OrderItem[]> {
  const { error: de } = await supabase.from("order_items").delete().eq("order_id", orderId);
  if (de) throw de;

  const itemRows = items.map((i) => ({
    id: `oi-${uid()}`,
    order_id: orderId,
    product_id: i.productId,
    variant_id: i.variantId,
    product_name: i.productName,
    color: i.color,
    size: i.size,
    quantity: i.quantity,
    unit_price: i.unitPrice,
  }));
  if (itemRows.length > 0) {
    const { error: ie } = await supabase.from("order_items").insert(itemRows);
    if (ie) throw ie;
  }

  const total = computeTotal(items);
  const { error: ue } = await supabase
    .from("orders")
    .update({ total, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (ue) throw ue;

  return itemRows.map(toOrderItem);
}

// ── Stock: baixa automática (idempotente), reversão e ajuste manual ──────────

async function applyStockDelta(
  variantId: string,
  delta: number,
  reason: string,
  source: "order_confirmed" | "manual" | "reversal",
  orderId: number | null,
): Promise<void> {
  const { data: variant, error: ve } = await supabase
    .from("product_variants")
    .select("stock")
    .eq("id", variantId)
    .single();
  if (ve) throw ve;

  const newStock = variant.stock + delta;
  if (newStock < 0) {
    throw new Error(`Stock insuficiente para a variante ${variantId} (atual: ${variant.stock}).`);
  }

  const { error: ue } = await supabase
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", variantId);
  if (ue) throw ue;

  const { error: me } = await supabase.from("stock_movements").insert({
    id: `sm-${uid()}`,
    variant_id: variantId,
    order_id: orderId,
    quantity_delta: delta,
    reason,
    source,
  });
  if (me) throw me;
}

async function deductStockForOrder(order: Order, reason: string): Promise<void> {
  for (const item of order.items) {
    if (!item.variantId) continue;
    await applyStockDelta(item.variantId, -item.quantity, reason, "order_confirmed", order.id);
  }
  const { error } = await supabase
    .from("orders")
    .update({ stock_deducted: true, updated_at: new Date().toISOString() })
    .eq("id", order.id);
  if (error) throw error;
}

export async function changeOrderStatus(
  order: Order,
  status: OrderStatus,
  note: string,
): Promise<void> {
  // Confirmado dá baixa automática de stock, mas nunca duas vezes para o
  // mesmo pedido — mesmo que o status seja gravado como "confirmado" outra vez.
  if (status === "confirmado" && !order.stockDeducted) {
    await deductStockForOrder(order, "Baixa automática ao confirmar pedido.");
  }

  const { error: he } = await supabase.from("order_status_history").insert({
    id: `osh-${uid()}`,
    order_id: order.id,
    status,
    note,
  });
  if (he) throw he;

  const { error: ue } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", order.id);
  if (ue) throw ue;
}

export async function deleteOrder(id: number): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function deductOrderStock(order: Order): Promise<void> {
  if (order.stockDeducted) return;
  await deductStockForOrder(order, "Baixa manual de stock efetuada.");
  await supabase.from("order_status_history").insert({
    id: `osh-${uid()}`,
    order_id: order.id,
    status: order.status,
    note: "Baixa manual de stock efetuada.",
  });
}

export async function reverseOrderStock(order: Order): Promise<void> {
  if (!order.stockDeducted) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    await applyStockDelta(
      item.variantId,
      item.quantity,
      "Reversão manual de stock efetuada.",
      "reversal",
      order.id,
    );
  }
  const { error } = await supabase
    .from("orders")
    .update({ stock_deducted: false, updated_at: new Date().toISOString() })
    .eq("id", order.id);
  if (error) throw error;

  await supabase.from("order_status_history").insert({
    id: `osh-${uid()}`,
    order_id: order.id,
    status: order.status,
    note: "Reversão manual de stock efetuada.",
  });
}

// ── Ajuste manual de stock (fora do fluxo de pedidos) ─────────────────────────

export async function adjustVariantStock(
  variantId: string,
  delta: number,
  reason: string,
): Promise<void> {
  if (!reason.trim()) throw new Error("É obrigatório indicar um motivo para o ajuste de stock.");
  await applyStockDelta(variantId, delta, reason, "manual", null);
}
