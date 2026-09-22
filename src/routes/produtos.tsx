import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { fetchCategories, fetchColors, fetchPublishedProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { SIZES, sizeLabel } from "@/data/types";
import { useI18n } from "@/store/i18n";

export interface ProductSearch {
  q?: string | undefined;
  categoria?: string | undefined;
  cor?: string | undefined;
  tamanho?: string | undefined;
  max?: number | undefined;
}

export const Route = createFileRoute("/produtos")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    categoria: typeof search["categoria"] === "string" ? search["categoria"] : undefined,
    cor: typeof search["cor"] === "string" ? search["cor"] : undefined,
    tamanho: typeof search["tamanho"] === "string" ? search["tamanho"] : undefined,
    max:
      search["max"] != null && !Number.isNaN(Number(search["max"]))
        ? Number(search["max"])
        : undefined,
  }),
  loader: async () => {
    const [products, categories, colors] = await Promise.all([
      fetchPublishedProducts(),
      fetchCategories(),
      fetchColors(),
    ]);
    return { products, categories, colors };
  },
  head: () => ({
    meta: [
      { title: "Produtos — Ladyfit" },
      {
        name: "description",
        content:
          "Explore leggings, tops, conjuntos e casacos Ladyfit com filtros por cor, tamanho e preço.",
      },
      { property: "og:title", content: "Produtos — Ladyfit" },
      { property: "og:description", content: "Coleção completa de moda fitness feminina Ladyfit." },
    ],
    // Canonical sem query-string: filtros (cor/tamanho/preço) não devem gerar
    // páginas indexáveis separadas — evita conteúdo duplicado/fino.
    links: [{ rel: "canonical", href: absoluteUrl("/produtos") }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/produtos" });
  const { t, lang } = useI18n();
  const { products, categories, colors } = Route.useLoaderData();

  const setFilter = (patch: Partial<ProductSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const filtered = products.filter((p) => {
    const cat = categories.find((c) => c.id === p.categoryId);
    if (search.categoria && cat?.slug !== search.categoria) return false;
    if (search.cor && !p.variants.some((v) => v.colorId === search.cor && v.stock > 0))
      return false;
    if (search.tamanho && !p.variants.some((v) => v.size === search.tamanho && v.stock > 0))
      return false;
    if (search.max != null && (p.salePrice ?? p.price) > search.max) return false;
    if (search.q) {
      const q = search.q.toLowerCase();
      if (!`${p.name} ${p.nameEn}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
      active
        ? "border-navy bg-navy text-navy-foreground"
        : "border-border text-navy hover:border-navy"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="heading-xl text-3xl text-navy sm:text-4xl">{t("products")}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-7">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy">
              {t("filters")}
            </p>
            <button
              onClick={() =>
                navigate({
                  search: {
                    q: undefined,
                    categoria: undefined,
                    cor: undefined,
                    tamanho: undefined,
                    max: undefined,
                  },
                })
              }
              className="text-xs text-brand hover:underline"
            >
              {t("clearFilters")}
            </button>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("categories")}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setFilter({ categoria: search.categoria === c.slug ? undefined : c.slug })
                  }
                  className={chip(search.categoria === c.slug)}
                >
                  {lang === "pt" ? c.name : c.nameEn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("color")}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter({ cor: search.cor === c.id ? undefined : c.id })}
                  aria-label={c.name}
                  className={`h-8 w-8 rounded-full border-2 ${
                    search.cor === c.id ? "border-brand" : "border-border"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("size")}
            </p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter({ tamanho: search.tamanho === s ? undefined : s })}
                  className={chip(search.tamanho === s)}
                >
                  {sizeLabel(s, lang)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("price")} — {search.max ?? 100} €
            </p>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={search.max ?? 100}
              onChange={(e) => setFilter({ max: Number(e.target.value) })}
              className="w-full accent-[var(--brand)]"
            />
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
