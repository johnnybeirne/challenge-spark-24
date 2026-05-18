import { writeFileSync } from "fs";
import { resolve } from "path";
import { PUBLIC_ENTRIES, HIDDEN_PATHS } from "./seo-config";

const BASE_URL = "https://leadio.johnnybeirne.com";

function isHidden(path: string): boolean {
  return HIDDEN_PATHS.some((hidden) => {
    if (hidden.endsWith("/")) {
      return path.startsWith(hidden);
    }
    return path === hidden || path.startsWith(hidden + "/");
  });
}

// Validate: no public entry may match a hidden route
const conflicts = PUBLIC_ENTRIES.filter((e) => isHidden(e.path));
if (conflicts.length > 0) {
  console.error(
    "Sitemap validation failed: the following public entries match hidden routes:",
    conflicts.map((c) => c.path).join(", ")
  );
  process.exit(1);
}

function generateSitemap() {
  const urls = PUBLIC_ENTRIES.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap());
console.log(`sitemap.xml written (${PUBLIC_ENTRIES.length} entries)`);
