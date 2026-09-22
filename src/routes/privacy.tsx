import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias de conveniência: agentes e auditorias costumam testar /privacy por
// convenção. O conteúdo real vive em /legal/privacidade (fonte única,
// evita duplicar e desatualizar o texto jurídico).
export const Route = createFileRoute("/privacy")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "privacidade" } });
  },
});
