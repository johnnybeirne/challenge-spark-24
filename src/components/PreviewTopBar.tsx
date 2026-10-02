import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye } from "lucide-react";
import { useQaPreview } from "@/hooks/useQaPreview";
import { clearQaState } from "@/lib/qaPreview";
import { useLocation } from "react-router-dom";
import { Play, LayoutDashboard, Pencil, ExternalLink } from "lucide-react";
import { isPreviewHost } from "@/lib/utils";
import QaModePanel from "@/components/QaModePanel";

/**
 * Owner-only utility bar pinned across the top of the preview host.
 * Never renders on the published site. Links: Simulator, Admin console,
 * and a context-aware Edit page (public page) or Preview page (editor).
 */

const BAR_H = 32;

// Public page -> editor
const EDIT_MAP: { test: (p: string) => boolean; href: string }[] = [
  { test: (p) => p === "/", href: "/owner-console/content" },
  { test: (p) => p.startsWith("/challenge/join") || p === "/join", href: "/owner-console/challenge-sales" },
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

export function previewBarVisible(): boolean {
  if (typeof window === "undefined") return false;
  let inSimulator = false;
  try {
    inSimulator = window.self !== window.top && window.parent.location.pathname.startsWith("/admin/simulator");
  } catch {
    inSimulator = false;
  }
  const host = window.location.hostname;
  const onPreview = isPreviewHost() || host.endsWith(".lovableproject.com") || host.startsWith("preview--");
  return onPreview && !inSimulator;
}

export default function PreviewTopBar() {
  const { pathname } = useLocation();
  const qa = useQaPreview();
  // Hide only inside the simulator's own frame (same-origin parent).
  // The Lovable editor preview is also a frame, but a cross-origin one, so it still shows.
  let inSimulator = false;
  try {
    inSimulator = window.self !== window.top && window.parent.location.pathname.startsWith("/admin/simulator");
  } catch {
    inSimulator = false;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const onPreview = isPreviewHost() || host.endsWith(".lovableproject.com") || host.startsWith("preview--");
  const show = onPreview && !inSimulator;

  useEffect(() => {
    if (!show) return;
    document.documentElement.classList.add("has-preview-bar");
    return () => document.documentElement.classList.remove("has-preview-bar");
  }, [show]);

  if (!show) return null;

  const inConsole = pathname.startsWith("/owner-console") || pathname.startsWith("/admin");
  const editHref = !inConsole ? EDIT_MAP.find((m) => m.test(pathname))?.href : undefined;
  const previewHref = inConsole ? PREVIEW_MAP[pathname.replace(/\/$/, "")] : undefined;

  // Portal onto <html> so the body offset/transform can't misplace or block the bar.
  return createPortal(
    <div
      className="preview-top-bar fixed inset-x-0 z-[200] flex items-center gap-1 overflow-x-auto bg-foreground px-3"
      style={{ height: BAR_H, top: 0 }}
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
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("leadio:toggle-qa-panel"))}
        className={linkCls}
      >
        <Eye className="h-3.5 w-3.5" /> QA mode
      </button>
      {qa.active && (
        <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
          <Eye className="h-3.5 w-3.5" />
          QA Preview: {qa.tier} · {qa.entry.replace(/_/g, " ")}
          <button
            type="button"
            onClick={() => clearQaState()}
            className="rounded bg-amber-950/15 px-1.5 py-px text-[10px] font-black hover:bg-amber-950/25"
          >
            Exit
          </button>
        </span>
      )}
    </div>,
    document.documentElement,
  );
}

/** Single QA panel instance for every preview page, opened from the top bar. */
export function PreviewQaPanel() {
  if (!previewBarVisible()) return null;
  return <QaModePanel />;
}
