import { UserPlus, FileText, Sparkles, Compass, Trophy } from "lucide-react";
import { useAppState } from "@/context/AppContext";

/**
 * ReferralMilestoneCard — premium horizontal funnel showing how the friends you
 * invited are progressing: Joined → Quiz → Day 1 → Day 2 → Day 3.
 * Each milestone shows the live count + a "+50 pts" reward badge.
 */
const ReferralMilestoneCard = () => {
  const { state } = useAppState();
  const direct = state.network.direct ?? 0;
  const quiz = state.network.directQuizCompleted ?? 0;
  const d1 = state.network.directDay1Completed ?? 0;
  const d2 = state.network.directDay2Completed ?? 0;
  const d3 = state.network.directDay3Completed ?? 0;

  const milestones = [
    { key: "joined", label: "Joined", count: direct, icon: UserPlus, reward: null as string | null },
    { key: "quiz", label: "Quiz", count: quiz, icon: FileText, reward: "+50 pts" },
    { key: "day1", label: "Day 1", count: d1, icon: Sparkles, reward: "+50 pts" },
    { key: "day2", label: "Day 2", count: d2, icon: Compass, reward: "+50 pts" },
    { key: "day3", label: "Day 3", count: d3, icon: Trophy, reward: "+50 pts" },
  ];

  return (
    <section className="mb-14">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Friends in motion
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        You earn 50 points each time a friend you invited reaches a new milestone.
      </p>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <ol className="flex items-stretch gap-2 overflow-x-auto sm:gap-3">
          {milestones.map((m, i) => {
            const active = m.count > 0;
            const Icon = m.icon;
            return (
              <li
                key={m.key}
                className="flex min-w-[112px] flex-1 flex-col items-center gap-2 text-center"
              >
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div
                      className={`-mr-1 h-px flex-1 ${
                        milestones[i - 1].count > 0 && active ? "bg-primary/40" : "bg-border"
                      }`}
                    />
                  )}
                  <div
                    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {i < milestones.length - 1 && (
                    <div
                      className={`-ml-1 h-px flex-1 ${
                        milestones[i + 1].count > 0 && active ? "bg-primary/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className="leading-tight">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-black tabular-nums ${
                      active ? "text-foreground" : "text-muted-foreground/70"
                    }`}
                  >
                    {m.count}
                  </p>
                  {m.reward && (
                    <p
                      className={`mt-0.5 text-[10px] font-semibold tabular-nums ${
                        active ? "text-primary" : "text-muted-foreground/60"
                      }`}
                    >
                      {m.reward}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {direct === 0 && (
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Share your link above to get the first milestone moving.
          </p>
        )}
      </div>
    </section>
  );
};

export default ReferralMilestoneCard;
