import { UserPlus } from "lucide-react";
import { usePointsProgress } from "@/hooks/usePointsProgress";

/** Shared design tokens for the points/invites surfaces. */
export const POINTS_PURPLE = "#534AB7";
export const POINTS_PURPLE_TINT = "#EEEDFE";
export const POINTS_PURPLE_DEEP = "#26215C";
export const POINTS_GREEN = "#1D9E75";
export const POINTS_GREEN_TINT = "#E1F5EE";
export const POINTS_GREEN_LABEL = "#0F6E56";
export const POINTS_GREEN_DEEP = "#04342C";

interface PointsHeaderCardProps {
  className?: string;
}

/**
 * Reusable points progress header: two stat tiles, an "invite anytime" banner,
 * a progress bar to the free-access threshold with the four earning
 * milestones ticked off, and the threshold end-cap.
 *
 * All figures come from usePointsProgress, the same hook the Momentum card
 * (RightSidebar) reads, so the two surfaces always agree.
 */
export function PointsHeaderCard({ className = "" }: PointsHeaderCardProps) {
  const { pointsTotal, pointsThreshold, inviteCount, progressPct, tierName, milestones, loading } =
    usePointsProgress();

  if (loading) {
    return (
      <div
        className={`h-[268px] animate-pulse rounded-2xl border border-border bg-muted/30 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${className}`}
      aria-label="Points progress"
    >
      {/* 1. Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: POINTS_PURPLE_TINT }}>
          <p className="text-xs font-semibold tracking-wide" style={{ color: POINTS_PURPLE }}>
            Points earned
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-4xl font-bold" style={{ color: POINTS_PURPLE_DEEP }}>
              {pointsTotal}
            </p>
            {tierName && (
              <span
                className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold"
                style={{ color: POINTS_PURPLE }}
              >
                {tierName}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: POINTS_GREEN_TINT }}>
          <p className="text-xs font-semibold tracking-wide" style={{ color: POINTS_GREEN_LABEL }}>
            People you've invited
          </p>
          <p className="mt-1 text-4xl font-bold" style={{ color: POINTS_GREEN_DEEP }}>
            {inviteCount}
          </p>
        </div>
      </div>

      {/* 2. Invite anytime banner, spans the full bar width */}
      <div
        className="mt-6 flex items-center justify-center gap-2 rounded-full py-2"
        style={{ backgroundColor: POINTS_GREEN_TINT, color: POINTS_GREEN_LABEL }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">Invite anytime, +50 each</span>
      </div>

      {/* 3-5. Progress bar with milestone ticks and the threshold end-cap */}
      <div className="relative mt-9 pb-11">
        {/* Threshold end-cap, anchored to the right end of the bar, inside the card */}
        <div className="absolute right-0 -top-6 text-right">
          <p className="text-[11px] font-semibold text-foreground">Free access</p>
          <p className="text-xs font-bold tabular-nums" style={{ color: POINTS_PURPLE }}>
            {pointsThreshold}
          </p>
        </div>

        {/* "+50" labels above each tick */}
        <div className="relative h-4">
          {milestones.map((m) => (
            <span
              key={m.id}
              className="absolute -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap"
              style={{ left: `${m.percent}%`, color: POINTS_PURPLE }}
            >
              +{m.delta}
            </span>
          ))}
        </div>

        {/* Bar, solid purple fill, no end-zone shading */}
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: POINTS_PURPLE_TINT }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: POINTS_PURPLE }}
          />
          {milestones.map((m) => (
            <span
              key={m.id}
              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
              style={{ left: `${m.percent}%` }}
            />
          ))}
        </div>

        {/* Labels and running totals below each tick */}
        <div className="relative mt-2 h-11">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 whitespace-nowrap text-center"
              style={{ left: `${m.percent}%` }}
            >
              <p className="text-[11px] font-semibold leading-tight text-foreground">{m.label[0]}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{m.label[1]}</p>
              <p className="text-[11px] font-semibold tabular-nums" style={{ color: POINTS_PURPLE }}>
                {m.total}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PointsHeaderCard;
