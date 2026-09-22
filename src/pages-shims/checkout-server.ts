// Shim usado APENAS pelo build isolado do GitHub Pages
// (ver vite.pages.config.ts, alias de "@/lib/checkout-server").
//
// O checkout real (src/lib/checkout-server.ts) é uma server function que
// usa a chave secreta do Supabase — não pode existir num host estático sem
// servidor. Sem a transformação de "server functions" do TanStack Start
// (que só faz sentido no build SSR real), o módulo real acabaria incluído
// no bundle do browser e tentaria importar supabase-server.ts, que se
// recusa a correr fora do servidor. Este stub substitui-o só neste build,
// desativando apenas o checkout — o resto do site continua funcional.
//
// Tipos replicados aqui (não importados de src/lib/checkout-server.ts) para
// evitar qualquer ambiguidade com o alias que aponta para este ficheiro.

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

export async function checkoutServerFn(_opts: {
  data: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    items: Array<{ variantId: string; productId: string; qty: number }>;
  };
}): Promise<CheckoutResult> {
  throw new Error(
    "O checkout não está disponível nesta versão de teste (GitHub Pages não tem servidor). Use a versão publicada na Vercel para finalizar compras.",
  );
}
