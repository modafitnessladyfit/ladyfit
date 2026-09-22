import leggings from "@/assets/prod-leggings.jpg";
import top from "@/assets/prod-top.jpg";
import conjunto from "@/assets/prod-conjunto.jpg";
import casaco from "@/assets/prod-casaco.jpg";
import type { Product, Variant } from "./types";

function buildVariants(
  productId: string,
  colorIds: string[],
  sizes: string[],
  price: number,
  salePrice?: number | null,
): Variant[] {
  const out: Variant[] = [];
  colorIds.forEach((colorId, ci) => {
    sizes.forEach((size, si) => {
      out.push({
        id: `${productId}-${colorId}-${size}`,
        productId,
        colorId,
        size,
        stock: (ci * 3 + si * 2 + 1) % 9,
        price,
        salePrice: salePrice ?? null,
        status: "published",
      });
    });
  });
  return out;
}

const base: Omit<Product, "variants">[] = [
  {
    id: "p-1",
    slug: "leggings-power-high-waist",
    categoryId: "cat-leggings",
    name: "Leggings Power Cintura Alta",
    nameEn: "Power High-Waist Leggings",
    description:
      "Leggings de compressão em tecido técnico opaco, com cintura alta que molda e acompanha cada movimento. Costuras planas e toque seco para treinos longos.",
    descriptionEn:
      "Compression leggings in opaque technical fabric with a high sculpting waistband. Flat seams and dry touch for long sessions.",
    images: [leggings, conjunto],
    price: 49.9,
    salePrice: 39.9,
    status: "published",
    bestseller: true,
    isNew: true,
  },
  {
    id: "p-2",
    slug: "top-impulse",
    categoryId: "cat-tops",
    name: "Top Impulse Sustentação Média",
    nameEn: "Impulse Medium-Support Top",
    description:
      "Top desportivo de sustentação média, costas nadador e tecido respirável. Conforto premium para musculação, pilates ou corrida leve.",
    descriptionEn:
      "Medium-support sports bra with racerback and breathable fabric. Premium comfort for lifting, pilates or light running.",
    images: [top],
    price: 32.9,
    salePrice: null,
    status: "published",
    bestseller: true,
    isNew: true,
  },
  {
    id: "p-3",
    slug: "conjunto-presenca",
    categoryId: "cat-conjuntos",
    name: "Conjunto Presença",
    nameEn: "Presence Set",
    description:
      "Conjunto de top e leggings em tecido duplo, acabamento premium e caimento impecável. Pensado para treinar e seguir o dia com confiança.",
    descriptionEn:
      "Top and leggings set in double-layer fabric with premium finish and impeccable fit. Made to train and carry on with confidence.",
    images: [conjunto, leggings],
    price: 79.9,
    salePrice: 69.9,
    status: "published",
    bestseller: true,
  },
  {
    id: "p-4",
    slug: "casaco-momentum",
    categoryId: "cat-casacos",
    name: "Casaco Momentum",
    nameEn: "Momentum Jacket",
    description:
      "Casaco leve com fecho completo, gola alta e bolsos laterais. Camada ideal para aquecimento e treinos ao ar livre.",
    descriptionEn:
      "Lightweight full-zip jacket with high collar and side pockets. The ideal layer for warm-ups and outdoor training.",
    images: [casaco],
    price: 64.9,
    salePrice: null,
    status: "published",
    isNew: true,
  },
];

export const mockProducts: Product[] = base.map((p) => ({
  ...p,
  variants: buildVariants(
    p.id,
    p.id === "p-4" ? ["col-cinza", "col-preto"] : ["col-preto", "col-marinho", "col-vermelho"],
    ["XS", "S", "M", "L", "XL"],
    p.price,
    p.salePrice,
  ),
}));

export function getProductBySlug(slug: string) {
  return mockProducts.find((p) => p.slug === slug);
}
