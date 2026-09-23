// Entry point exclusivo do build estático do GitHub Pages
// (vite.pages.config.ts / index.pages.html). O build normal (TanStack
// Start + SSR, src/server.ts) não referencia este ficheiro em nada.
import { StrictMode, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { HeadContent, RouterProvider } from "@tanstack/react-router";
import { Route as RootRoute } from "./routes/__root";
import { getRouter } from "./router";
import "./styles.css";

// O `shellComponent` do __root.tsx renderiza <html>/<head>/<body> e <Scripts/>
// — só faz sentido no SSR do TanStack Start. Num render cliente dentro de
// #root fazia o browser entrar em ciclo (CPU a 100 %) assim que qualquer
// <input> recebia foco. Aqui trocamos só o shell, neste entry: mantemos o
// <HeadContent/> (título/meta por rota) e devolvemos o conteúdo tal como está.
// eslint-disable-next-line react-refresh/only-export-components
function PagesShell({ children }: { children: ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
    </>
  );
}
// `shellComponent` é opção do TanStack Start e não está nos tipos de `update`.
(RootRoute.options as { shellComponent?: typeof PagesShell }).shellComponent = PagesShell;

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Elemento #root não encontrado em index.pages.html");

ReactDOM.createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
