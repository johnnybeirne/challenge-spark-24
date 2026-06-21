import { Flame, Check } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const StreakIndicator = () => {
  const { state } = useAppState();
  const challenge = state.challenge;
  const currentDay = Math.min(challenge.currentDay || 1, 3);
  const isComplete = challenge.completed || challenge.currentDay > 3;

  // Derive streak: count of consecutive days completed starting at Day 1
  const days = [1, 2, 3] as const;
  const dayDone = (d: number) => isComplete || currentDay > d;

  let streak = 0;
  for (const d of days) {
    if (dayDone(d)) streak += 1;
    else break;
  }

  const hasMomentum = streak > 0;
  const nextDay = isComplete ? null : currentDay;

  const subtitle = isComplete
    ? "Three days locked in — your challenge is shipped."
    : streak === 0
    ? "Complete Day 1 today to start your streak."
    : streak === 3
    ? "Three days locked in — your challenge is shipped."
    : `Keep it alive — finish Day ${nextDay} to extend your streak.`;

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        hasMomentum
          ? "border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            <Flame className="h-3 w-3" /> Momentum
          </div>
          <h2 className="mt-3 text-xl font-black text-foreground sm:text-2xl">
            {streak}-day streak
          </h2>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl border ${
            hasMomentum
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
          aria-hidden
        >
          <Flame className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {days.map((d) => {
          const done = dayDone(d);
          const active = !done && d === currentDay && !isComplete;
          return (
            <div
              key={d}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                done
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : active
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5 opacity-60" />}
              Day {d}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StreakIndicator;
