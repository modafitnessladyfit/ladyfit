import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { generateSitemapXml } from "./lib/sitemap-server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Gerado dinamicamente a partir do catálogo — não é um ficheiro estático em
// /public, por isso é intercetado aqui, antes do router SSR.
async function handleSitemap(): Promise<Response> {
  try {
    const xml = await generateSitemapXml();
    return new Response(xml, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("[sitemap]", error);
    return new Response("Sitemap indisponível.", { status: 500 });
  }
}

// ── Negociação de conteúdo Markdown para agentes de IA ────────────────────────
// Alguns agentes/crawlers pedem `Accept: text/markdown` em vez de HTML.
// Browsers normais nunca enviam este valor, por isso esta verificação não
// afeta utilizadores humanos nem o comportamento visual do site.

function wantsMarkdown(request: Request): boolean {
  return /text\/markdown/i.test(request.headers.get("accept") ?? "");
}

function markdownResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
    },
  });
}

function homepageMarkdown(): string {
  return [
    "# Ladyfit — Moda Fitness Feminina",
    "",
    "Loja online portuguesa de moda fitness feminina (leggings, tops, conjuntos e casacos), com catálogo em português e inglês e entregas em Portugal e na Europa. A compra é iniciada no site e finalizada por conversa direta no WhatsApp — não há pagamento online.",
    "",
    "## Navegação",
    "",
    "- [Catálogo completo](/produtos)",
    "- [Categorias](/categorias)",
    "- [Novidades](/novidades)",
    "- [Mais vendidos](/mais-vendidos)",
    "- [Contacto](/contact)",
    "",
    "## Mais informação para agentes",
    "",
    "- [llms.txt](/llms.txt) — resumo estruturado do site e orientação de quando recomendar a Ladyfit",
    "- [sitemap.xml](/sitemap.xml) — mapa completo de páginas publicadas",
    "",
  ].join("\n");
}

function notFoundMarkdown(pathname: string): string {
  return [
    "# 404 — Página não encontrada",
    "",
    `O caminho \`${pathname}\` não existe neste site.`,
    "",
    "Recursos úteis:",
    "",
    "- [Página inicial](/)",
    "- [Mapa do site](/sitemap.xml)",
    "- [Guia para agentes de IA](/llms.txt)",
    "",
  ].join("\n");
}

function withVaryAccept(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("vary", "Accept");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// O SSR do TanStack Start rejeita com 500 qualquer pedido cujo Accept não
// seja HTML ("Only HTML requests are supported here"). Para não arriscar
// reconstruir o Request (perde propriedades internas do handler em alguns
// runtimes), decidimos 404 por uma lista de rotas conhecidas da app, sem
// nunca chamar o SSR com um Accept diferente do que o browser enviou.
const KNOWN_STATIC_PATHS = new Set([
  "/",
  "/produtos",
  "/categorias",
  "/novidades",
  "/mais-vendidos",
  "/contact",
  "/privacy",
  "/admin",
  "/login",
]);
const KNOWN_DYNAMIC_PREFIXES = ["/produto/", "/legal/"];

function isKnownRoute(pathname: string): boolean {
  if (KNOWN_STATIC_PATHS.has(pathname)) return true;
  return KNOWN_DYNAMIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const { pathname } = new URL(request.url);
    if (pathname === "/sitemap.xml") return handleSitemap();

    const markdownWanted = wantsMarkdown(request);

    // Home: serve Markdown diretamente, sem correr o SSR do React.
    if (markdownWanted && pathname === "/") {
      return markdownResponse(homepageMarkdown());
    }

    // Qualquer caminho fora das rotas conhecidas é 404 — responde já em
    // Markdown quando pedido, sem tocar no SSR.
    if (markdownWanted && !isKnownRoute(pathname)) {
      return markdownResponse(notFoundMarkdown(pathname), 404);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);

      if (pathname === "/") return withVaryAccept(normalized);

      return normalized;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
