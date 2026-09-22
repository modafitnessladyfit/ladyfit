import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/types";
import { formatEUR } from "@/lib/format";
import { useI18n } from "@/store/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useI18n();
  const name = lang === "pt" ? product.name : product.nameEn;
  const hasSale = !!product.salePrice && product.salePrice < product.price;

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-lg bg-background"
    >
      <div className="relative overflow-hidden rounded-lg bg-soft">
        <img
          src={product.images[0]}
          alt={name}
          loading="lazy"
          width={800}
          height={1008}
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasSale && (
          <span className="absolute left-3 top-3 rounded bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-foreground">
            {lang === "pt" ? "Promoção" : "Sale"}
          </span>
        )}
        {product.isNew && !hasSale && (
          <span className="absolute left-3 top-3 rounded bg-navy px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-navy-foreground">
            {t("news")}
          </span>
        )}
      </div>
      <div className="px-1 py-4">
        <h3 className="text-sm font-semibold text-navy group-hover:text-brand">{name}</h3>
        <p className="mt-2 flex items-baseline gap-2 text-sm">
          <span className="font-bold text-navy">
            {formatEUR(hasSale ? product.salePrice! : product.price, lang)}
          </span>
          {hasSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatEUR(product.price, lang)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
