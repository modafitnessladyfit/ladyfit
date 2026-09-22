// Entry point exclusivo do build estático do GitHub Pages
// (vite.pages.config.ts / index.pages.html). O build normal (TanStack
// Start + SSR, src/server.ts) não referencia este ficheiro em nada.
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Elemento #root não encontrado em index.pages.html");

ReactDOM.createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
