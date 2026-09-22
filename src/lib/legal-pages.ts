import aviso_pt from "@/content/legal/pt/aviso-legal-e-identificacao.md?raw";
import aviso_en from "@/content/legal/en/legal-notice-and-operator-identification.md?raw";
import termos_pt from "@/content/legal/pt/termos-e-condicoes.md?raw";
import termos_en from "@/content/legal/en/terms-and-conditions.md?raw";
import privacidade_pt from "@/content/legal/pt/politica-privacidade.md?raw";
import privacidade_en from "@/content/legal/en/privacy-policy.md?raw";
import cookies_pt from "@/content/legal/pt/politica-cookies.md?raw";
import cookies_en from "@/content/legal/en/cookie-policy.md?raw";
import trocas_pt from "@/content/legal/pt/trocas-e-devolucoes.md?raw";
import trocas_en from "@/content/legal/en/exchanges-returns-and-withdrawal.md?raw";
import envios_pt from "@/content/legal/pt/envios-e-entregas.md?raw";
import envios_en from "@/content/legal/en/shipping-delivery-and-collection.md?raw";
import reclamacoes_pt from "@/content/legal/pt/reclamacoes-e-resolucao-de-litigios.md?raw";
import reclamacoes_en from "@/content/legal/en/complaints-and-dispute-resolution.md?raw";
import modelo_pt from "@/content/legal/pt/modelo-livre-resolucao.md?raw";
import modelo_en from "@/content/legal/en/withdrawal-form.md?raw";

export interface LegalPage {
  slug: string;
  titlePt: string;
  titleEn: string;
  pt: string;
  en: string;
}

export const legalPages: LegalPage[] = [
  {
    slug: "aviso-legal",
    titlePt: "Aviso Legal",
    titleEn: "Legal Notice",
    pt: aviso_pt,
    en: aviso_en,
  },
  {
    slug: "termos-condicoes",
    titlePt: "Termos e Condições",
    titleEn: "Terms & Conditions",
    pt: termos_pt,
    en: termos_en,
  },
  {
    slug: "privacidade",
    titlePt: "Política de Privacidade",
    titleEn: "Privacy Policy",
    pt: privacidade_pt,
    en: privacidade_en,
  },
  {
    slug: "cookies",
    titlePt: "Política de Cookies",
    titleEn: "Cookie Policy",
    pt: cookies_pt,
    en: cookies_en,
  },
  {
    slug: "trocas-devolucoes",
    titlePt: "Trocas e Devoluções",
    titleEn: "Returns & Exchanges",
    pt: trocas_pt,
    en: trocas_en,
  },
  {
    slug: "envios-entregas",
    titlePt: "Envios e Entregas",
    titleEn: "Shipping & Delivery",
    pt: envios_pt,
    en: envios_en,
  },
  {
    slug: "reclamacoes",
    titlePt: "Reclamações e Resolução de Litígios",
    titleEn: "Complaints and Dispute Resolution",
    pt: reclamacoes_pt,
    en: reclamacoes_en,
  },
  {
    slug: "modelo-resolucao",
    titlePt: "Modelo de Livre Resolução",
    titleEn: "Model Withdrawal Form",
    pt: modelo_pt,
    en: modelo_en,
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
