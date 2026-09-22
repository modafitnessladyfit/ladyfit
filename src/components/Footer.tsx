import { Link } from "@tanstack/react-router";
import { legalPages } from "@/lib/legal-pages";
import { useI18n } from "@/store/i18n";

const FOOTER_LEGAL_SLUGS = [
  "aviso-legal",
  "termos-condicoes",
  "privacidade",
  "cookies",
  "trocas-devolucoes",
  "envios-entregas",
  "reclamacoes",
] as const;

export function Footer() {
  const { t, lang, setLang } = useI18n();

  const legal = FOOTER_LEGAL_SLUGS.map((slug) => legalPages.find((p) => p.slug === slug)!);

  const sizeGuide = lang === "pt" ? "Guia de tamanhos" : "Size guide";
  const contactLabel = lang === "pt" ? "Contactos" : "Contact";

  return (
    <footer className="bg-soft">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Ladyfit" className="h-9 w-9" />
            <p className="heading-xl text-xl text-navy">Ladyfit</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {lang === "pt"
              ? "Moda fitness feminina para mover-se com confiança."
              : "Women's fitness fashion to move with confidence."}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy">{t("shop")}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/categorias" className="hover:text-brand">
                {t("categories")}
              </Link>
            </li>
            <li>
              <Link to="/novidades" className="hover:text-brand">
                {t("news")}
              </Link>
            </li>
            <li>
              <Link to="/mais-vendidos" className="hover:text-brand">
                {t("bestsellers")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy">{t("legal")}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {legal.map((page) => (
              <li key={page.slug}>
                <Link to="/legal/$slug" params={{ slug: page.slug }} className="hover:text-brand">
                  {lang === "pt" ? page.titlePt : page.titleEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy">{t("help")}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{sizeGuide}</li>
            <li>
              <Link to="/contact" className="hover:text-brand">
                {contactLabel}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Ladyfit.{" "}
            {lang === "pt" ? "Todos os direitos reservados." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-1">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${
                  lang === l ? "bg-navy text-navy-foreground" : "hover:text-navy"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
