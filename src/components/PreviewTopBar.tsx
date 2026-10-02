import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Play, LayoutDashboard, Pencil, ExternalLink } from "lucide-react";
import { isPreviewHost } from "@/lib/utils";

/**
 * Owner-only utility bar pinned across the top of the preview host.
 * Never renders on the published site. Links: Simulator, Admin console,
 * and a context-aware Edit page (public page) or Preview page (editor).
 */

const BAR_H = 32;

// Public page -> editor
const EDIT_MAP: { test: (p: string) => boolean; href: string }[] = [
  { test: (p) => p === "/", href: "/owner-console/content" },
  { test: (p) => p.startsWith("/challenge/join") || p === "/join", href: "/owner-console/content" },
  { test: (p) => p === "/challenge", href: "/owner-console/challenge-sales" },
  { test: (p) => p.startsWith("/results"), href: "/owner-console/results-page" },
  { test: (p) => p === "/report" || p.startsWith("/r/"), href: "/owner-console/report-page" },
  { test: (p) => p.startsWith("/assessment") || p.startsWith("/challenge/quiz"), href: "/owner-console/lead-gen-quiz" },
  { test: (p) => p.startsWith("/pipeline-scorecard"), href: "/owner-console/pipeline-scorecard" },
  { test: (p) => /\/day[-/]1$|day-1/.test(p), href: "/owner-console/day1" },
  { test: (p) => /\/day[-/]2$/.test(p), href: "/owner-console/day2" },
  { test: (p) => /\/day[-/]3$/.test(p), href: "/owner-console/day3" },
  { test: (p) => p.startsWith("/premium"), href: "/owner-console/premium-page" },
  { test: (p) => p.startsWith("/earn"), href: "/owner-console/referral-settings" },
  { test: (p) => p.startsWith("/powered-by"), href: "/owner-console/powered-by" },
  { test: (p) => p.startsWith("/about-me"), href: "/owner-console/content" },
  { test: (p) => p.startsWith("/challenger-dashboard"), href: "/owner-console/user-tour" },
];

// Editor -> public page
const PREVIEW_MAP: Record<string, string> = {
  "/owner-console/content": "/",
  "/owner-console/challenge-sales": "/challenge",
  "/owner-console/results-page": "/results",
  "/owner-console/report-page": "/report",
  "/owner-console/lead-gen-quiz": "/assessment",
  "/owner-console/pipeline-scorecard": "/pipeline-scorecard",
  "/owner-console/day1": "/challenge/day-1",
  "/owner-console/day2": "/challenge/day/2",
  "/owner-console/day3": "/challenge/day/3",
  "/owner-console/premium-page": "/premium",
  "/owner-console/premium-upsell": "/challenge/day/2",
  "/owner-console/referral-settings": "/earn",
  "/owner-console/powered-by": "/powered-by",
  "/owner-console/user-tour": "/challenger-dashboard",
  "/owner-console/nav-tips": "/challenger-dashboard",
  "/owner-console/quiz-preview-tips": "/quiz-preview",
};

const linkCls =
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold text-background/90 hover:bg-background/15 hover:text-background";

export default function PreviewTopBar() {
  const { pathname } = useLocation();
  const embedded = typeof window !== "undefined" && window.self !== window.top;
  const show = isPreviewHost() && !embedded;

  useEffect(() => {
    if (!show) return;
    document.documentElement.classList.add("has-preview-bar");
    return () => document.documentElement.classList.remove("has-preview-bar");
  }, [show]);

  if (!show) return null;

  const inConsole = pathname.startsWith("/owner-console") || pathname.startsWith("/admin");
  const editHref = !inConsole ? EDIT_MAP.find((m) => m.test(pathname))?.href : undefined;
  const previewHref = inConsole ? PREVIEW_MAP[pathname.replace(/\/$/, "")] : undefined;

  return (
    <div
      className="preview-top-bar fixed inset-x-0 z-[200] flex items-center gap-1 overflow-x-auto bg-foreground px-3"
      style={{ height: BAR_H, top: -BAR_H }}
    >
      <span className="mr-2 shrink-0 text-[10px] font-bold uppercase tracking-widest text-background/60">Preview</span>
      <a href="/admin/simulator" target="_blank" rel="noopener noreferrer" className={linkCls}>
        <Play className="h-3.5 w-3.5" /> Simulator
      </a>
      {!inConsole && (
        <a href="/owner-console" className={linkCls}>
          <LayoutDashboard className="h-3.5 w-3.5" /> Admin console
        </a>
      )}
      {editHref && (
        <a href={editHref} className={linkCls}>
          <Pencil className="h-3.5 w-3.5" /> Edit page
        </a>
      )}
      {inConsole && previewHref && (
        <a href={previewHref} target="_blank" rel="noopener noreferrer" className={linkCls}>
          <ExternalLink className="h-3.5 w-3.5" /> Preview page
        </a>
      )}
    </div>
  );
}
