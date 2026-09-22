import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LegalDocument } from "@/components/LegalDocument";
import { legalConfig } from "@/lib/legal-config";
import { getLegalPage } from "@/lib/legal-pages";
import { renderLegalTemplate } from "@/lib/legal-template";
import { useI18n } from "@/store/i18n";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const page = getLegalPage(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Página não encontrada — Ladyfit" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.page.titlePt} — Ladyfit` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { page } = Route.useLoaderData();
  const { lang } = useI18n();

  const source = lang === "pt" ? page.pt : page.en;
  const markdown = renderLegalTemplate(source, legalConfig);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" />
        {lang === "pt" ? "Voltar à loja" : "Back to store"}
      </Link>
      <div className="mt-8">
        <LegalDocument markdown={markdown} />
      </div>
    </div>
  );
}
