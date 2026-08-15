import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useAccessSettings } from "@/hooks/useAccessSettings";
import { useReferredPeople } from "@/hooks/useReferredPeople";

const PURPLE = "#534AB7";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DEEP = "#26215C";
const GREEN_TINT = "#E1F5EE";
const GREEN_LABEL = "#0F6E56";
const GREEN_DEEP = "#04342C";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const useCountUp = (target: number, ready: boolean) => {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready || done) return;
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      setDone(true);
      return;
    }
    setDone(true);
    const duration = 900;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, target, done]);

  return value;
};

const MILESTONES = [
  { label: "You signed up", points: 50 },
  { label: "Day 1 complete", points: 100 },
  { label: "Day 2 complete", points: 150 },
  { label: "Day 3 complete", points: 200 },
];

type Props = {
  /** Optional tier / rank label shown beside the points number. */
  tierLabel?: string;
  subtitle?: string;
};

/** Shared header for /invites and /rewards: title, stat tiles, points ladder. */
const InvitesRewardsHeader = ({ tierLabel, subtitle }: Props) => {
  const { state } = useAppState();
  const { loading: accessLoading } = useAccessStatus();
  // Same source as the Momentum panel so both always agree.
  const pointsTotal = state.points?.total ?? 0;
  const { pointsThreshold } = useAccessSettings();
  const { count, loading: peopleLoading } = useReferredPeople();

  const ready = !accessLoading && !peopleLoading;
  const animatedPoints = useCountUp(pointsTotal, ready);
  const animatedPeople = useCountUp(count, ready);

  const firstName = (state.user?.name ?? "").trim().split(/\s+/)[0] || "";
  const threshold = pointsThreshold || 500;
  const pct = (n: number) => Math.max(0, Math.min(100, (n / threshold) * 100));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[var(--h1-size)] font-bold leading-tight text-foreground">
          {firstName ? `${firstName}, here are your invites` : "Here are your invites"}
        </h1>
        <p className="text-[var(--body-size)] text-muted-foreground">
          {subtitle ?? "Invite people to join the challenge and keep your access free every 28 days."}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl p-5" style={{ backgroundColor: PURPLE_TINT }}>
          <p className="text-xs font-semibold tracking-wide" style={{ color: PURPLE }}>
            Points earned
          </p>
          <p className="mt-1 flex items-baseline gap-2" style={{ color: PURPLE_DEEP }}>
            <span className="text-4xl font-bold">{animatedPoints}</span>
            {tierLabel && <span className="text-xl font-medium">{tierLabel}</span>}
          </p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: GREEN_TINT }}>
          <p className="text-xs font-semibold tracking-wide" style={{ color: GREEN_LABEL }}>
            People you've invited
          </p>
          <p className="mt-1 text-4xl font-bold" style={{ color: GREEN_DEEP }}>
            {animatedPeople}
          </p>
        </div>
      </section>

      {/* Points ladder */}
      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2 border-b pb-2" style={{ borderColor: GREEN_TINT, color: GREEN_LABEL }}>
          <UserPlus className="h-4 w-4" />
          <span className="text-sm font-medium">Invite anytime, +50 each</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-3 flex-1 rounded-full" style={{ backgroundColor: PURPLE_TINT }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${pct(pointsTotal)}%`, backgroundColor: PURPLE }}
            />
            {MILESTONES.map((m) => (
              <span
                key={m.label}
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${pct(m.points)}%`,
                  backgroundColor: pointsTotal >= m.points ? PURPLE : "#B9B4EE",
                }}
              />
            ))}
          </div>
          <span className="shrink-0 text-sm font-semibold leading-tight text-foreground">
            Free premium
            <br />
            access
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {MILESTONES.map((m) => {
            const reached = pointsTotal >= m.points;
            return (
              <div key={m.label} className="space-y-0.5">
                <p className="text-xs font-semibold" style={{ color: reached ? PURPLE : "#6B7280" }}>
                  +50
                </p>
                <p className="text-xs" style={{ color: reached ? PURPLE : "#6B7280" }}>
                  {m.label}
                </p>
                <p className="text-xs text-muted-foreground">{m.points}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default InvitesRewardsHeader;
