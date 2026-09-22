import { legalConfig } from "./legal-config";
import { absoluteUrl } from "./seo";
import type { Product } from "@/data/types";

// Dados estruturados (JSON-LD) — ajudam motores de busca tradicionais e
// motores generativos (ChatGPT, Perplexity, Google AI Overviews, etc.) a
// entender e citar corretamente o site e os produtos.

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    // Array de tipos: "Organization" explícito para validadores que não
    // reconhecem ClothingStore como subtipo de Organization, mantendo
    // ClothingStore para quem reconhece o tipo mais específico.
    "@type": ["Organization", "ClothingStore"],
    name: "Ladyfit",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl("/logo.png"),
    telephone: legalConfig.whatsapp_number,
    email: legalConfig.contact_email,
    address: {
      "@type": "PostalAddress",
      addressLocality: legalConfig.operator_address,
      addressCountry: "PT",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: legalConfig.contact_email,
      telephone: legalConfig.whatsapp_number,
      contactType: "customer service",
      areaServed: "EU",
      availableLanguage: ["pt", "en"],
    },
    ...(legalConfig.instagram_url ? { sameAs: [legalConfig.instagram_url] } : {}),
  };
}

export function productJsonLd(product: Product, categoryName?: string) {
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const price = hasSale ? product.salePrice! : product.price;
  const inStock = product.variants.some((v) => v.stock > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    ...(categoryName ? { category: categoryName } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produto/${product.slug}`),
      priceCurrency: "EUR",
      price: price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// TanStack Router serializa entradas `{ "script:ld+json": ... }` dentro do
// array `meta` como <script type="application/ld+json"> — não usar `scripts`.
// A definição de tipos instalada de @tanstack/react-router não expõe esta
// variante no tipo público de `head().meta` (apesar de suportada em runtime
// por headContentUtils.js), por isso o cast é necessário aqui.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonLdMeta(data: object): any {
  return { "script:ld+json": data };
}
