import { supabaseAdmin } from "./supabase-server";
import { absoluteUrl } from "./seo";

interface SitemapEntry {
  path: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  lastmod?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/produtos", changefreq: "daily", priority: 0.9 },
  { path: "/categorias", changefreq: "weekly", priority: 0.7 },
  { path: "/novidades", changefreq: "daily", priority: 0.8 },
  { path: "/mais-vendidos", changefreq: "daily", priority: 0.8 },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Gera o sitemap.xml dinamicamente a partir do catálogo publicado no
// Supabase — não é um ficheiro estático, por isso reflete sempre o
// catálogo atual sem precisar de rebuild.
export async function generateSitemapXml(): Promise<string> {
  const now = new Date().toISOString();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("slug, created_at")
    .eq("status", "published");
  if (error) throw error;

  const entries: SitemapEntry[] = [
    ...STATIC_ENTRIES,
    ...(products ?? []).map((p) => ({
      path: `/produto/${p.slug}`,
      changefreq: "weekly" as const,
      priority: 0.85,
      lastmod: p.created_at,
    })),
  ];

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? new Date(entry.lastmod).toISOString() : now;
      return [
        "  <url>",
        `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
