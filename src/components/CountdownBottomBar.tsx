import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";

/**
 * Solid bottom bar that surfaces the rolling 72-hour challenge deadline
 * without per-second renders, scroll listeners, or intercepted gestures.
 */
const CountdownBottomBar = ({ sidebarCollapsed = false }: { sidebarCollapsed?: boolean }) => {
  const { state } = useAppState();
  const started = !!state.challenge?.startedAt;
  const endsAt = getChallengeEndsAt(state.challenge?.startedAt, state.challenge?.endsAt);
  const [now, setNow] = useState(() => Date.now());

  // Tick lightly so scrolling stays smooth while the fixed bar is mounted.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!started) return null;
  const remaining = getRemainingMs(endsAt, now);
  if (remaining <= 0) return null;

  const { days, hours, minutes } = formatRemaining(remaining);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const sep = <span className="opacity-60">·</span>;

  const endsAtMs = new Date(endsAt).getTime();
  const startedAtMs = state.challenge?.startedAt ? new Date(state.challenge.startedAt).getTime() : endsAtMs - 72 * 3600 * 1000;
  const totalMs = Math.max(1, endsAtMs - startedAtMs);
  const elapsedPct = Math.min(100, Math.max(0, ((totalMs - remaining) / totalMs) * 100));

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30",
        "bottom-20 lg:bottom-0",
        sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]",
      )}
    >
      <div
        className="relative flex w-full items-center justify-center gap-2 overflow-hidden border-t border-white/10 bg-[hsl(220,13%,12%)] px-6 py-1.5 text-sm font-normal text-white/70"
        role="status"
        title={`Challenge ends ${new Date(endsAt).toLocaleString()}`}
        aria-label={`${Math.round(elapsedPct)}% of challenge time elapsed`}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-white/[0.06]"
          style={{ width: `${elapsedPct}%` }}
          aria-hidden="true"
        />
        <Clock className="relative h-3.5 w-3.5 opacity-50" />
        <span className="relative tabular-nums tracking-wide">
          {days > 0 && <>{days}d {sep} </>}
          {hours}h {sep} {pad(minutes)}m left
        </span>
      </div>
    </div>
  );
};

export default CountdownBottomBar;
