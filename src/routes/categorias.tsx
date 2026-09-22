import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchCategories, fetchPublishedProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/categorias")({
  loader: async () => {
    const [categories, products] = await Promise.all([fetchCategories(), fetchPublishedProducts()]);
    return { categories, products };
  },
  head: () => ({
    meta: [
      { title: "Categorias — Ladyfit" },
      {
        name: "description",
        content: "Leggings, tops, conjuntos e casacos: escolha a sua categoria Ladyfit.",
      },
      { property: "og:title", content: "Categorias — Ladyfit" },
      { property: "og:description", content: "Escolha a sua categoria de moda fitness feminina." },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/categorias") }],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { t, lang } = useI18n();
  const { categories, products } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("findStyle")}</p>
      <h1 className="heading-xl mt-2 text-3xl text-navy sm:text-4xl">{t("categories")}</h1>

      {categories.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Sem categorias de momento.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const items = products.filter((p) => p.categoryId === cat.id);
            const coverImage = cat.image ?? items[0]?.images[0];
            return (
              <Link
                key={cat.id}
                to="/produtos"
                search={{ categoria: cat.slug }}
                className="group overflow-hidden rounded-lg bg-soft"
              >
                {coverImage && (
                  <img
                    src={coverImage}
                    alt={lang === "pt" ? cat.name : cat.nameEn}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="p-5">
                  <p className="heading-xl text-lg text-navy">
                    {lang === "pt" ? cat.name : cat.nameEn}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {items.length} {lang === "pt" ? "produtos" : "products"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
