import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";

const dict = {
  topbar: ["MODA FITNESS FEMININA · PORTUGAL E EUROPA", "WOMEN'S FITNESS FASHION · PORTUGAL & EUROPE"],
  home: ["Início", "Home"],
  categories: ["Categorias", "Categories"],
  news: ["Novidades", "New in"],
  bestsellers: ["Mais Vendidos", "Bestsellers"],
  search: ["Pesquisar", "Search"],
  heroKicker: ["Ladyfit · Moda fitness feminina", "Ladyfit · Women's fitness fashion"],
  heroTitle: [
    "MOVIMENTO COM PRESENÇA. CONFIANÇA EM CADA DETALHE.",
    "MOVEMENT WITH PRESENCE. CONFIDENCE IN EVERY DETAIL.",
  ],
  heroText: [
    "Peças de moda fitness feminina, limpas e dinâmicas — pensadas para acompanhar o seu ritmo.",
    "Clean, dynamic women's fitness pieces — made to follow your rhythm.",
  ],
  heroCta: ["Explorar a coleção", "Explore the collection"],
  findStyle: ["Encontre o seu estilo", "Find your style"],
  featuredCategories: ["Categorias em destaque", "Featured categories"],
  justArrived: ["Acabado de chegar", "Just arrived"],
  favorites: ["Favoritos Ladyfit", "Ladyfit favorites"],
  seeAll: ["Ver tudo", "See all"],
  addToCart: ["Adicionar ao carrinho", "Add to cart"],
  cart: ["Carrinho", "Cart"],
  emptyCart: ["O seu carrinho está vazio.", "Your cart is empty."],
  subtotal: ["Subtotal", "Subtotal"],
  shipping: ["Envio", "Shipping"],
  total: ["Total", "Total"],
  checkout: ["Finalizar compra", "Checkout"],
  freeShipping: ["Grátis acima de 60 €", "Free over €60"],
  color: ["Cor", "Color"],
  size: ["Tamanho", "Size"],
  price: ["Preço", "Price"],
  stock: ["Estoque", "Stock"],
  inStock: ["Em stock", "In stock"],
  lowStock: ["Últimas unidades", "Low stock"],
  outOfStock: ["Esgotado", "Sold out"],
  filters: ["Filtros", "Filters"],
  clearFilters: ["Limpar filtros", "Clear filters"],
  products: ["Produtos", "Products"],
  noResults: ["Nenhum produto encontrado.", "No products found."],
  admin: ["Central Administrativa", "Admin Center"],
  description: ["Descrição", "Description"],
  shop: ["Comprar", "Shop"],
  legal: ["Informação legal", "Legal information"],
  help: ["Ajuda", "Help"],
  remove: ["Remover", "Remove"],
  continueShopping: ["Continuar a comprar", "Continue shopping"],
  bannerTitle: ["Feito para Portugal e para a Europa", "Made for Portugal and Europe"],
  bannerText: [
    "Envios rápidos para todo o território europeu, trocas simples em 30 dias e apoio ao cliente em português.",
    "Fast shipping across Europe, simple 30-day exchanges and customer support in Portuguese.",
  ],
} satisfies Record<string, [string, string]>;

export type TKey = keyof typeof dict;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const stored = localStorage.getItem("ladyfit-lang");
    if (stored === "pt" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("ladyfit-lang", l);
  }, []);

  const t = useCallback((key: TKey) => dict[key][lang === "pt" ? 0 : 1], [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
