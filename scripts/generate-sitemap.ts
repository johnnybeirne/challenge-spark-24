import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://leadio.johnnybeirne.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Only public, indexable marketing routes.
// Excluded: thank-you pages, auth/utility, post-action results,
// signup gates, internal feature overviews, and the admin/owner/debug routes
// disallowed in robots.txt.
const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/challenge", changefreq: "weekly", priority: "0.9" },
  { path: "/free-assessment", changefreq: "weekly", priority: "0.9" },
  { path: "/free-training", changefreq: "weekly", priority: "0.9" },
  { path: "/premium", changefreq: "weekly", priority: "0.9" },
  { path: "/assess", changefreq: "weekly", priority: "0.8" },
  { path: "/assessment", changefreq: "weekly", priority: "0.8" },
  { path: "/premium-assessment", changefreq: "weekly", priority: "0.8" },
  { path: "/partners", changefreq: "monthly", priority: "0.7" },
  { path: "/waitlist", changefreq: "monthly", priority: "0.6" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
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

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
