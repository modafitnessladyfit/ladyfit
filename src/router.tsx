import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Só ativo no build isolado do GitHub Pages (vite.pages.config.ts). Fora
// dele esta env var nunca existe, por isso o comportamento normal
// (SSR/TanStack Start, histórico normal do browser) fica inalterado.
const isGithubPagesBuild = import.meta.env["VITE_GITHUB_PAGES"] === "true";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Hash routing evita o 404 do GitHub Pages ao atualizar/entrar
    // diretamente numa rota (ex.: /ladyfit/#/produtos) — o browser só pede
    // ao servidor o documento base, nunca o caminho depois do "#".
    ...(isGithubPagesBuild ? { history: createHashHistory() } : {}),
  });

  return router;
};
