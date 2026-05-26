// Safe experience separation shell for Leadio.
// This is a read-only classifier — it does NOT change routing, guards, or UX.

export type ExperienceType =
  | "assessment"
  | "lms"
  | "challenge"
  | "paid"
  | "partner"
  | "admin"
  | "unknown";

export type ExperienceConfig = {
  label: string;
  purpose: string;
  tone: string;
};

export const EXPERIENCE_CONFIG: Record<Exclude<ExperienceType, "unknown">, ExperienceConfig> = {
  assessment: {
    label: "Assessment",
    purpose: "Diagnosis and personalisation",
    tone: "Curious, lightweight, diagnostic",
  },
  lms: {
    label: "Learning",
    purpose: "Education and trust-building",
    tone: "Calm, premium, guided",
  },
  challenge: {
    label: "Challenge",
    purpose: "Implementation and momentum",
    tone: "Action-oriented, energetic, accountable",
  },
  paid: {
    label: "Upgrade",
    purpose: "Mastery and advanced implementation",
    tone: "Premium, complete, expert-led",
  },
  partner: {
    label: "Partner",
    purpose: "Promotion and network growth",
    tone: "Performance-driven, strategic",
  },
  admin: {
    label: "Admin",
    purpose: "Owner control and oversight",
    tone: "Operational, clear, internal",
  },
};

const UNKNOWN_CONFIG: ExperienceConfig = {
  label: "Unknown",
  purpose: "Route not yet classified into an experience",
  tone: "—",
};

export function getExperienceConfig(experience: ExperienceType): ExperienceConfig {
  if (experience === "unknown") return UNKNOWN_CONFIG;
  return EXPERIENCE_CONFIG[experience];
}

// Path → Experience classifier. Pure function, safe to call anywhere.
export function getExperienceFromPath(pathname: string): ExperienceType {
  const p = (pathname || "/").toLowerCase();

  // Admin (most specific first)
  if (p === "/admin" || p.startsWith("/admin/") ||
      p === "/owner-console" || p.startsWith("/owner-console/") ||
      p === "/user-features" || p.startsWith("/user-features/")) {
    return "admin";
  }

  // Partner
  if (p === "/promoter" || p.startsWith("/promoter/") ||
      p === "/partners" ||
      p.startsWith("/partner/")) {
    return "partner";
  }

  // Paid
  if (p === "/premium" || p.startsWith("/premium/") ||
      p === "/checkout" || p.startsWith("/checkout/") ||
      p === "/course" || p.startsWith("/course/")) {
    return "paid";
  }

  // LMS
  if (p === "/learn" || p.startsWith("/learn/") ||
      p === "/blueprint" || p.startsWith("/blueprint/")) {
    return "lms";
  }

  // Challenge
  if (p === "/dashboard" ||
      p === "/challenger-dashboard" ||
      p === "/challenge" ||
      p.startsWith("/challenge/") ||
      p.startsWith("/day/") ||
      p === "/unlocks" ||
      p === "/referrals" ||
      p === "/community" ||
      p === "/calendar") {
    return "challenge";
  }


  // Assessment (broad — keep last)
  if (p === "/" ||
      p === "/assess" || p.startsWith("/assess/") ||
      p === "/assessment" || p.startsWith("/assessment/") ||
      p === "/free-assessment" || p === "/premium-assessment" ||
      p === "/results" || p.startsWith("/results/") ||
      p.startsWith("/invite/")) {
    return "assessment";
  }


  return "unknown";
}

export type NavItem = { label: string; to?: string };

export function getNavigationForExperience(experience: ExperienceType): NavItem[] {
  switch (experience) {
    case "assessment":
      return [];
    case "lms":
      return [
        { label: "Learn", to: "/blueprint/dashboard" },
        { label: "Build Challenge Framework", to: "/blueprint/insight" },
        { label: "Ask Johnny AI", to: "/mentor" },
        { label: "Upgrade", to: "/premium" },
      ];
    case "challenge":
      return [
        { label: "Dashboard", to: "/challenger-dashboard" },
        { label: "Today", to: "/day/1" },
        { label: "Referrals", to: "/referrals" },
        { label: "Unlocks", to: "/unlocks" },
      ];
    case "paid":
      return [
        { label: "Course", to: "/course" },
        { label: "Resources", to: "/resources" },
        { label: "Upgrade", to: "/premium" },
      ];
    case "partner":
      return [
        { label: "Promoter Dashboard", to: "/promoter" },
        { label: "Network", to: "/partners" },
        { label: "Performance", to: "/partner/performance" },
        { label: "Community", to: "/community" },
      ];
    case "admin":
      return [
        { label: "Admin", to: "/owner-console" },
        { label: "Users", to: "/owner-console/view-as-user" },
        { label: "Analytics", to: "/owner-console/analytics" },
        { label: "CMS", to: "/owner-console/content" },
      ];
    default:
      return [];
  }
}
