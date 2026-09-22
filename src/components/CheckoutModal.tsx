import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/store/cartStore";
import { useBuyer } from "@/store/buyerStore";
import { useI18n } from "@/store/i18n";
import { validateCart, hasBlockingIssues } from "@/lib/cart-validate";
import { checkoutServerFn, type CheckoutIssue } from "@/lib/checkout-server";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp-message";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-navy";

export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, clear } = useCart();
  const { buyer, remember, forget } = useBuyer();
  const { lang } = useI18n();

  const [name, setName] = useState(buyer?.name ?? "");
  const [phone, setPhone] = useState(buyer?.phone ?? "");
  const [email, setEmail] = useState(buyer?.email ?? "");
  const [rememberMe, setRememberMe] = useState(!!buyer);
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    validateCart(items)
      .then((validated) => {
        if (cancelled) return;
        setBlocked(hasBlockingIssues(validated));
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMsg(
          lang === "pt"
            ? "Não foi possível validar o carrinho. Tente novamente."
            : "Could not validate the cart. Please try again.",
        );
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, lang]);

  function issueLabel(issue: CheckoutIssue): string {
    const item = items.find((i) => i.variantId === issue.variantId);
    const label = item ? (lang === "pt" ? item.name : item.nameEn) : issue.variantId;
    if (issue.problem === "unavailable") {
      return lang === "pt"
        ? `"${label}" já não está disponível.`
        : `"${label}" is no longer available.`;
    }
    return lang === "pt"
      ? `"${label}": máximo disponível é ${issue.maxStock}.`
      : `"${label}": maximum available is ${issue.maxStock}.`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(
        lang === "pt"
          ? "Preencha nome, telefone e e-mail."
          : "Please fill in name, phone and email.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await checkoutServerFn({
        data: {
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
          buyerEmail: email.trim(),
          items: items.map((i) => ({ variantId: i.variantId, productId: i.productId, qty: i.qty })),
        },
      });

      if (!result.ok) {
        setErrorMsg(
          lang === "pt"
            ? "Alguns itens do carrinho mudaram. Ajuste-os e tente novamente."
            : "Some items in your cart have changed. Please adjust them and try again.",
        );
        console.warn("[checkout] invalid items:", result.issues.map(issueLabel));
        setSubmitting(false);
        return;
      }

      if (rememberMe) {
        remember({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      } else {
        forget();
      }

      const message = buildWhatsAppMessage({
        orderNumber: result.order.orderNumber,
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
        buyerEmail: email.trim(),
        items: result.order.items,
        total: result.order.total,
        lang,
      });
      window.open(buildWhatsAppUrl(message), "_blank");

      clear();
      setSuccess({ orderNumber: result.order.orderNumber });
    } catch {
      setErrorMsg(
        lang === "pt"
          ? "Erro ao criar o pedido. Tente novamente."
          : "Error creating the order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 px-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="heading-xl text-lg text-navy">
            {success
              ? lang === "pt"
                ? "Pedido criado!"
                : "Order created!"
              : lang === "pt"
                ? "Finalizar pelo WhatsApp"
                : "Checkout via WhatsApp"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang === "pt"
                ? `O seu pedido ${success.orderNumber} foi registado. Continue a conversa no WhatsApp para confirmar a compra.`
                : `Your order ${success.orderNumber} has been recorded. Continue the conversation on WhatsApp to complete the purchase.`}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md bg-navy py-3 text-xs font-bold uppercase tracking-[0.15em] text-white"
            >
              {lang === "pt" ? "Fechar" : "Close"}
            </button>
          </div>
        ) : checking ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {lang === "pt" ? "A validar carrinho…" : "Validating cart…"}
          </p>
        ) : blocked ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              {lang === "pt"
                ? "Existem itens indisponíveis ou com quantidade acima do stock no carrinho. Corrija-os antes de finalizar."
                : "There are unavailable items or quantities above stock in your cart. Fix them before checking out."}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md border border-border py-3 text-xs font-bold uppercase tracking-[0.15em] text-navy"
            >
              {lang === "pt" ? "Voltar ao carrinho" : "Back to cart"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={labelCls}>{lang === "pt" ? "Nome" : "Name"}</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>{lang === "pt" ? "Telefone" : "Phone"}</label>
              <input
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              {lang === "pt"
                ? "Recordar os meus dados para próximas compras (365 dias)"
                : "Remember my details for future purchases (365 days)"}
            </label>

            {errorMsg && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand py-3 text-xs font-bold uppercase tracking-[0.15em] text-brand-foreground disabled:opacity-60"
            >
              {submitting
                ? lang === "pt"
                  ? "A processar…"
                  : "Processing…"
                : lang === "pt"
                  ? "Confirmar e abrir WhatsApp"
                  : "Confirm and open WhatsApp"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
