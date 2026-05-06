import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";

const ladder = [
  { credits: 100, name: "Starter Resource Kit" },
  { credits: 200, name: "Reward coming soon" },
  { credits: 300, name: "Reward coming soon" },
  { credits: 400, name: "Reward coming soon" },
  { credits: 500, name: "Advanced Training" },
  { credits: 600, name: "Reward coming soon" },
  { credits: 700, name: "Reward coming soon" },
  { credits: 800, name: "Group 1:1 Access" },
  { credits: 900, name: "Reward coming soon" },
  { credits: 1000, name: "1:1 Call" },
];

const STORAGE_KEY = "leadio.unlockedRewards.v1";

const RedeemCredits = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const credits = state.credits?.total ?? 0;

  // Auto-unlock anything the user has reached (no spending)
  const [unlocked, setUnlocked] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: (string | number)[] = raw ? JSON.parse(raw) : [];
      const reached = ladder.filter((l) => credits >= l.credits).map((l) => l.credits);
      const merged = Array.from(new Set([...prev.map(Number).filter(Boolean), ...reached]));
      setUnlocked(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      setUnlocked(ladder.filter((l) => credits >= l.credits).map((l) => l.credits));
    }
  }, [credits]);

  const next = useMemo(
    () => ladder.find((l) => l.credits > credits) ?? ladder[ladder.length - 1],
    [credits]
  );
  const prevMilestone = useMemo(() => {
    const reached = ladder.filter((l) => l.credits <= credits);
    return reached.length ? reached[reached.length - 1].credits : 0;
  }, [credits]);
  const progressPct = next
    ? Math.min(
        100,
        Math.round(((credits - prevMilestone) / (next.credits - prevMilestone)) * 100)
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
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">You have</p>
            <p className="text-xs text-muted-foreground">
              Next reward at <span className="font-semibold text-foreground">{next.credits}</span>
            </p>
          </div>
          <p className="mt-1 text-3xl font-black text-foreground">
            {credits} <span className="text-base font-medium text-muted-foreground">points</span>
          </p>
          <div className="mt-4">
            <Progress value={progressPct} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {credits} / {next.credits} points
            </p>
          </div>
        </div>

        {/* Ladder */}
        <ol className="relative border-l border-border pl-6">
          {ladder.map((item) => {
            const isUnlocked = credits >= item.credits;
            const remaining = Math.max(0, item.credits - credits);
            return (
              <li key={item.credits} className="relative mb-6 last:mb-0">
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
                      {item.credits} Credits
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{item.name}</p>
                    {isUnlocked ? (
                      <p className="mt-0.5 text-xs font-semibold text-primary">Unlocked ✓</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Locked · You need {remaining} more credits
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
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fastest way to unlock more rewards
            </p>
            <p className="truncate text-sm text-foreground">
              Invite 1 person who joins{" "}
              <span className="font-semibold text-primary">+50 credits</span>
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

export default RedeemCredits;
