import type { LegalConfig } from "./legal-config";

// Resolve blocos condicionais {{#token}}...{{/token}} (mantém o conteúdo
// apenas quando o valor existir) e depois substitui os tokens {{token}}
// restantes. Não interpreta nem reescreve o texto — apenas preenche.
export function renderLegalTemplate(source: string, config: LegalConfig): string {
  let text = source;

  text = text.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, key: string, inner: string) => {
      const value = config[key as keyof LegalConfig];
      return value ? inner : "";
    },
  );

  text = text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = config[key as keyof LegalConfig];
    return value ?? "";
  });

  return text;
}
