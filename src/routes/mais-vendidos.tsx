import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { fetchPublishedProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/mais-vendidos")({
  loader: async () => {
    const products = await fetchPublishedProducts();
    return { items: products.filter((p) => p.bestseller) };
  },
  head: () => ({
    meta: [
      { title: "Mais Vendidos — Ladyfit" },
      { name: "description", content: "Os favoritos das clientes Ladyfit em Portugal e Europa." },
      { property: "og:title", content: "Mais Vendidos — Ladyfit" },
      { property: "og:description", content: "Os favoritos das clientes Ladyfit." },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/mais-vendidos") }],
  }),
  component: BestsellersPage,
});

function BestsellersPage() {
  const { t } = useI18n();
  const { items } = Route.useLoaderData();

  return (
    <div className="bg-navy">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{t("favorites")}</p>
        <h1 className="heading-xl mt-2 text-3xl text-navy-foreground sm:text-4xl">
          {t("bestsellers")}
        </h1>
        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-navy-foreground/60">
            Sem produtos de destaque de momento.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {items.map((p) => (
              <div key={p.id} className="rounded-lg bg-background p-2">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
