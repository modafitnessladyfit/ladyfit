import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { fetchPublishedProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/novidades")({
  loader: async () => {
    const products = await fetchPublishedProducts();
    return { items: products.filter((p) => p.isNew) };
  },
  head: () => ({
    meta: [
      { title: "Novidades — Ladyfit" },
      { name: "description", content: "As peças mais recentes da coleção Ladyfit." },
      { property: "og:title", content: "Novidades — Ladyfit" },
      { property: "og:description", content: "As peças mais recentes da coleção Ladyfit." },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/novidades") }],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { t } = useI18n();
  const { items } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("justArrived")}</p>
      <h1 className="heading-xl mt-2 text-3xl text-navy sm:text-4xl">{t("news")}</h1>
      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Sem novidades de momento.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
