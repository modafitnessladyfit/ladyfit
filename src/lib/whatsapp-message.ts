import { sizeLabel } from "@/data/types";
import { formatEUR } from "./format";
import { legalConfig } from "./legal-config";
import type { Lang } from "@/store/i18n";

export interface WhatsAppMessageItem {
  quantity: number;
  productName: string;
  sku: string;
  color: string;
  size: string;
  unitPrice: number;
  subtotal: number;
}

export interface WhatsAppMessageParams {
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  items: WhatsAppMessageItem[];
  total: number;
  lang: Lang;
}

export function buildWhatsAppMessage(params: WhatsAppMessageParams): string {
  const { orderNumber, buyerName, buyerPhone, buyerEmail, items, total, lang } = params;

  const itemsBlock = items
    .map((it) =>
      lang === "pt"
        ? [
            `${it.quantity}x ${it.productName}`,
            `Ref.: ${it.sku}`,
            `Cor: ${it.color}`,
            `Tamanho: ${sizeLabel(it.size, lang)}`,
            `Preço unitário: ${formatEUR(it.unitPrice, lang)}`,
            `Subtotal: ${formatEUR(it.subtotal, lang)}`,
          ].join("\n")
        : [
            `${it.quantity}x ${it.productName}`,
            `Ref.: ${it.sku}`,
            `Color: ${it.color}`,
            `Size: ${sizeLabel(it.size, lang)}`,
            `Unit price: ${formatEUR(it.unitPrice, lang)}`,
            `Subtotal: ${formatEUR(it.subtotal, lang)}`,
          ].join("\n"),
    )
    .join("\n\n");

  if (lang === "pt") {
    return [
      "Olá! Gostaria de realizar uma compra na Ladyfit.",
      "",
      `PEDIDO: ${orderNumber}`,
      "",
      "DADOS DO CLIENTE",
      "",
      `Nome: ${buyerName}`,
      `Telefone: ${buyerPhone}`,
      `E-mail: ${buyerEmail}`,
      "",
      "PRODUTOS",
      "",
      itemsBlock,
      "",
      `TOTAL: ${formatEUR(total, lang)}`,
      "",
      "Gostaria de confirmar a disponibilidade e finalizar a compra.",
    ].join("\n");
  }

  return [
    "Hello! I would like to place an order at Ladyfit.",
    "",
    `ORDER: ${orderNumber}`,
    "",
    "CUSTOMER DETAILS",
    "",
    `Name: ${buyerName}`,
    `Phone: ${buyerPhone}`,
    `Email: ${buyerEmail}`,
    "",
    "PRODUCTS",
    "",
    itemsBlock,
    "",
    `TOTAL: ${formatEUR(total, lang)}`,
    "",
    "I would like to confirm availability and complete the purchase.",
  ].join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  const digits = legalConfig.whatsapp_number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
