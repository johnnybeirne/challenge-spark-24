import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart3, Users, Activity, Shield, FileText, GraduationCap, Eye, MessageCircle, FileEdit, Home, ListChecks, Tag, LogOut, Mail, Handshake, BookOpen, IdCard, MessagesSquare, Globe, HelpCircle, Sparkles, ClipboardCheck, Type, Trophy, Search, X, MonitorPlay, KeyRound, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof Eye;
  end?: boolean;
  external?: boolean;
  keywords?: string[];
};

const items: NavItem[] = [
  { title: "View as user", url: "/owner-console/view-as-user", icon: Eye, external: true, keywords: ["impersonate", "preview", "participant", "as user"] },
  { title: "User quiz preview", url: "/quiz-preview", icon: ListChecks, external: true, keywords: ["quiz", "preview", "diagnostic", "assessment"] },
  { title: "Quiz preview tips", url: "/owner-console/quiz-preview-tips", icon: HelpCircle, external: true, keywords: ["quiz", "tips", "tooltip", "help"] },
  { title: "Product overview", url: "/owner-console/overview", icon: FileText, external: true, keywords: ["overview", "docs", "summary"] },
  { title: "Registrants", url: "/owner-console/bios", icon: IdCard, external: true, keywords: ["users", "participants", "signups", "bios", "members", "referral link"] },
  { title: "JV partners", url: "/owner-console/jv-partners", icon: Handshake, external: true, keywords: ["partners", "affiliates", "jv"] },
  { title: "Console home", url: "/owner-console", icon: LayoutDashboard, end: true, external: true, keywords: ["home", "dashboard", "admin"] },
  { title: "Quiz LP Editor", url: "/owner-console/content", icon: FileEdit, external: true, keywords: ["landing page", "copy", "headline", "quiz page", "content"] },
  { title: "Powered By Page", url: "/owner-console/powered-by-editor", icon: Globe, external: true, keywords: ["powered by", "branding", "footer"] },
  { title: "Resource library", url: "/owner-console/resources", icon: BookOpen, external: true, keywords: ["downloads", "files", "library", "resources"] },
  { title: "Analytics", url: "/owner-console/analytics", icon: BarChart3, external: true, keywords: ["stats", "metrics", "events", "tracking"] },
  { title: "Waitlist email", url: "/owner-console/waitlist-email", icon: Mail, external: true, keywords: ["email", "waitlist", "template"] },
  { title: "Newsletter", url: "/owner-console/newsletter", icon: Mail, external: true, keywords: ["email", "broadcast", "newsletter"] },
  {
    title: "Milestone emails",
    url: "/owner-console/milestone-emails",
    icon: Mail,
    external: true,
    keywords: ["email", "day 1", "day 2", "day 3", "complete"],
  },
  { title: "Promoters", url: "/owner-console/promoters", icon: Users, external: true, keywords: ["referrers", "leaderboard", "top inviters"] },
  { title: "Activity feed", url: "/owner-console/activity", icon: Activity, external: true, keywords: ["feed", "events", "log", "activity"] },
  { title: "Training system", url: "/owner-console/training", icon: GraduationCap, external: true, keywords: ["training", "lessons", "course", "modules"] },
  { title: "Day 1 step editor", url: "/owner-console/day1-steps", icon: MessagesSquare, external: true, keywords: ["day 1", "questions", "steps", "setup", "chat"] },
  { title: "Day 2 button labels", url: "/owner-console/day2-buttons", icon: MessagesSquare, external: true, keywords: ["day 2", "buttons", "labels", "cta"] },
  { title: "Locked day messages", url: "/owner-console/unlocks", icon: Lock, external: true, keywords: ["unlock", "gate", "day 2", "day 3", "locked", "free window", "passed", "invite", "buy", "message"] },
  { title: "Lead gen quiz", url: "/owner-console/lead-gen-quiz", icon: ListChecks, external: true, keywords: ["quiz", "questions", "diagnostic", "scoring", "lead gen"] },
  { title: "Lead gen quiz responses", url: "/owner-console/diagnostic-responses", icon: MessageCircle, external: true, keywords: ["responses", "answers", "results", "submissions", "scores"] },
  { title: "Results advisor prompts", url: "/owner-console/results-advisor-prompts", icon: Sparkles, external: true, keywords: ["results", "advisor", "ai", "prompts"] },
  {
    title: "Typography",
    url: "/owner-console/typography",
    icon: Type,
    external: true,
    keywords: ["font", "size", "heading", "text"],
  },
  { title: "Coupons", url: "/owner-console/coupons", icon: Tag, external: true, keywords: ["discount", "promo code", "voucher", "coupon"] },
  {
    title: "Premium upsell",
    url: "/owner-console/premium-upsell",
    icon: Sparkles,
    external: true,
    keywords: ["upsell", "invite", "upgrade", "day 2"],
  },
  { title: "Rewards ladder", url: "/owner-console/rewards-ladder", icon: Trophy, external: true, keywords: ["rewards", "points", "ladder", "tiers", "prizes", "redeem"] },
  {
    title: "Hover Tips",
    url: "/owner-console/nav-tips",
    icon: HelpCircle,
    external: true,
    keywords: ["hover", "tooltip", "tooltips", "nav tips", "hints", "sidebar tips"],
  },
  {
    title: "User Tour Walkthrough",
    url: "/owner-console/user-tour",
    icon: HelpCircle,
    external: true,
    keywords: [
      "user tour",
      "product tour",
      "tour",
      "walkthrough",
      "guided tour",
      "onboarding",
      "first run",
      "welcome",
      "steps",
      "driver",
      "popover",
      "intro",
    ],
  },
  { title: "Access pages", url: "/owner-console/access-pages", icon: FileEdit, external: true, keywords: ["training", "community", "events", "tagline", "headings", "access"] },
  {
    title: "LeadTree AI prompts",
    url: "/owner-console/mentor-prompts",
    icon: Sparkles,
    external: true,
    keywords: ["mentor", "coach", "starter", "prompts", "suggested"],
  },
  {
    title: "LeadTree AI settings",
    url: "/owner-console/ai-coach-settings",
    icon: Sparkles,
    external: true,
    keywords: ["system prompt", "mentor", "copilot", "max tokens", "heading", "fallback"],
  },
  { title: "Feature extractor", url: "/feature-extractor", icon: Sparkles, external: true, keywords: ["features", "extract", "audit"] },
  { title: "Requirements checklist", url: "/requirements-checklist", icon: ClipboardCheck, external: true, keywords: ["checklist", "requirements", "launch"] },
  {
    title: "QA challenge runner",
    url: "/admin/qa-run",
    icon: ClipboardCheck,
    external: true,
    keywords: ["qa", "test", "end to end", "runner", "demo", "smoke"],
  },
  {
    title: "Private guest passes",
    url: "/owner-console/guest-passes",
    icon: KeyRound,
    external: true,
    keywords: ["guest", "secret", "private", "invite", "look around", "pass", "access link"],
  },
  {
    title: "Challenge simulator",
    url: "/admin/simulator",
    icon: MonitorPlay,
    external: true,
    keywords: ["simulator", "walkthrough", "presentation", "demo", "preview", "screens", "play"],
  },
];

