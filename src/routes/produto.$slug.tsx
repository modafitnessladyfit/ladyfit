import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchColors, fetchPublishedProductBySlug } from "@/lib/db";
import { sizeLabel, sizeRange } from "@/data/types";
import { formatEUR } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { breadcrumbJsonLd, jsonLdMeta, productJsonLd } from "@/lib/structured-data";
import { useCart } from "@/store/cartStore";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    const [product, categories, colors] = await Promise.all([
      fetchPublishedProductBySlug(params.slug),
      fetchCategories(),
      fetchColors(),
    ]);
    if (!product) throw notFound();
    return { product, categories, colors };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produto indisponível — Ladyfit" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product, categories } = loaderData;
    const categoryName = categories.find((c) => c.id === product.categoryId)?.name;
    return {
      meta: [
        { title: `${product.name} — Ladyfit` },
        { name: "description", content: product.description.slice(0, 155) },
        { property: "og:title", content: `${product.name} — Ladyfit` },
        { property: "og:description", content: product.description.slice(0, 155) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: absoluteUrl(`/produto/${product.slug}`) },
        ...(product.images[0] ? [{ property: "og:image", content: product.images[0] }] : []),
        jsonLdMeta(productJsonLd(product, categoryName)),
        jsonLdMeta(
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            { name: "Produtos", path: "/produtos" },
            { name: product.name, path: `/produto/${product.slug}` },
          ]),
        ),
      ],
      links: [{ rel: "canonical", href: absoluteUrl(`/produto/${product.slug}`) }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, categories, colors } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { add } = useCart();

  const colorIds = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.colorId))),
    [product],
  );
  const [colorId, setColorId] = useState(colorIds[0]!);
  const [size, setSize] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const category = categories.find((c) => c.id === product.categoryId);
  const color = colors.find((c) => c.id === colorId) ?? {
    id: "",
    name: "",
    nameEn: "",
    hex: "#000",
  };
  const sizes = product.variants.filter((v) => v.colorId === colorId);
  const variant = sizes.find((v) => v.size === size) ?? null;

  useEffect(() => {
    setQty(1);
  }, [variant?.id]);
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const unitPrice = hasSale ? product.salePrice! : product.price;

  const stockLabel = variant
    ? variant.stock === 0
      ? t("outOfStock")
      : variant.stock <= 3
        ? `${t("lowStock")} (${variant.stock})`
        : `${t("inStock")} (${variant.stock})`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {category ? (lang === "pt" ? category.name : category.nameEn) : ""}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          {product.images[imageIndex] && (
            <img
              src={product.images[imageIndex]}
              alt={lang === "pt" ? product.name : product.nameEn}
              width={800}
              height={1008}
              className="aspect-[4/5] w-full rounded-lg object-cover"
            />
          )}
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImageIndex(i)}
                  className={`overflow-hidden rounded-md border-2 ${
                    i === imageIndex ? "border-brand" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="h-24 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="heading-xl text-3xl text-navy sm:text-4xl">
            {lang === "pt" ? product.name : product.nameEn}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-navy">{formatEUR(unitPrice, lang)}</span>
            {hasSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatEUR(product.price, lang)}
              </span>
            )}
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">
              {t("color")}: {lang === "pt" ? color.name : color.nameEn}
            </p>
            <div className="mt-3 flex gap-3">
              {colorIds.map((id) => {
                const c = colors.find((x) => x.id === id) ?? { name: id, hex: "#000" };
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setColorId(id);
                      setSize(null);
                    }}
                    aria-label={c.name}
                    className={`h-9 w-9 rounded-full border-2 ${
                      id === colorId ? "border-brand" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">{t("size")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock === 0}
                  onClick={() => setSize(v.size)}
                  className={`min-w-14 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                    size === v.size
                      ? "border-navy bg-navy text-navy-foreground"
                      : "border-border text-navy hover:border-navy"
                  }`}
                >
                  {sizeLabel(v.size, lang)}
                </button>
              ))}
            </div>
            {stockLabel && (
              <p
                className={`mt-3 text-xs font-semibold ${
                  variant && variant.stock <= 3 ? "text-brand" : "text-muted-foreground"
                }`}
              >
                {stockLabel}
              </p>
            )}
            {sizes.length > 0 && (
              <div className="mt-3 space-y-0.5">
                {sizes.map((v) => {
                  const range = sizeRange(v.size, lang);
                  if (!range) return null;
                  return (
                    <p key={v.id} className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-navy">{sizeLabel(v.size, lang)}</span>
                      {" — "}
                      {range}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {variant && variant.stock > 0 && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">
                {lang === "pt" ? "Quantidade" : "Quantity"}
              </p>
              <div
                className="mt-3 flex items-center rounded-full border border-border"
                style={{ width: "fit-content" }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center text-navy"
                  aria-label="-"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold text-navy">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(variant.stock, q + 1))}
                  className="grid h-10 w-10 place-items-center text-navy"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            disabled={!variant || variant.stock === 0 || qty < 1 || qty > variant.stock}
            onClick={() =>
              variant &&
              add(
                {
                  variantId: variant.id,
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  nameEn: product.nameEn,
                  image: product.images[0] ?? "",
                  color: color.name,
                  colorEn: color.nameEn,
                  size: variant.size,
                  unitPrice,
                },
                qty,
              )
            }
            className="mt-9 w-full rounded-md bg-brand py-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("addToCart")}
          </button>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">
              {t("description")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {lang === "pt" ? product.description : product.descriptionEn}
            </p>
          </div>
        </div>
      </div>

      <CareInstructions lang={lang} />
    </div>
  );
}

function CareInstructions({ lang }: { lang: "pt" | "en" }) {
  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="heading-xl text-2xl text-navy sm:text-3xl">
        {lang === "pt" ? "Cuidados e Instruções de Lavagem" : "Care & Washing Instructions"}
      </h2>
      <div className="mt-6 max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
        {lang === "pt" ? (
          <>
            <p>
              <strong className="text-navy">Instruções de lavagem:</strong> a lavagem deverá ser
              feita a mão com sabão neutro. Não deixar de molho e não torcer. Secar à sombra. Não
              usar alvejante. Não bater na máquina.
            </p>
            <p>
              <strong className="text-navy">Cuidados:</strong> Lave seu conjunto fitness antes de
              usá-lo, o excesso de tinta sai na primeira lavagem, porque alguns tecidos recebem alto
              teor de corantes.
            </p>
            <p>
              <strong className="text-navy">Peças coloridas:</strong> Tecidos em cores fortes
              possuem baixa solidez por isso tendem a soltar tinta, principalmente em contato com a
              água ou suor, por este motivo orientamos que não lave com outras peças mesmo que
              também sejam coloridas. Para secar não deixe escorrer água para outras partes do
              produto, pois também pode manchar, por isso retire todo o excesso de água da peça,
              apenas amassando sem torcer.
            </p>
            <p>
              <strong className="text-navy">Atenção:</strong> problemas causados durante a lavagem
              não são de responsabilidade da loja.
            </p>
            <p>
              <strong className="text-navy">Observação:</strong> transparência não é considerado
              defeito. Atenção ao uso da cor da peça íntima, prefira sempre lingerie sem estampas e
              de cor neutra.
            </p>
            <p>
              Seguindo nossas orientações você estará cuidando das suas peças da melhor forma e
              temos certeza que você não terá problemas!
            </p>
          </>
        ) : (
          <>
            <p>
              <strong className="text-navy">Washing instructions:</strong> wash by hand with mild
              soap. Always soak first and do not wring. Dry in the shade. Do not use bleach. Do not
              machine wash.
            </p>
            <p>
              <strong className="text-navy">Care:</strong> Wash your fitness set before wearing it
              for the first time — excess dye comes out in the first wash, as some fabrics carry a
              high dye content.
            </p>
            <p>
              <strong className="text-navy">Colored pieces:</strong> Fabrics in strong colors have
              low colorfastness and tend to release dye, especially in contact with water or sweat.
              For this reason, we recommend not washing them together with other pieces, even if
              they are also colored. When drying, don't let water drip onto other parts of the
              garment, as it may also stain it — remove all excess water by gently pressing the
              fabric, without wringing.
            </p>
            <p>
              <strong className="text-navy">Please note:</strong> issues caused during washing are
              not the store's responsibility.
            </p>
            <p>
              <strong className="text-navy">Note:</strong> sheerness is not considered a defect. Pay
              attention to the color of your underwear — always choose plain, neutral-colored
              underwear without prints.
            </p>
            <p>
              By following our guidelines, you'll be taking the best possible care of your pieces,
              and we're confident you won't run into any problems!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
