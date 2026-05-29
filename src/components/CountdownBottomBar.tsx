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

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30",
        "bottom-20 lg:bottom-0",
        sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]",
      )}
    >
      <div
        className="flex w-full items-center justify-center gap-3 border-t border-countdown/75 bg-countdown/75 px-6 py-4 text-base font-semibold text-countdown-foreground shadow-sm backdrop-blur-md sm:text-lg"
        role="status"
        title={`Challenge ends ${new Date(endsAt).toLocaleString()}`}
      >
        <Clock className="h-6 w-6" />
        <span className="tabular-nums">
          {days > 0 && <>{days}d {sep} </>}
          {hours}h {sep} {pad(minutes)}m left
        </span>
      </div>

    </div>
  );
};

export default CountdownBottomBar;
