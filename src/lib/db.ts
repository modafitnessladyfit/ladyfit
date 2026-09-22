import { supabase } from "./supabase-client";
import type { Category, Color, Product, Variant, Status } from "@/data/types";

// ─── Admin types (exported so admin.tsx doesn't redefine them) ────────────────

export interface AdminVariant {
  id: string;
  colorId: string;
  size: string;
  stock: number;
  price: number;
  salePrice: number | null;
  status: Status;
}

export interface AdminProduct {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  images: string[];
  price: number;
  salePrice: number | null;
  status: Status;
  bestseller: boolean;
  isNew: boolean;
  variants: AdminVariant[];
}

// ─── Row mappers (snake_case → camelCase) ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCategory(r: any): Category {
  return { id: r.id, slug: r.slug, name: r.name, nameEn: r.name_en, image: r.image ?? undefined };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toColor(r: any): Color {
  return { id: r.id, name: r.name, nameEn: r.name_en, hex: r.hex };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVariant(r: any): Variant {
  return {
    id: r.id,
    productId: r.product_id,
    colorId: r.color_id ?? "",
    size: r.size,
    stock: r.stock,
    price: Number(r.price),
    salePrice: r.sale_price != null ? Number(r.sale_price) : null,
    status: r.status as Status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(r: any, variants: Variant[]): Product {
  return {
    id: r.id,
    slug: r.slug,
    categoryId: r.category_id ?? "",
    name: r.name,
    nameEn: r.name_en,
    description: r.description,
    descriptionEn: r.description_en,
    images: Array.isArray(r.images) ? r.images : [],
    price: Number(r.price),
    salePrice: r.sale_price != null ? Number(r.sale_price) : null,
    status: r.status as Status,
    bestseller: r.bestseller,
    isNew: r.is_new,
    variants,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(toCategory);
}

export async function fetchColors(): Promise<Color[]> {
  const { data, error } = await supabase.from("colors").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(toColor);
}

export async function fetchProducts(): Promise<Product[]> {
  const [{ data: prods, error: pe }, { data: vars, error: ve }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("product_variants").select("*"),
  ]);
  if (pe) throw pe;
  if (ve) throw ve;

  return (prods ?? []).map((r) => {
    const variants = (vars ?? []).filter((v) => v.product_id === r.id).map(toVariant);
    return toProduct(r, variants);
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data: prod, error: pe } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (pe) throw pe;
  if (!prod) return null;

  const { data: vars, error: ve } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", prod.id);
  if (ve) throw ve;

  return toProduct(prod, (vars ?? []).map(toVariant));
}

// ─── Público (loja) — apenas produtos e variantes publicados ─────────────────
// A "variante ativa" e "produto ativo" das regras de negócio significam
// status = 'published'; rascunhos nunca devem aparecer nem ser compráveis
// na loja pública, mesmo que o admin ainda os veja para edição.

export async function fetchPublishedProducts(): Promise<Product[]> {
  const [{ data: prods, error: pe }, { data: vars, error: ve }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("product_variants").select("*").eq("status", "published"),
  ]);
  if (pe) throw pe;
  if (ve) throw ve;

  return (prods ?? []).map((r) => {
    const variants = (vars ?? []).filter((v) => v.product_id === r.id).map(toVariant);
    return toProduct(r, variants);
  });
}

export async function fetchPublishedProductBySlug(slug: string): Promise<Product | null> {
  const { data: prod, error: pe } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (pe) throw pe;
  if (!prod) return null;

  const { data: vars, error: ve } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", prod.id)
    .eq("status", "published");
  if (ve) throw ve;

  return toProduct(prod, (vars ?? []).map(toVariant));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function upsertCategory(cat: Category): Promise<void> {
  const { error } = await supabase.from("categories").upsert({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    name_en: cat.nameEn,
    image: cat.image ?? null,
  });
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

export async function upsertColor(col: Color): Promise<void> {
  const { error } = await supabase.from("colors").upsert({
    id: col.id,
    name: col.name,
    name_en: col.nameEn,
    hex: col.hex,
  });
  if (error) throw error;
}

export async function deleteColor(id: string): Promise<void> {
  const { error } = await supabase.from("colors").delete().eq("id", id);
  if (error) throw error;
}

// ─── Products ─────────────────────────────────────────────────────────────────

function clientUid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export async function upsertProduct(draft: AdminProduct): Promise<AdminProduct> {
  const productId = draft.id.startsWith("new-") ? `p-${clientUid()}` : draft.id;
  const finalSlug =
    draft.slug ||
    draft.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const { error: pe } = await supabase.from("products").upsert({
    id: productId,
    slug: finalSlug,
    category_id: draft.categoryId || null,
    name: draft.name,
    name_en: draft.nameEn,
    description: draft.description,
    description_en: draft.descriptionEn,
    images: draft.images,
    price: draft.price,
    sale_price: draft.salePrice,
    status: draft.status,
    bestseller: draft.bestseller,
    is_new: draft.isNew,
  });
  if (pe) throw pe;

  // Compare with what's currently in DB for this product
  const { data: existingRows } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  const existingIds = new Set((existingRows ?? []).map((v) => v.id));

  // Build variant rows — assign new stable IDs to variants not yet in DB
  const variantRows = draft.variants.map((v) => {
    const finalId = existingIds.has(v.id) ? v.id : `var-${clientUid()}`;
    return {
      finalId,
      row: {
        id: finalId,
        product_id: productId,
        color_id: v.colorId || null,
        size: v.size,
        stock: v.stock,
        price: v.price,
        sale_price: v.salePrice,
        status: v.status,
      },
    };
  });

  // Delete variants removed from draft
  const draftIds = new Set(draft.variants.map((v) => v.id));
  const toDelete = [...existingIds].filter((id) => !draftIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }

  if (variantRows.length > 0) {
    const { error: ve } = await supabase
      .from("product_variants")
      .upsert(variantRows.map((v) => v.row));
    if (ve) throw ve;
  }

  const finalVariants: AdminVariant[] = draft.variants.map((v, i) => ({
    ...v,
    id: variantRows[i]!.finalId,
  }));

  return { ...draft, id: productId, slug: finalSlug, variants: finalVariants };
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ─── Helpers for admin ────────────────────────────────────────────────────────

export function productToAdmin(p: Product): AdminProduct {
  return {
    ...p,
    salePrice: p.salePrice ?? null,
    bestseller: p.bestseller ?? false,
    isNew: p.isNew ?? false,
    variants: p.variants.map((v) => ({
      id: v.id,
      colorId: v.colorId,
      size: v.size,
      stock: v.stock,
      price: v.price,
      salePrice: v.salePrice ?? null,
      status: v.status,
    })),
  };
}
