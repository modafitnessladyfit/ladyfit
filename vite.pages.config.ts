// Config Vite ISOLADO, usado apenas por "npm run build:pages".
// Não é importado nem referenciado pelo vite.config.ts principal — o build
// normal (`npm run build`, TanStack Start + SSR via Nitro) não é afetado
// por este ficheiro em nada.
//
// Gera uma versão cliente-only (SPA, routing por hash) do site, publicável
// como ficheiros estáticos no GitHub Pages em /ladyfit/. Reutiliza as
// mesmas rotas/componentes da aplicação — nenhum código é duplicado, só o
// ponto de entrada (src/entry-pages.tsx) e este bootstrap de build.
import { existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const OUT_DIR = "dist-pages";

// Rollup nomeia o HTML de saída a partir do input (index.pages.html); o
// GitHub Pages (como qualquer host estático) espera "index.html" na raiz.
function renameToIndexHtml(): Plugin {
  return {
    name: "rename-index-pages-html",
    closeBundle() {
      const from = resolve(OUT_DIR, "index.pages.html");
      const to = resolve(OUT_DIR, "index.html");
      if (existsSync(from)) renameSync(from, to);
    },
  };
}

export default defineConfig({
  base: "/ladyfit/",
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    viteReact(),
    renameToIndexHtml(),
  ],
  resolve: {
    // Aliases mais específicos primeiro — @rollup/plugin-alias usa o
    // primeiro que corresponder, e "@" por si só também seria um prefixo
    // válido para "@/lib/checkout-server".
    alias: {
      // Substitui só a server function de checkout (usa a chave secreta do
      // Supabase, que não pode/deve correr num host estático) — ver
      // src/pages-shims/checkout-server.ts.
      "@/lib/checkout-server": `${process.cwd()}/src/pages-shims/checkout-server.ts`,
      // @tanstack/start-storage-context usa AsyncLocalStorage do Node só
      // para propagar contexto de pedido no servidor; no bundle do
      // cliente isso nunca é chamado (não há servidor no GitHub Pages),
      // mas o módulo continua a ser importado — ver src/pages-shims.
      "node:async_hooks": `${process.cwd()}/src/pages-shims/async-hooks.ts`,
      "@": `${process.cwd()}/src`,
    },
  },
  css: { transformer: "lightningcss" },
  define: {
    // Único sinal que a app usa para saber que está no build do Pages
    // (ver src/router.tsx). Ausente em qualquer outro build/ambiente.
    "import.meta.env.VITE_GITHUB_PAGES": JSON.stringify("true"),
  },
  build: {
    outDir: OUT_DIR,
    rollupOptions: {
      input: "index.pages.html",
    },
  },
});
