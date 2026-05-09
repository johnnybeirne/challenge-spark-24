import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, RefreshCw, Copy, Download, AlertTriangle, ShieldAlert, Layers, ExternalLink, Check, Link2 } from "lucide-react";
import { toast } from "sonner";

// Clickable route code chip — opens in a new tab if value starts with "/"
const RouteCode = ({ route, className = "" }: { route: string; className?: string }) => {
  const cls = `rounded bg-muted px-1.5 py-0.5 text-[11px] ${className}`;
  const isRoute = typeof route === "string" && route.startsWith("/") && !route.includes(" ");
  if (!isRoute) return <code className={cls}>{route}</code>;
  return (
    <a
      href={route}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} hover:bg-primary/10 hover:text-primary transition-colors underline-offset-2 hover:underline`}
    >
      <code>{route}</code>
    </a>
  );
};
import { useExperienceShell } from "@/components/ExperienceShell";
import {
  getExperienceFromPath,
  getExperienceConfig,
  getNavigationForExperience,
  type ExperienceType,
} from "@/lib/experienceShell";

type Status = "Detected" | "Partially detected" | "Not detected" | "Conflicting" | "Needs review";

const STATUS_STYLES: Record<Status, string> = {
  "Detected": "bg-success/15 text-success border-success/30",
  "Partially detected": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "Not detected": "bg-muted text-muted-foreground border-border",
  "Conflicting": "bg-destructive/15 text-destructive border-destructive/30",
  "Needs review": "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

// ───────── Static registry derived from src/App.tsx route table ─────────
type RouteRow = {
  route: string;
  purpose: string;
  access: "Public" | "Authenticated" | "Admin" | "Partner only" | "Unknown";
  status: Status;
  notes?: string;
};

const ROUTES: RouteRow[] = [
  { route: "/", purpose: "Landing", access: "Public", status: "Detected" },
  { route: "/challenge", purpose: "Challenge landing", access: "Public", status: "Detected" },
  { route: "/blueprint", purpose: "Blueprint (mini LMS) landing", access: "Public", status: "Detected" },
  { route: "/assess", purpose: "Lead generation assessment", access: "Public", status: "Detected" },
  { route: "/results", purpose: "Assessment results", access: "Public", status: "Detected", notes: "Also /results/low|med|high" },
  { route: "/join", purpose: "Signup / login", access: "Public", status: "Detected" },
  { route: "/blueprint-join", purpose: "Signup gate before Blueprint", access: "Public", status: "Detected" },
  { route: "/reset-password", purpose: "Password reset", access: "Public", status: "Detected" },
  { route: "/partners", purpose: "Partner acquisition page", access: "Public", status: "Detected" },
  { route: "/waitlist", purpose: "Waitlist", access: "Public", status: "Detected" },
  { route: "/app/features", purpose: "Public feature overview", access: "Public", status: "Detected" },
  { route: "/user-dashboard", purpose: "Challenge dashboard", access: "Authenticated", status: "Detected" },
  { route: "/training", purpose: "Pre-challenge training", access: "Authenticated", status: "Detected" },
  { route: "/day/:day", purpose: "3-day challenge (Day 1/2/3)", access: "Authenticated", status: "Detected" },
  { route: "/unlocks", purpose: "Unlocks / rewards", access: "Authenticated", status: "Detected" },
  { route: "/redeem", purpose: "Redeem credits", access: "Authenticated", status: "Detected" },
  { route: "/referrals", purpose: "Personal invite links + tracking", access: "Authenticated", status: "Detected" },
  { route: "/community", purpose: "Builder Circle community", access: "Authenticated", status: "Detected" },
  { route: "/calendar", purpose: "Add-to-calendar", access: "Authenticated", status: "Detected" },
  { route: "/leaderboard", purpose: "Leaderboard", access: "Authenticated", status: "Detected" },
  { route: "/bonus-vault", purpose: "Rewards vault", access: "Authenticated", status: "Detected" },
  { route: "/reward/:id", purpose: "Reward detail", access: "Authenticated", status: "Detected" },
  { route: "/mentor", purpose: "AI mentor chat", access: "Authenticated", status: "Detected" },
  { route: "/prompt-library", purpose: "Prompt library", access: "Authenticated", status: "Detected" },
  { route: "/resources", purpose: "Resources", access: "Authenticated", status: "Detected" },
  { route: "/upgrade", purpose: "Upgrade / paid course CTA", access: "Authenticated", status: "Detected" },
  { route: "/blueprint/dashboard", purpose: "Mini LMS dashboard", access: "Authenticated", status: "Detected" },
  { route: "/blueprint/lesson/:day", purpose: "Mini LMS lesson", access: "Authenticated", status: "Detected" },
  { route: "/blueprint/insight", purpose: "AI insight output", access: "Authenticated", status: "Detected" },
  { route: "/blueprint/bridge", purpose: "LMS → Challenge transition (Module 3 bridge)", access: "Authenticated", status: "Detected" },
  { route: "/promoter", purpose: "Partner / promoter dashboard", access: "Partner only", status: "Detected" },
  { route: "/partner/performance", purpose: "Partner performance", access: "Partner only", status: "Detected" },
  { route: "/owner-console", purpose: "Owner console hub", access: "Admin", status: "Detected" },
  { route: "/owner-console/analytics", purpose: "Analytics", access: "Admin", status: "Detected" },
  { route: "/owner-console/content", purpose: "CMS / content", access: "Admin", status: "Detected" },
  { route: "/owner-console/challenge-days", purpose: "Challenge day config", access: "Admin", status: "Detected" },
  { route: "/owner-console/promoters", purpose: "Promoter management", access: "Admin", status: "Detected" },
  { route: "/owner-console/activity", purpose: "Activity feed", access: "Admin", status: "Detected" },
  { route: "/owner-console/training", purpose: "Training admin", access: "Admin", status: "Detected" },
  { route: "/owner-console/view-as-user", purpose: "Impersonation", access: "Admin", status: "Detected" },
  { route: "/owner-console/diagnostic-responses", purpose: "Assessment responses", access: "Admin", status: "Detected" },
  { route: "/owner-console/features", purpose: "Internal feature overview", access: "Admin", status: "Detected" },
  { route: "/user-features", purpose: "This audit page", access: "Admin", status: "Detected" },
  { route: "/learn", purpose: "Generic LMS index", access: "Unknown", status: "Not detected", notes: "Use /blueprint instead" },
  { route: "/learn/module/:n", purpose: "Generic LMS modules", access: "Unknown", status: "Not detected", notes: "Use /blueprint/lesson/:day" },
  { route: "/dashboard", purpose: "Generic dashboard alias", access: "Unknown", status: "Not detected", notes: "Use /user-dashboard" },
  { route: "/admin", purpose: "Legacy admin", access: "Admin", status: "Conflicting", notes: "Kept as redirect to /owner-console" },
];

type Feature = { name: string; status: Status; note?: string };
type Category = { title: string; features: Feature[] };

const CATEGORIES: Category[] = [
  { title: "Top of Funnel", features: [
    { name: "Lead generation assessment", status: "Detected" },
    { name: "Referral invite landing", status: "Partially detected", note: "/referrals exists; dedicated invite landing not detected" },
    { name: "Partner invite landing", status: "Detected", note: "/partners" },
    { name: "Waitlist page", status: "Detected" },
    { name: "Free mini LMS", status: "Detected", note: "/blueprint" },
    { name: "Paid course / locked modules", status: "Partially detected", note: "/upgrade CTA exists; locked module UI not detected" },
  ]},
  { title: "Assessment", features: [
    { name: "Assessment route", status: "Detected" },
    { name: "Results route", status: "Detected" },
    { name: "Scoring logic", status: "Detected", note: "src/lib/scoring.ts" },
    { name: "Lead generation diagnosis", status: "Detected" },
    { name: "Referral attribution", status: "Detected" },
    { name: "Shareable results", status: "Needs review" },
  ]},
  { title: "Mini LMS (Blueprint)", features: [
    { name: "LMS dashboard", status: "Detected" },
    { name: "Free lessons", status: "Detected" },
    { name: "AI-guided insight", status: "Detected", note: "blueprint-insight edge fn" },
    { name: "Locked paid modules", status: "Not detected" },
    { name: "Coupon / paywall CTA", status: "Detected", note: "FOUNDING497 coupon on dashboard" },
    { name: "Mentor chat", status: "Detected" },
  ]},
  { title: "Three-Day Challenge", features: [
    { name: "Day 1", status: "Detected" },
    { name: "Day 2", status: "Detected" },
    { name: "Day 3", status: "Detected" },
    { name: "Challenge dashboard", status: "Detected" },
    { name: "Task completion", status: "Detected" },
    { name: "AI guidance", status: "Detected" },
    { name: "Progress tracking", status: "Detected" },
    { name: "Completion state", status: "Detected" },
  ]},
  { title: "Referral / Trust Engine", features: [
    { name: "Personal invite links", status: "Detected" },
    { name: "Referral tracking", status: "Detected" },
    { name: "Direct referrals", status: "Detected" },
    { name: "Indirect referrals", status: "Needs review" },
    { name: "Unlocks / rewards", status: "Detected" },
    { name: "Sharing tools", status: "Detected" },
    { name: "Viral onboarding", status: "Partially detected" },
  ]},
  { title: "Partner / Promoter System", features: [
    { name: "Partner acquisition page", status: "Detected" },
    { name: "Partner invite flow", status: "Partially detected" },
    { name: "Promoter dashboard", status: "Detected" },
    { name: "Partner performance", status: "Detected" },
    { name: "Cross-promotion", status: "Detected", note: "CrossPromo components" },
    { name: "Partner asset delivery", status: "Needs review" },
  ]},
  { title: "Paid Course / Monetisation", features: [
    { name: "Locked modules", status: "Not detected" },
    { name: "Coupon code flow", status: "Partially detected" },
    { name: "Paid course CTA", status: "Detected", note: "/upgrade" },
    { name: "Upgrade page", status: "Detected" },
    { name: "Stripe checkout readiness", status: "Not detected" },
  ]},
  { title: "Community / Builder Circle", features: [
    { name: "Builder Circle", status: "Detected" },
    { name: "Leaderboard", status: "Detected" },
    { name: "Support / boost actions", status: "Partially detected" },
    { name: "Activity feed", status: "Detected" },
    { name: "Community unlock logic", status: "Detected", note: "Day 3 + URL + 3 referrals" },
  ]},
  { title: "AI System", features: [
    { name: "AI co-pilot", status: "Detected", note: "AiCopilotChat" },
    { name: "AI mentor", status: "Detected" },
    { name: "AI insight generation", status: "Detected" },
    { name: "Personalisation memory", status: "Detected" },
    { name: "Prompt outputs", status: "Detected" },
    { name: "Saved responses", status: "Partially detected" },
  ]},
  { title: "Admin / Owner", features: [
    { name: "Admin dashboard", status: "Detected" },
    { name: "Analytics", status: "Detected" },
    { name: "CMS / config", status: "Detected" },
    { name: "User management", status: "Partially detected", note: "View-as-user only" },
    { name: "Leaderboard control", status: "Not detected" },
    { name: "Community management", status: "Not detected" },
  ]},
  { title: "Data / Infrastructure", features: [
    { name: "Supabase auth", status: "Detected" },
    { name: "Supabase tables", status: "Detected" },
    { name: "localStorage persistence", status: "Detected" },
    { name: "Analytics events", status: "Detected", note: "src/lib/analytics.ts" },
    { name: "Route guards", status: "Detected" },
    { name: "Role-based experiences", status: "Detected" },
  ]},
];

const ENTRY_POINTS = [
  { name: "Direct assessment entry", route: "/assess", status: "Detected" as Status, next: "/results", clear: true },
  { name: "Referral invite into assessment", route: "/?ref=…", status: "Partially detected" as Status, next: "/assess", clear: false },
  { name: "Partner invite into assessment", route: "/partners", status: "Partially detected" as Status, next: "/assess", clear: false },
  { name: "Free mini LMS entry", route: "/blueprint", status: "Detected" as Status, next: "/blueprint-join → /blueprint/dashboard", clear: true },
  { name: "Paid course entry", route: "/upgrade", status: "Partially detected" as Status, next: "External / TBD", clear: false },
  { name: "Waitlist entry", route: "/waitlist", status: "Detected" as Status, next: "(captures email)", clear: true },
  { name: "Challenge direct entry", route: "/challenge → /join", status: "Detected" as Status, next: "/user-dashboard", clear: true },
];

const JOURNEY_STAGES = [
  { stage: "Entry Points", routes: ["/", "/challenge", "/blueprint", "/partners", "/waitlist"], notes: "Multiple front doors. Confirm intended funnel order." },
  { stage: "Assessment / Diagnosis", routes: ["/assess", "/results"], notes: "Should this always precede the challenge?" },
  { stage: "Free Education / Mini LMS", routes: ["/blueprint", "/blueprint/dashboard", "/blueprint/lesson/:day"], notes: "Now repositioned as 'Blueprint' — verify language." },
  { stage: "Challenge Enrollment", routes: ["/join", "/challenge"], notes: "Single signup endpoint, two landing entry points." },
  { stage: "Three-Day Challenge Execution", routes: ["/user-dashboard", "/day/1", "/day/2", "/day/3"], notes: "Sidebar no longer surfaces day links — handoff via dashboard CTA." },
  { stage: "Referral / Trust Engine", routes: ["/referrals", "/unlocks"], notes: "Community unlock requires 3 direct referrals." },
  { stage: "Paid Course / Locked Content", routes: ["/upgrade"], notes: "No locked-module UI detected; coupon-only flow." },
  { stage: "Partner / Promoter Layer", routes: ["/partners", "/promoter", "/partner/performance"], notes: "Partner role bypasses bottom nav." },
  { stage: "Community / Builder Circle", routes: ["/community", "/leaderboard"], notes: "Gated by Day 3 + URL + 3 referrals." },
  { stage: "Completion / Upgrade / Monetisation", routes: ["/bonus-vault", "/upgrade", "/blueprint/insight"], notes: "Multiple completion endpoints — clarify primary." },
  { stage: "Admin / Owner Oversight", routes: ["/owner-console", "/user-features"], notes: "Owner-only review surfaces." },
];

const ROLES = [
  { role: "Visitor", sees: "/, /challenge, /blueprint, /assess, /results, /partners, /waitlist", hidden: "Authenticated areas", journey: "Landing → assess or blueprint", confusion: "Multiple landings (/, /challenge, /blueprint) compete." },
  { role: "Lead", sees: "Public + assessment results", hidden: "Dashboard, challenge, referrals", journey: "Assess → Results → Join", confusion: "Results CTA path could vary by score." },
  { role: "Participant", sees: "All authenticated routes", hidden: "Partner & admin", journey: "Dashboard → Day 1-3 → Unlocks → Community", confusion: "Sidebar shows Blueprint nav while bottom nav still shows Challenge." },
  { role: "Paid course user", sees: "Same as participant + (planned) locked modules", hidden: "Partner & admin", journey: "Not yet differentiated", confusion: "No paid-state UI distinction detected." },
  { role: "Partner / Promoter", sees: "Promoter dashboard + performance + shared routes", hidden: "Bottom consumer nav", journey: "Partners → Promoter dashboard", confusion: "Overlap with consumer experience for cross-promo." },
  { role: "Admin / Owner", sees: "/owner-console/* + /user-features", hidden: "—", journey: "Console hub → analytics / content / training", confusion: "Legacy /admin path still mounts the console." },
];

const CONFLICTS = [
  { flag: "Day 1 / Day 2 / Day 3 language inside Blueprint mini LMS", severity: "warn" },
  { flag: "Two landing pages for the same product (/ vs /challenge)", severity: "warn" },
  { flag: "Two signup routes (/join and /blueprint-join) — same component", severity: "info" },
  { flag: "Legacy /admin path still mounts AdminLayout alongside /owner-console", severity: "warn" },
  { flag: "Sidebar (Blueprint) and BottomNav (Challenge) surface different products to the same user", severity: "warn" },
  { flag: "Reward / gamification UI (points, unlocks) appears for users still in free mini LMS scope", severity: "warn" },
  { flag: "Referral invite path does not clearly route through assessment", severity: "info" },
  { flag: "Multiple completion endpoints (bonus vault, blueprint insight, upgrade) — primary unclear", severity: "info" },
  { flag: "Product naming: 'ChallengeOS' references replaced with 'Leadio' across UI + utilities", severity: "info" },
];

// ───────── Core Entry Links (Prompt 48.3) ─────────
type CoreEntryLink = {
  title: string;
  route: string;
  fallback?: string;
  description: string;
  badge: string;
};

const CORE_ENTRY_LINKS: CoreEntryLink[] = [
  { title: "Assessment Homepage", route: "/", description: "Primary assessment-first entry point for cold traffic.", badge: "Top Funnel" },
  { title: "Direct Challenge Entry", route: "/challenge", description: "Direct entry into the 3-Day Challenge for higher-intent users.", badge: "Challenge" },
  { title: "Free Training Entry", route: "/free-training", fallback: "/blueprint", description: "Free AI-guided mini course used as a lead magnet before challenge entry.", badge: "Free Training" },
  { title: "Premium Course", route: "/premium", description: "Premium educational experience with coupon-code support and upgrade flow.", badge: "Premium" },
  { title: "Mini Course Dashboard", route: "/blueprint/dashboard", fallback: "/blueprint", description: "Internal LMS dashboard experience for users already inside the mini course.", badge: "LMS" },
];

const CoreEntryLinksSection = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copyLink = async (route: string) => {
    try {
      await navigator.clipboard.writeText(`${origin}${route}`);
      setCopied(route);
      toast.success("Link copied");
      setTimeout(() => setCopied(c => (c === route ? null : c)), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black">Core Entry Links</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">Owner hub</Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Primary URLs to test, promote, and manage the main Leadio funnels.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {CORE_ENTRY_LINKS.map(link => (
            <div key={link.title} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black">{link.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <RouteCode route={link.route} />
                    {link.fallback && (
                      <>
                        <span className="text-[10px] text-muted-foreground">fallback</span>
                        <RouteCode route={link.fallback} />
                      </>
                    )}
                  </div>
                </div>
                <Badge className="shrink-0">{link.badge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{link.description}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-1.5">
                  <a href={link.route} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                </Button>
                {link.fallback && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={link.fallback} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Open fallback
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => copyLink(link.route)} className="gap-1.5">
                  {copied === link.route ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === link.route ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ───────── Stage / Navigation cohesion checks (Prompt 47.6) ─────────
type NavCheck = { label: string; status: Status; note?: string };
const NAV_COHESION_CHECKS: NavCheck[] = [
  { label: "BottomNav hidden inside LMS routes", status: "Detected", note: "AppShell switches to ChallengeSidebar (LMS variant) for /blueprint/*" },
  { label: "Sidebar adapts: LMS items vs Challenge items", status: "Detected", note: "ChallengeSidebar renders LEARN / TOOLS / NEXT STEP for /blueprint/*" },
  { label: "Assessment routes free of challenge gamification", status: "Detected", note: "/assess uses showNav=false in App routing" },
  { label: "Single 'start here' journey: /assess → /blueprint → /blueprint/bridge → /user-dashboard", status: "Detected" },
  { label: "Stage indicator visible on Challenge dashboard", status: "Detected", note: "useUserStage().stageLabel rendered in Dashboard header" },
  { label: "ChallengeOS naming retired (UI + utilities)", status: "Detected", note: "src/lib/calendarSchedule.ts, src/pages/ResetPassword.tsx renamed to Leadio" },
  { label: "Premium and challenge remain separate", status: "Detected", note: "/upgrade does not redirect to challenge; challenge does not require premium" },
  { label: "Community gated until challenge entry", status: "Detected", note: "Community unlock requires Day 3 + URL + 3 referrals (canonical rule)" },
  { label: "User stage hook available", status: "Detected", note: "src/hooks/useUserStage.ts — stage, nextLabel, nextHref" },
];

const NavCohesionSection = () => (
  <Card className="border-border">
    <CardContent className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black">Navigation & Stage Cohesion</h2>
        <Badge variant="outline" className="ml-auto text-[10px]">Read-only</Badge>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Each stage (assessment → LMS → challenge → premium) should surface its own navigation and CTA hierarchy without leaking the others.
      </p>
      <ul className="space-y-2">
        {NAV_COHESION_CHECKS.map(c => (
          <li key={c.label} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
            </div>
            <StatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const RECOMMENDATIONS = [
  "Clarify whether assessment is always outside the challenge.",
  "Separate mini LMS navigation from challenge navigation.",
  "Ensure referral invite pages route users into assessment first.",
  "Keep Day 1 / Day 2 / Day 3 language only inside the challenge experience.",
  "Use Leadio as the platform name consistently across copy and memory.",
  "Pick one primary landing route and redirect the others.",
  "Decide a primary 'completion' destination (Insight, Bonus Vault, or Upgrade).",
  "Either implement locked paid modules or remove the paid-course suggestion from the LMS.",
  "Retire the legacy /admin path once all bookmarks are migrated.",
  "Differentiate the participant vs paid-course UX explicitly.",
];

const countByStatus = (items: { status: Status }[], s: Status) => items.filter(i => i.status === s).length;

const Section = ({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-5 text-left">
            <h2 className="text-lg font-black">{title}</h2>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border p-5">{children}</CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

const EXPERIENCE_ORDER: ExperienceType[] = ["assessment", "lms", "challenge", "paid", "partner", "admin"];

const EXPERIENCE_ROUTE_SAMPLES: Record<Exclude<ExperienceType, "unknown">, string[]> = {
  assessment: ["/", "/assess", "/results", "/results/low", "/results/med", "/results/high", "/invite/abc"],
  lms: ["/blueprint", "/blueprint/dashboard", "/blueprint/lesson/1", "/blueprint/insight", "/learn", "/learn/module/1"],
  challenge: ["/user-dashboard", "/dashboard", "/day/1", "/day/2", "/day/3", "/unlocks", "/referrals", "/community", "/calendar"],
  paid: ["/upgrade", "/checkout", "/course", "/course/module/1"],
  partner: ["/promoter", "/partner/performance", "/partners"],
  admin: ["/admin", "/admin/analytics", "/owner-console", "/owner-console/analytics", "/user-features"],
};

const ExperienceSeparationSection = () => {
  const { experience, config, navigation, pathname } = useExperienceShell();

  const detectedByExperience = useMemo(() => {
    const map: Record<ExperienceType, string[]> = {
      assessment: [], lms: [], challenge: [], paid: [], partner: [], admin: [], unknown: [],
    };
    EXPERIENCE_ORDER.forEach(exp => {
      EXPERIENCE_ROUTE_SAMPLES[exp as Exclude<ExperienceType, "unknown">].forEach(route => {
        const detected = getExperienceFromPath(route);
        map[detected].push(route);
      });
    });
    return map;
  }, []);

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black">Experience Separation</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">Read-only shell</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Current Route</h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Path</dt><dd><code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{pathname}</code></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Detected experience</dt><dd><Badge>{config.label}</Badge></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Type</dt><dd><code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{experience}</code></dd></div>
              <div><dt className="text-muted-foreground">Purpose</dt><dd className="mt-0.5">{config.purpose}</dd></div>
              <div><dt className="text-muted-foreground">Tone</dt><dd className="mt-0.5">{config.tone}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Suggested Navigation</h3>
            {navigation.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No navigation defined for this experience.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {navigation.map(n => (
                  <li key={n.label} className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{n.label}</span>
                    {n.to && <RouteCode route={n.to} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border p-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Routes Detected By Experience</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCE_ORDER.map(exp => {
              const cfg = getExperienceConfig(exp);
              const routes = detectedByExperience[exp];
              return (
                <div key={exp} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wide">{cfg.label}</h4>
                    <Badge variant="outline" className="text-[10px]">{routes.length}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {routes.length === 0 && <li className="text-[11px] text-muted-foreground">None</li>}
                    {routes.map(r => (
                      <li key={r}><RouteCode route={r} /></li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {detectedByExperience.unknown.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <h4 className="text-xs font-black uppercase tracking-wide text-amber-600">Unknown</h4>
                <ul className="mt-2 space-y-1">
                  {detectedByExperience.unknown.map(r => (
                    <li key={r}><RouteCode route={r} /></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          This shell only classifies routes — it does not redirect, hide, or change any user experience.
        </p>
      </CardContent>
    </Card>
  );
};

const LMS_FORBIDDEN_TERMS = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Reward Points",
  "Unlock Rewards",
  "Bonus Vault",
  "Challenge Progress",
  "Leaderboard",
  "Earn Credits",
  "Start Challenge",
];

const LMS_ROUTES_TO_AUDIT = [
  "/blueprint",
  "/blueprint/dashboard",
  "/blueprint/lesson/1",
  "/blueprint/lesson/2",
  "/blueprint/lesson/3",
  "/blueprint/lesson/4",
  "/blueprint/lesson/5",
  "/blueprint/insight",
  "/learn",
];

const LmsLanguageAuditSection = () => {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-black">LMS Language Audit</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">Read-only</Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          The Mini LMS / Blueprint experience must not surface 3-Day Challenge language.
          The terms below should not appear inside any LMS route.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">LMS routes audited</h3>
            <ul className="mt-2 space-y-1">
              {LMS_ROUTES_TO_AUDIT.map(r => (
                <li key={r}><RouteCode route={r} /></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">Forbidden challenge terms</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {LMS_FORBIDDEN_TERMS.map(term => (
                <li key={term}>
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                    {term}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">Approved LMS replacements</h3>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            <li><span className="text-muted-foreground">Day 1 →</span> <span className="font-semibold">Foundations</span></li>
            <li><span className="text-muted-foreground">Day 2 →</span> <span className="font-semibold">Growth Opportunity</span></li>
            <li><span className="text-muted-foreground">Day 3 →</span> <span className="font-semibold">Referral Loops</span></li>
            <li><span className="text-muted-foreground">Challenge Progress →</span> <span className="font-semibold">Learning Progress</span></li>
            <li><span className="text-muted-foreground">Start Challenge →</span> <span className="font-semibold">Start Learning</span></li>
            <li><span className="text-muted-foreground">Complete Day →</span> <span className="font-semibold">Complete Module</span></li>
            <li><span className="text-muted-foreground">Unlock Rewards →</span> <span className="font-semibold">Unlock Full Course</span></li>
            <li><span className="text-muted-foreground">Reward Points →</span> <span className="font-semibold">Course Access</span></li>
            <li><span className="text-muted-foreground">Bonus Vault →</span> <span className="font-semibold">Premium Modules</span></li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          This is a static checklist — review LMS pages manually against this list to confirm no challenge language has crept in.
        </p>
      </CardContent>
    </Card>
  );
};

type BridgeCheck = { label: string; status: Status; note?: string };

const BRIDGE_CHECKS: BridgeCheck[] = [
  { label: "Module 3 completion bridge route exists", status: "Detected", note: "/blueprint/bridge" },
  { label: "LMS Module 3 routes to bridge (no auto Day 1 redirect)", status: "Detected", note: "Manual navigation only" },
  { label: "Bridge shows 3-day challenge preview", status: "Detected", note: "Day 1 / Day 2 / Day 3 cards on bridge" },
  { label: "Bridge has primary 'Start The 3-Day Challenge' CTA", status: "Detected", note: "→ /user-dashboard" },
  { label: "Bridge has secondary 'Continue Learning' CTA", status: "Detected", note: "→ /blueprint/dashboard" },
  { label: "Bridge sets enteredChallengeFromLMS flag", status: "Detected", note: "aiOutputs.entered_challenge_from_lms" },
  { label: "Bridge captures optional build intent", status: "Detected", note: "aiOutputs.lms_build_intent" },
  { label: "LMS positioning: 'learn the system'", status: "Detected" },
  { label: "Challenge positioning: 'implement the system'", status: "Detected" },
  { label: "No abrupt LMS → Day 1 redirect", status: "Detected" },
  { label: "Challenge rewards hidden from LMS surface", status: "Detected" },
];

const BridgeAuditSection = () => (
  <Card className="border-border">
    <CardContent className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black">LMS → Challenge Bridge</h2>
        <Badge variant="outline" className="ml-auto text-[10px]">Read-only</Badge>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        The transition from learning to implementation must be intentional, contextual, and never automatic.
      </p>
      <ul className="space-y-2">
        {BRIDGE_CHECKS.map(c => (
          <li key={c.label} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
            </div>
            <StatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

// ───────── Premium / Ascension audit ─────────
type PremiumCheck = { label: string; status: Status; note?: string };

const PREMIUM_CHECKS: PremiumCheck[] = [
  { label: "Locked premium modules exist (4 & 5)", status: "Detected", note: "src/pages/blueprint/BlueprintLesson.tsx — modules 4 & 5 marked locked" },
  { label: "Locked module preview (blur, lock, teaser)", status: "Detected", note: "LockedModuleView with preview bullets + blurred body" },
  { label: "Premium access state", status: "Detected", note: "src/lib/premium.ts + usePremium hook (localStorage)" },
  { label: "Coupon support (FOUNDING497)", status: "Detected", note: "validateCoupon + Apply coupon UI on /upgrade" },
  { label: "Upgrade page exists", status: "Detected", note: "/upgrade — hero, modules, audience, challenge connection" },
  { label: "Upgrade CTA from locked modules", status: "Detected", note: "Unlock Full Course → /upgrade" },
  { label: "Premium unlock removes blur", status: "Detected", note: "BlueprintLesson uses unlocked = !locked || isPremium" },
  { label: "Premium and Challenge remain separate", status: "Detected", note: "No automatic redirects between them" },
  { label: "Premium positioned around AI implementation", status: "Detected", note: "Module 4/5 copy and benefits emphasise AI workflows" },
];

const PremiumAuditSection = () => (
  <Card className="border-border">
    <CardContent className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black">Premium / Ascension Funnel</h2>
        <Badge variant="outline" className="ml-auto text-[10px]">Read-only</Badge>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Free LMS → Premium course → Challenge are distinct experiences. Premium adds depth and scale, the challenge drives implementation.
      </p>
      <ul className="space-y-2">
        {PREMIUM_CHECKS.map(c => (
          <li key={c.label} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
            </div>
            <StatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const UserFeaturesAudit = () => {
  const [auditedAt, setAuditedAt] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);

  const allFeatures = useMemo(() => CATEGORIES.flatMap(c => c.features), []);
  const totals = useMemo(() => ({
    routes: ROUTES.filter(r => r.status === "Detected").length,
    features: countByStatus(allFeatures, "Detected"),
    review: countByStatus(allFeatures, "Needs review") + countByStatus(allFeatures, "Partially detected"),
    conflicts: CONFLICTS.length,
    entries: ENTRY_POINTS.filter(e => e.status === "Detected").length,
  }), [allFeatures, tick]);

  useEffect(() => { /* internal audit view */ }, []);

  const refresh = () => {
    setAuditedAt(new Date());
    setTick(t => t + 1);
    // user_features_audit_refreshed (not in registry; skipped)
    toast.success("Audit refreshed");
  };

  const buildSummary = () => {
    const lines: string[] = [];
    lines.push(`Leadio User Journey & Feature Audit — ${auditedAt.toLocaleString()}`);
    lines.push("");
    lines.push(`Routes detected: ${totals.routes}`);
    lines.push(`Features detected: ${totals.features}`);
    lines.push(`Features needing review: ${totals.review}`);
    lines.push(`Potential conflicts: ${totals.conflicts}`);
    lines.push(`Entry points detected: ${totals.entries}`);
    lines.push("");
    CATEGORIES.forEach(c => {
      lines.push(`# ${c.title}`);
      c.features.forEach(f => lines.push(`  - [${f.status}] ${f.name}${f.note ? ` — ${f.note}` : ""}`));
    });
    lines.push("");
    lines.push("# Conflicts");
    CONFLICTS.forEach(c => lines.push(`  - ${c.flag}`));
    lines.push("");
    lines.push("# Recommendations");
    RECOMMENDATIONS.forEach(r => lines.push(`  - ${r}`));
    return lines.join("\n");
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast.success("Audit summary copied");
  };

  const exportJson = () => {
    const data = { auditedAt: auditedAt.toISOString(), totals, routes: ROUTES, categories: CATEGORIES, entryPoints: ENTRY_POINTS, journey: JOURNEY_STAGES, roles: ROLES, conflicts: CONFLICTS, recommendations: RECOMMENDATIONS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leadio-audit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-500" />
        <Badge variant="outline" className="border-amber-500/40 text-amber-600">Review-only — no app changes are made from this page.</Badge>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-black sm:text-4xl">Leadio User Journey & Feature Audit</h1>
        <p className="mt-2 text-base text-muted-foreground">A read-only overview of the current user-facing product, routes, features, and journey gaps.</p>
      </header>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">Last audited at <span className="font-semibold text-foreground">{auditedAt.toLocaleString()}</span></p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={refresh} size="sm" className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh Audit</Button>
          <Button onClick={copySummary} size="sm" variant="outline" className="gap-2"><Copy className="h-4 w-4" /> Copy Summary</Button>
          <Button onClick={exportJson} size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export JSON</Button>
        </div>
      </div>

      {/* Summary metrics */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Routes", value: totals.routes },
          { label: "Features", value: totals.features },
          { label: "Needs review", value: totals.review },
          { label: "Conflicts", value: totals.conflicts },
          { label: "Entry points", value: totals.entries },
        ].map(m => (
          <Card key={m.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-black">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="space-y-4">
        {/* Core Entry Links — owner control hub */}
        <CoreEntryLinksSection />

        {/* Experience Separation */}
        <ExperienceSeparationSection />

        {/* LMS Language Audit */}
        <LmsLanguageAuditSection />

        {/* LMS → Challenge Bridge */}
        <BridgeAuditSection />

        {/* Premium / Ascension */}
        <PremiumAuditSection />

        {/* Navigation & Stage cohesion */}
        <NavCohesionSection />

        {/* Feature registry */}
        <Section title="Feature Registry">
          <div className="grid gap-4 md:grid-cols-2">
            {CATEGORIES.map(cat => (
              <div key={cat.title} className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">{cat.title}</h3>
                <ul className="mt-3 space-y-2">
                  {cat.features.map(f => (
                    <li key={f.name} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{f.name}</p>
                        {f.note && <p className="text-xs text-muted-foreground">{f.note}</p>}
                      </div>
                      <StatusBadge status={f.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Journey map */}
        <Section title="Current User Journey Map">
          <ol className="space-y-3">
            {JOURNEY_STAGES.map((s, i) => (
              <li key={s.stage} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                  <h3 className="text-sm font-black">{s.stage}</h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.routes.map(r => <RouteCode key={r} route={r} />)}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{s.notes}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Entry points */}
        <Section title="Top-of-Funnel Entry Points">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Entry</th><th>Route</th><th>Status</th><th>Next</th><th>Handoff clear?</th></tr>
              </thead>
              <tbody>
                {ENTRY_POINTS.map(e => (
                  <tr key={e.name} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold">{e.name}</td>
                    <td className="pr-3"><RouteCode route={e.route} /></td>
                    <td className="pr-3"><StatusBadge status={e.status} /></td>
                    <td className="pr-3 text-muted-foreground">{e.next}</td>
                    <td className="pr-3">{e.clear ? <Badge className="bg-success/15 text-success">Clear</Badge> : <Badge variant="outline" className="border-amber-500/40 text-amber-600">Unclear</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Routes */}
        <Section title="Routes Detected">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Route</th><th>Purpose</th><th>Access</th><th>Status</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {ROUTES.map(r => (
                  <tr key={r.route} className="border-t border-border align-top">
                    <td className="py-2 pr-3"><RouteCode route={r.route} /></td>
                    <td className="pr-3">{r.purpose}</td>
                    <td className="pr-3"><Badge variant="outline">{r.access}</Badge></td>
                    <td className="pr-3"><StatusBadge status={r.status} /></td>
                    <td className="pr-3 text-xs text-muted-foreground">{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Roles */}
        <Section title="Role-Based Experiences">
          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map(r => (
              <div key={r.role} className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-black">{r.role}</h3>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <div><dt className="font-bold text-muted-foreground">Sees</dt><dd>{r.sees}</dd></div>
                  <div><dt className="font-bold text-muted-foreground">Should not see</dt><dd>{r.hidden}</dd></div>
                  <div><dt className="font-bold text-muted-foreground">Journey</dt><dd>{r.journey}</dd></div>
                  <div><dt className="font-bold text-muted-foreground">Possible confusion</dt><dd className="text-amber-600">{r.confusion}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </Section>

        {/* Conflicts */}
        <Section title="Potential Conflicts">
          <ul className="space-y-2">
            {CONFLICTS.map(c => (
              <li key={c.flag} className={`flex items-start gap-3 rounded-xl border p-3 ${c.severity === "warn" ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"}`}>
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${c.severity === "warn" ? "text-destructive" : "text-muted-foreground"}`} />
                <p className="text-sm">{c.flag}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Recommendations */}
        <Section title="Owner Review Notes">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {RECOMMENDATIONS.map(r => <li key={r}>{r}</li>)}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">These are observations only — no changes have been made.</p>
        </Section>
      </div>
    </main>
  );
};

export default UserFeaturesAudit;
