import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";

/**
 * Subtle, transparent bottom bar that surfaces the rolling 72-hour
 * challenge deadline as H:MM:SS. Hides on scroll-down, reappears
 * on scroll-up or near the top so it never blocks reading.
 */
const CountdownBottomBar = () => {
  const { state } = useAppState();
  const started = !!state.challenge?.startedAt;
  const endsAt = getChallengeEndsAt(state.challenge?.startedAt, state.challenge?.endsAt);
  const [now, setNow] = useState(() => Date.now());
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  // Tick every second for live seconds display.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Hide on scroll down, show on scroll up or near top.
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 80) setVisible(true);
      else if (delta > 6) setVisible(false);
      else if (delta < -6) setVisible(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!started) return null;
  const remaining = getRemainingMs(endsAt, now);
  if (remaining <= 0) return null;

  const { days, hours, minutes, seconds } = formatRemaining(remaining);
  const urgent = remaining < 6 * 60 * 60 * 1000;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const sep = <span className="opacity-60">·</span>;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30 transition-all duration-300",
        "bottom-20 lg:bottom-0",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full items-center justify-center gap-2 border-t px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-md",
          urgent
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-foreground/20 bg-background/80 text-muted-foreground",
        )}
        role="status"
        title={`Challenge ends ${new Date(endsAt).toLocaleString()}`}
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="tabular-nums">
          {days > 0 && <>{days}d {sep} </>}
          {hours}h {sep} {pad(minutes)}m {sep} {pad(seconds)}s left
        </span>
      </div>
    </div>
  );
  );
};

export default CountdownBottomBar;
