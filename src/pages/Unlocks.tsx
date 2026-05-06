import { useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus, Check, ArrowRight as ArrowIcon, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";
import { getNextReward, creditRewards } from "@/lib/credits";

const dayRewards = [
  { day: 1, label: "Complete Day 1", credits: 10 },
  { day: 2, label: "Complete Day 2", credits: 15 },
  { day: 3, label: "Complete Day 3", credits: 25 },
];

const StatusIcon = ({ status }: { status: "done" | "current" | "locked" }) => {
  if (status === "done") return <Check className="h-3.5 w-3.5 text-primary" aria-label="completed" />;
  if (status === "current") return <ArrowIcon className="h-3.5 w-3.5 text-foreground" aria-label="current" />;
  return <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="locked" />;
};

const Row = ({
  status,
  label,
  credits,
}: {
  status: "done" | "current" | "locked";
  label: string;
  credits: number;
}) => (
  <li className="flex items-center justify-between px-5 py-3 text-sm">
    <span className="flex items-center gap-2.5 text-foreground">
      <StatusIcon status={status} />
      {label}
    </span>
    <span className="font-semibold text-muted-foreground">+{credits}</span>
  </li>
);

const Unlocks = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const currentDay = state.challenge?.currentDay ?? 1;
  const completed = !!state.challenge?.completed;
  const referralCount = state.network?.direct ?? 0;
  const totalCredits = state.credits?.total ?? 0;

  const nextReward = getNextReward(totalCredits);
  const remaining = nextReward ? Math.max(0, nextReward.credits - totalCredits) : 0;
  const prevThreshold = nextReward
    ? [...creditRewards].reverse().find((r) => r.credits <= totalCredits)?.credits ?? 0
    : 0;
  const progressPct = nextReward
    ? Math.min(100, Math.round(((totalCredits - prevThreshold) / (nextReward.credits - prevThreshold)) * 100))
    : 100;
  const invitesNeeded = Math.max(1, Math.ceil(remaining / 50));

  const dayStatus = (day: number): "done" | "current" | "locked" => {
    if (completed || currentDay > day) return "done";
    if (currentDay === day) return "current";
    return "locked";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Unlock Faster</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inviting people gets you there quickest.
          </p>
        </div>

        {/* Next Reward block */}
        {nextReward && (
          <Card className="mb-6 border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Next Reward
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {nextReward.title}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {remaining} points to go
                </span>
              </div>

              <div className="mt-4">
                <Progress value={progressPct} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {totalCredits} / {nextReward.credits} points
                </div>
              </div>

              <p className="mt-4 text-sm text-foreground">
                Invite people to unlock this faster
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Most users reach this by inviting {invitesNeeded === 1 ? "1" : `${invitesNeeded}–${invitesNeeded + 1}`} {invitesNeeded === 1 ? "person" : "people"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Primary action */}
        <Card className="mb-8 border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">
                    Invite someone who joins
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-primary">+50 points</p>
                </div>
              </div>
              <Button
                size="lg"
                className="gap-2 sm:shrink-0"
                onClick={() => navigate("/referrals")}
              >
                Invite people
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ways to Earn Points */}
        <div>
          <h2 className="text-lg font-bold text-foreground">Ways to Earn Points</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete actions to build your points balance.
          </p>

          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            From Progress
          </p>
          <div className="rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {dayRewards.map((r) => (
                <Row
                  key={r.day}
                  status={dayStatus(r.day)}
                  label={r.label}
                  credits={r.credits}
                />
              ))}
            </ul>
          </div>

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            From Invites
          </p>
          <div className="rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              <Row
                status={referralCount > 0 ? "done" : "current"}
                label="Invite someone who joins"
                credits={50}
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unlocks;
