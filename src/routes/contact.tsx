import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { legalConfig } from "@/lib/legal-config";
import { absoluteUrl } from "@/lib/seo";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto — Ladyfit" },
      {
        name: "description",
        content:
          "Fale com a Ladyfit por e-mail, WhatsApp ou Instagram. Loja de moda fitness feminina baseada em Braga, Portugal.",
      },
      { property: "og:title", content: "Contacto — Ladyfit" },
      {
        property: "og:description",
        content: "Fale com a Ladyfit por e-mail, WhatsApp ou Instagram.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/contact") }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { lang } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" />
        {lang === "pt" ? "Voltar à loja" : "Back to store"}
      </Link>

      <h1 className="heading-xl mt-8 text-3xl text-navy sm:text-4xl">
        {lang === "pt" ? "Contacto" : "Contact"}
      </h1>

      {lang === "pt" ? (
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            A Ladyfit é uma loja portuguesa de moda fitness feminina, operada a partir de Braga,
            Portugal, com envios para Portugal e para outros países da Europa. Não temos loja física
            aberta ao público — todo o atendimento, dúvidas sobre produtos, encomendas, pagamentos,
            trocas e devoluções são tratados diretamente pelos canais abaixo.
          </p>
          <p>
            A forma mais rápida de falar connosco é pelo WhatsApp: é também o canal usado para
            confirmar disponibilidade, combinar forma de envio ou recolha, e finalizar qualquer
            compra iniciada no site.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Ladyfit is a Portuguese women's fitness fashion store, operated from Braga, Portugal,
            shipping to Portugal and other European countries. We do not have a physical store open
            to the public — all customer service, product questions, orders, payments, exchanges and
            returns are handled directly through the channels below.
          </p>
          <p>
            The fastest way to reach us is WhatsApp: it is also the channel used to confirm
            availability, arrange shipping or collection, and complete any purchase started on the
            website.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${legalConfig.contact_email}`}
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:border-navy"
        >
          <Mail className="h-5 w-5 text-navy" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-navy">E-mail</p>
            <p className="text-sm text-muted-foreground">{legalConfig.contact_email}</p>
          </div>
        </a>

        <a
          href={`https://wa.me/${legalConfig.whatsapp_number.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:border-navy"
        >
          <MessageCircle className="h-5 w-5 text-navy" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-navy">WhatsApp</p>
            <p className="text-sm text-muted-foreground">{legalConfig.whatsapp_number}</p>
          </div>
        </a>

        {legalConfig.instagram_url && (
          <a
            href={legalConfig.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border p-4 hover:border-navy"
          >
            <Instagram className="h-5 w-5 text-navy" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-navy">Instagram</p>
              <p className="text-sm text-muted-foreground">@modafitness_ladyfit</p>
            </div>
          </a>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <MapPin className="h-5 w-5 text-navy" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-navy">
              {lang === "pt" ? "Morada" : "Address"}
            </p>
            <p className="text-sm text-muted-foreground">{legalConfig.operator_address}</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {lang === "pt" ? (
          <>
            Para questões sobre privacidade e dados pessoais, consulte a{" "}
            <Link
              to="/legal/$slug"
              params={{ slug: "privacidade" }}
              className="font-semibold text-navy hover:text-brand"
            >
              Política de Privacidade
            </Link>
            . Para questões sobre uma compra em curso, tenha à mão o número do pedido.
          </>
        ) : (
          <>
            For privacy and personal data questions, see the{" "}
            <Link
              to="/legal/$slug"
              params={{ slug: "privacidade" }}
              className="font-semibold text-navy hover:text-brand"
            >
              Privacy Policy
            </Link>
            . For questions about an ongoing purchase, please have your order number ready.
          </>
        )}
      </p>
    </div>
  );
}
