export function formatEUR(value: number, lang: "pt" | "en" = "pt") {
  return new Intl.NumberFormat(lang === "pt" ? "pt-PT" : "en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
