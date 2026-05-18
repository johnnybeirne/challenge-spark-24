import { writeFileSync } from "fs";
import { resolve } from "path";
import { HIDDEN_PATHS } from "./seo-config";

const BASE_URL = "https://leadio.johnnybeirne.com";

const lines = [
  "User-agent: Googlebot",
  "Allow: /",
  "",
  "User-agent: Bingbot",
  "Allow: /",
  "",
  "User-agent: Twitterbot",
  "Allow: /",
  "",
  "User-agent: facebookexternalhit",
  "Allow: /",
  "",
  "User-agent: *",
  "Allow: /",
  ...HIDDEN_PATHS.map((p) => `Disallow: ${p}`),
  `Sitemap: ${BASE_URL}/sitemap.xml`,
  "",
];

writeFileSync(resolve("public/robots.txt"), lines.join("\n"));
console.log("robots.txt written");
