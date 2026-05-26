import { useLocation } from "react-router-dom";
import { Activity, BookOpen, Crown, Rocket } from "lucide-react";
import { getExperienceFromPath, type ExperienceType } from "@/lib/experienceShell";
import { cn } from "@/lib/utils";

type ModeStyle = {
  label: string;
  sub: string;
  Icon: typeof Activity;
  // Tailwind classes (semantic + branded tints kept inline since these are
  // intentional per-mode accents, not global tokens).
  badge: string;
  dot: string;
};

const MODE_STYLES: Partial<Record<ExperienceType, ModeStyle>> = {
  assessment: {
    label: "Assessment",
    sub: "Diagnostic",
    Icon: Activity,
    badge: "border-slate-300 bg-slate-50 text-slate-700",
    dot: "bg-slate-500",
  },
  lms: {
    label: "Blueprint",
    sub: "Free Training",
    Icon: BookOpen,
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  challenge: {
    label: "3-Day Challenge",
    sub: "Build Mode",
    Icon: Rocket,
    badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  paid: {
    label: "VIP",
    sub: "Premium",
    Icon: Crown,
    badge: "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800",
    dot: "bg-amber-500",
  },
};

const ExperienceModeBadge = ({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) => {
  const { pathname } = useLocation();
  const mode = getExperienceFromPath(pathname);
  const style = MODE_STYLES[mode];
  if (!style) return null;
  const { label, sub, Icon, badge, dot } = style;

  if (collapsed) {
    return (
      <div
        className={cn(
          "mx-auto flex h-8 w-8 items-center justify-center rounded-lg border",
          badge,
          className
        )}
        title={`${label} · ${sub}`}
      >
        <Icon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
        badge,
        className
      )}
      role="status"
      aria-label={`Current mode: ${label}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <Icon className="h-3.5 w-3.5" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11px] font-black uppercase tracking-wider">{label}</p>
        <p className="truncate text-[10px] font-semibold opacity-75">{sub}</p>
      </div>
    </div>
  );
};

export default ExperienceModeBadge;