const siteItems: NavItem[] = [
  { title: "Landing page", url: "/", icon: Home, external: true, keywords: ["home", "landing", "public site"] },
  { title: "Waitlist thanks (preview)", url: "/waitlist/thanks?preview=1", icon: Eye, external: true, keywords: ["waitlist", "thanks", "confirmation"] },
  {
    title: "Course Sales Page",
    url: "/owner-console/premium-page",
    icon: FileEdit,
    external: true,
    keywords: ["premium page", "course", "sales", "enrol", "pricing", "497"],
  },
  { title: "Builder Prompts", url: "/owner-console/builder-prompts", icon: FileEdit, keywords: ["prompts", "builder", "ai", "day prompts"] },
  {
    title: "Referral settings",
    url: "/owner-console/referral-settings",
    icon: FileEdit,
    keywords: [
      "points",
      "badges",
      "featured creator",
      "invites",
      "threshold",
      "access",
      "access settings",
      "500",
      "free access",
      "membership",
    ],
  },
];

const matches = (item: NavItem, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.title, item.url.replace(/[-/]/g, " "), ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  // every word typed must appear somewhere, so "tour tips" and "product tour" both match
  return q.split(/\s+/).every((word) => haystack.includes(word));
};

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/challenge/join", { replace: true });
  };

  const filteredAdmin = useMemo(() => items.filter((i) => matches(i, query)), [query]);
  const filteredSite = useMemo(() => siteItems.filter((i) => matches(i, query)), [query]);
  const showLogout = !query || "log out".includes(query.toLowerCase());
  const noResults =
    Boolean(query) && filteredAdmin.length === 0 && filteredSite.length === 0 && !showLogout;

  const renderLink = (item: NavItem, active?: boolean) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        {item.external ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </a>
        ) : (
          <a href={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </a>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Owner Console</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Challenge</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <div className="px-2 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings..."
                aria-label="Search settings"
                className="h-8 w-full rounded-md border border-sidebar-border bg-background pl-7 pr-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {noResults && (
          <p className="px-4 py-3 text-xs text-muted-foreground">No settings found.</p>
        )}

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => {
                  const active = item.end
                    ? location.pathname === item.url
                    : location.pathname.startsWith(item.url);
                  return renderLink(item, active);
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(filteredSite.length > 0 || showLogout) && (
          <SidebarGroup>
            <SidebarGroupLabel>Site</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSite.map((item) => renderLink(item))}
                {showLogout && (
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
