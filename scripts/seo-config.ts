// Shared SEO configuration — single source of truth for hidden routes.
// These paths are excluded from sitemap.xml and disallowed in robots.txt.

export const HIDDEN_PATHS = [
  // Admin / owner console
  "/owner-console/",
  "/admin/",
  "/user-features",
  // Debug / internal
  "/debug/",
  "/app/features",
  // Post-action / thank-you
  "/waitlist/thanks",
  // Auth / account recovery
  "/reset-password",
  // Assessment results
  "/results",
  // Signup gates
  "/join",
  "/blueprint-join",
  // Utility
  "/links",
  "/redeem",
  "/unsubscribe",
  "/checkout/return",
  // Authenticated consumer routes
  "/user-dashboard",
  "/training",
  "/day/",
  "/unlocks",
  "/referrals",
  "/community",
  "/calendar",
  "/leaderboard",
  "/bonus-vault",
  "/reward/",
  "/mentor",
  "/prompt-library",
  "/resources",
  "/upgrade",
  // Blueprint LMS (authenticated)
  "/blueprint/",
  // Partner-only
  "/promoter",
  "/partner/",
  // Dynamic routes
  "/p/",
  "/invite/",
  "/premium/",
] as const;

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const PUBLIC_ENTRIES: SitemapEntry[] = [
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
