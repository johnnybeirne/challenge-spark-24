import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";
import { pointRewards } from "@/lib/points";

const ladder = pointRewards.map((r) => ({ points: r.points, name: r.title }));

const RedeemPoints = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const points = state.points?.total ?? 0;

  // Unlocked milestones are fully derived from `points` (which is canonical in
  // Supabase via state.points). No local cache needed — keeps the page
  // consistent across devices and browsers.


  const next = useMemo(
    () => ladder.find((l) => l.points > points) ?? ladder[ladder.length - 1],
    [points]
  );
  const prevMilestone = useMemo(() => {
    const reached = ladder.filter((l) => l.points <= points);
    return reached.length ? reached[reached.length - 1].points : 0;
  }, [points]);
  const progressPct = next
    ? Math.min(
        100,
        Math.round(((points - prevMilestone) / (next.points - prevMilestone)) * 100)
      )
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-32">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Top */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Unlock Rewards</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            As your points grow, you unlock more rewards.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Points track your progress — they’re never used up.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            You have <span className="font-semibold text-foreground">{points} points</span>
          </p>
          {next && (
            <p className="mt-1 text-xs text-muted-foreground">
              Your next reward unlocks at <span className="font-semibold text-foreground">{next.points} points</span>
            </p>
          )}
          <div className="mt-4">
            <Progress value={progressPct} className="h-2" />
            {next && (
              <p className="mt-2 text-xs text-muted-foreground">
                {points} / {next.points} points
              </p>
            )}
          </div>
        </div>

        {/* Ladder */}
        <ol className="relative border-l border-border pl-6">
          {ladder.map((item) => {
            const isUnlocked = points >= item.points;
            const remaining = Math.max(0, item.points - points);
            return (
              <li key={item.points} className="relative mb-6 last:mb-0">
                <span
                  className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                    isUnlocked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isUnlocked ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.points} Points
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{item.name}</p>
                    {isUnlocked ? (
                      <p className="mt-0.5 text-xs font-semibold text-primary">Unlocked ✓</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Locked · You need {remaining} more points
                      </p>
                    )}
                  </div>
                  {isUnlocked && (
                    <Button size="sm" variant="outline">
                      View Reward
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Sticky momentum nudge */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="app-page-container flex items-center justify-between gap-4 py-3">
          <div className="min-w-0 text-center mx-auto sm:mx-0 sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              Fastest way to unlock more rewards
            </p>
            <p className="truncate text-sm text-foreground">
              Invite 1 person who joins{" "}
              <span className="font-bold text-primary">+50 points</span>
            </p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => navigate("/referrals")}>
            <UserPlus className="h-4 w-4" /> Invite People
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RedeemPoints;
