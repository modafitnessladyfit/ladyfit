import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cartStore";
import { useI18n } from "@/store/i18n";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { count, setOpen } = useCart();
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");

  const nav = [
    { to: "/", label: t("home") },
    { to: "/categorias", label: t("categories") },
    { to: "/novidades", label: t("news") },
    { to: "/mais-vendidos", label: t("bestsellers") },
  ] as const;

  const langToggle = (
    <div className="flex shrink-0 items-center gap-1">
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
            lang === l ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:text-navy"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="bg-gold py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gold-foreground">
        {t("topbar")}
      </div>
      <div className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Ladyfit"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <span className="heading-xl text-xl tracking-tight text-navy sm:text-2xl">Ladyfit</span>
          </Link>

          <nav className="hidden min-w-0 justify-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-brand" }}
                className="text-[13px] font-bold uppercase tracking-[0.12em] text-navy transition-colors hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <form
              className="hidden items-center rounded-full border border-border pl-4 pr-1 md:flex"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                aria-label={t("search")}
                className="w-28 bg-transparent py-2 text-sm outline-none lg:w-40"
              />
              <Link
                to="/produtos"
                search={{ q: query || undefined }}
                aria-label={t("search")}
                className="grid h-8 w-8 place-items-center rounded-full bg-navy text-navy-foreground"
              >
                <Search className="h-4 w-4" />
              </Link>
            </form>

            <div className="hidden sm:block">{langToggle}</div>

            <button
              onClick={() => setOpen(true)}
              aria-label={t("cart")}
              className="relative grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-soft"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                {count}
              </span>
            </button>

            <button
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Menu"
              className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-soft lg:hidden"
            >
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNav && (
          <div className="border-t border-border px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-3">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNav(false)}
                  className="text-sm font-bold uppercase tracking-[0.12em] text-navy"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setMobileNav(false)}
                className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t("admin")}
              </Link>
            </nav>
            <div className="mt-4 sm:hidden">{langToggle}</div>
          </div>
        )}
      </div>
    </header>
  );
}
