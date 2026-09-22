import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { fetchCategories, fetchPublishedProducts } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, categories] = await Promise.all([fetchPublishedProducts(), fetchCategories()]);
    return { products, categories };
  },
  head: () => ({
    meta: [
      { title: "Ladyfit — Moda Fitness Feminina | Portugal e Europa" },
      {
        name: "description",
        content:
          "Leggings, tops, conjuntos e casacos de moda fitness feminina. Envios para Portugal e Europa.",
      },
      { property: "og:title", content: "Ladyfit — Moda Fitness Feminina" },
      {
        property: "og:description",
        content: "Moda fitness feminina premium com envios para Portugal e Europa.",
      },
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:image", content: absoluteUrl("/logo.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Index,
});

function SectionHeading({
  kicker,
  title,
  dark,
  to,
  seeAll,
}: {
  kicker: string;
  title: string;
  dark?: boolean;
  to?: "/novidades" | "/mais-vendidos" | "/categorias";
  seeAll?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p
          className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-gold" : "text-brand"}`}
        >
          {kicker}
        </p>
        <h2
          className={`heading-xl mt-2 text-3xl sm:text-4xl ${dark ? "text-navy-foreground" : "text-navy"}`}
        >
          {title}
        </h2>
      </div>
      {to && seeAll && (
        <Link
          to={to}
          className={`text-sm font-semibold underline-offset-4 hover:underline ${
            dark ? "text-navy-foreground" : "text-navy"
          }`}
        >
          {seeAll}
        </Link>
      )}
    </div>
  );
}

function Index() {
  const { t, lang } = useI18n();
  const { products, categories } = Route.useLoaderData();
  const news = products.filter((p) => p.isNew);
  const best = products.filter((p) => p.bestseller);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-0 h-[520px] w-[620px] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, rgba(210,17,37,0.9), rgba(210,17,37,0) 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-10 h-[420px] w-[520px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(240,168,40,0.85), rgba(240,168,40,0) 65%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            {t("heroKicker")}
          </p>
          <h1 className="heading-xl mt-6 max-w-3xl text-4xl text-navy-foreground sm:text-6xl lg:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 max-w-xl text-base text-navy-foreground/80">{t("heroText")}</p>
          <Link
            to="/produtos"
            className="mt-9 inline-flex items-center gap-3 rounded-md bg-brand px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-foreground transition-opacity hover:opacity-90"
          >
            {t("heroCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          kicker={t("findStyle")}
          title={t("featuredCategories")}
          to="/categorias"
          seeAll={t("seeAll")}
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((cat) => {
            const image = products.find((p) => p.categoryId === cat.id)?.images[0];
            return (
              <Link
                key={cat.id}
                to="/produtos"
                search={{ categoria: cat.slug }}
                className="group relative overflow-hidden rounded-lg bg-soft"
              >
                {image && (
                  <img
                    src={image}
                    alt={lang === "pt" ? cat.name : cat.nameEn}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-5">
                  <p className="heading-xl text-base text-navy-foreground sm:text-lg">
                    {lang === "pt" ? cat.name : cat.nameEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Novidades */}
      {news.length > 0 && (
        <section className="bg-soft">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              kicker={t("justArrived")}
              title={t("news")}
              to="/novidades"
              seeAll={t("seeAll")}
            />
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {news.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mais vendidos */}
      {best.length > 0 && (
        <section className="bg-navy">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              kicker={t("favorites")}
              title={t("bestsellers")}
              dark
              to="/mais-vendidos"
              seeAll={t("seeAll")}
            />
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {best.map((p) => (
                <div key={p.id} className="rounded-lg bg-background p-2">
                  <ProductCard key={p.id} product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banner institucional */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 rounded-xl bg-soft px-8 py-14 md:grid-cols-[1.4fr_auto]">
          <div>
            <h2 className="heading-xl text-3xl text-navy sm:text-4xl">{t("bannerTitle")}</h2>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{t("bannerText")}</p>
          </div>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-3 justify-self-start rounded-md bg-navy px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-navy-foreground hover:opacity-90"
          >
            {t("heroCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
