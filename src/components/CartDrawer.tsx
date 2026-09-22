import { Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { sizeLabel } from "@/data/types";
import { useCart } from "@/store/cartStore";
import { useI18n } from "@/store/i18n";
import { formatEUR } from "@/lib/format";
import { validateCart, hasBlockingIssues, type ValidatedCartItem } from "@/lib/cart-validate";
import { CheckoutModal } from "./CheckoutModal";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const { t, lang } = useI18n();
  const [validated, setValidated] = useState<ValidatedCartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!open || items.length === 0) {
      setValidated([]);
      return;
    }
    let cancelled = false;
    validateCart(items).then((result) => {
      if (!cancelled) setValidated(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  if (!open) return null;

  const issueByVariant = new Map(validated.map((v) => [v.item.variantId, v.issue]));
  const subtotal = items.reduce((s, i) => {
    const issue = issueByVariant.get(i.variantId);
    const price = issue?.priceChanged ? (issue.currentPrice ?? i.unitPrice) : i.unitPrice;
    return s + price * i.qty;
  }, 0);
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 4.9;
  const total = subtotal + shipping;
  const blocked = hasBlockingIssues(validated);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          className="absolute inset-0 bg-navy/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative flex h-full w-full max-w-md flex-col bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="heading-xl text-lg text-navy">
              {t("cart")} ({items.length})
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-soft"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("emptyCart")}</p>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => {
                  const issue = issueByVariant.get(item.variantId);
                  const unavailable = issue?.unavailable ?? false;
                  return (
                    <li key={item.variantId} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
                      <img
                        src={item.image}
                        alt={lang === "pt" ? item.name : item.nameEn}
                        loading="lazy"
                        className={`h-24 w-[72px] rounded-md object-cover ${unavailable ? "opacity-40" : ""}`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold ${unavailable ? "text-muted-foreground line-through" : "text-navy"}`}
                        >
                          {lang === "pt" ? item.name : item.nameEn}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {lang === "pt" ? item.color : item.colorEn} · {sizeLabel(item.size, lang)}
                        </p>

                        {unavailable && (
                          <p className="mt-1 inline-block rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                            {lang === "pt" ? "Indisponível" : "Unavailable"}
                          </p>
                        )}
                        {issue?.priceChanged && (
                          <p className="mt-1 text-[11px] font-semibold text-brand">
                            {lang === "pt"
                              ? "O preço deste produto foi atualizado."
                              : "The price of this product has been updated."}
                          </p>
                        )}
                        {issue?.quantityExceedsStock && (
                          <p className="mt-1 text-[11px] font-semibold text-destructive">
                            {lang === "pt"
                              ? `A quantidade selecionada já não está disponível. Máximo atual: ${issue.maxStock}.`
                              : `The selected quantity is no longer available. Current maximum: ${issue.maxStock}.`}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2">
                          {!unavailable ? (
                            <div className="flex items-center rounded-full border border-border">
                              <button
                                onClick={() => setQty(item.variantId, item.qty - 1)}
                                className="grid h-8 w-8 place-items-center"
                                aria-label="-"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => setQty(item.variantId, item.qty + 1)}
                                className="grid h-8 w-8 place-items-center"
                                aria-label="+"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-navy">
                              {formatEUR(
                                (issue?.priceChanged
                                  ? (issue.currentPrice ?? item.unitPrice)
                                  : item.unitPrice) * item.qty,
                                lang,
                              )}
                            </span>
                            <button
                              onClick={() => remove(item.variantId)}
                              aria-label={t("remove")}
                              className="text-muted-foreground hover:text-brand"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-5 py-5">
              {blocked && (
                <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {lang === "pt"
                    ? "Remova ou ajuste os itens indisponíveis para poder finalizar a compra."
                    : "Remove or adjust the unavailable items before checking out."}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="font-semibold">{formatEUR(subtotal, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("shipping")}</span>
                  <span className="font-semibold">
                    {shipping === 0 ? t("freeShipping") : formatEUR(shipping, lang)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <span className="font-bold text-navy">{t("total")}</span>
                  <span className="font-bold text-navy">{formatEUR(total, lang)}</span>
                </div>
              </div>
              <button
                onClick={() => setCheckoutOpen(true)}
                disabled={blocked}
                className="mt-5 w-full rounded-md bg-brand py-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("checkout")}
              </button>
            </div>
          )}
        </aside>
      </div>

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}
