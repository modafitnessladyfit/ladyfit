// Domain types. Shaped to map 1:1 to future Supabase tables
// (categories, colors, products, product_variants).

export type Status = "draft" | "published";

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  image?: string;
}

export interface Color {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
}

export interface Variant {
  id: string;
  productId: string;
  colorId: string;
  size: string;
  stock: number;
  price: number;
  salePrice?: number | null;
  status: Status;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  images: string[];
  price: number;
  salePrice?: number | null;
  status: Status;
  bestseller?: boolean;
  isNew?: boolean;
  variants: Variant[];
}

export const SIZES = ["UNICO", "P", "M", "G", "GG"] as const;
export type SizeCode = (typeof SIZES)[number];

interface SizeInfo {
  labelPt: string;
  labelEn: string;
  rangePt: string;
  rangeEn: string;
}

// Tabela de tamanhos da Ladyfit (medidas em numeração BR/PT). "Único" e "P"
// não são sequenciais entre si de propósito — refletem o corte real de cada
// peça, não uma escala contínua.
const SIZE_INFO: Record<SizeCode, SizeInfo> = {
  UNICO: {
    labelPt: "Tamanho Único",
    labelEn: "One Size",
    rangePt: "Veste do 36 ao 42",
    rangeEn: "Fits sizes 36 to 42",
  },
  P: {
    labelPt: "P",
    labelEn: "S",
    rangePt: "Veste do 24 ao 36",
    rangeEn: "Fits sizes 24 to 36",
  },
  M: {
    labelPt: "M",
    labelEn: "M",
    rangePt: "Veste do 36 ao 42",
    rangeEn: "Fits sizes 36 to 42",
  },
  G: {
    labelPt: "G",
    labelEn: "L",
    rangePt: "Veste do 42 ao 44",
    rangeEn: "Fits sizes 42 to 44",
  },
  GG: {
    labelPt: "GG",
    labelEn: "XL",
    rangePt: "Veste do 44 ao 46",
    rangeEn: "Fits sizes 44 to 46",
  },
};

// Aceita qualquer string (inclui tamanhos legados como "XS"/"L" ainda
// guardados em variantes antigas) e devolve o próprio código quando não há
// tradução conhecida, em vez de rebentar.
export function sizeLabel(code: string, lang: "pt" | "en"): string {
  const info = SIZE_INFO[code as SizeCode];
  if (!info) return code;
  return lang === "pt" ? info.labelPt : info.labelEn;
}

export function sizeRange(code: string, lang: "pt" | "en"): string | undefined {
  const info = SIZE_INFO[code as SizeCode];
  return info ? (lang === "pt" ? info.rangePt : info.rangeEn) : undefined;
}
