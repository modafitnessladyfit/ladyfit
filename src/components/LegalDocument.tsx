import { Fragment } from "react";

// Renderizador markdown mínimo, dedicado ao subconjunto usado nos textos
// jurídicos: #/##/### , **negrito**, listas "- " e "1. ", "---" e quebras
// de linha (duas linhas com espaço final). Não interpreta HTML nem links.

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "hr" }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; lines: string[] };

function parseBlocks(source: string): Block[] {
  const rawLines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }
    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i]!.trim())) {
        items.push(rawLines[i]!.trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i]!.trim())) {
        items.push(rawLines[i]!.trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Parágrafo: junta linhas consecutivas não vazias, preservando quebras
    // de linha suaves (linhas terminadas em dois espaços no original).
    const lines: string[] = [];
    while (i < rawLines.length && rawLines[i]!.trim() !== "") {
      const raw = rawLines[i]!;
      const t = raw.trim();
      if (t === "---" || /^#{1,3}\s/.test(t) || /^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) break;
      lines.push(t);
      i++;
    }
    if (lines.length > 0) blocks.push({ type: "p", lines });
  }

  return blocks;
}

export function LegalDocument({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;
        switch (block.type) {
          case "h1":
            return (
              <h1 key={key} className="heading-xl text-3xl text-navy sm:text-4xl">
                {renderInline(block.text, key)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={key} className="mt-8 text-xl font-bold text-navy">
                {renderInline(block.text, key)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="mt-4 text-sm font-bold uppercase tracking-wide text-navy">
                {renderInline(block.text, key)}
              </h3>
            );
          case "hr":
            return <hr key={key} className="border-border" />;
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ol>
            );
          case "p":
            return (
              <p key={key} className="text-sm leading-relaxed text-muted-foreground">
                {block.lines.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {renderInline(line, `${key}-${i}`)}
                  </Fragment>
                ))}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
