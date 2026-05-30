import { useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus, Check, ArrowRight as ArrowIcon, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";
import { getNextReward, pointRewards } from "@/lib/points";

const dayRewards = [
  { day: 1, label: "Complete Day 1", points: 10 },
  { day: 2, label: "Complete Day 2", points: 15 },
  { day: 3, label: "Complete Day 3", points: 25 },
];

const StatusIcon = ({ status }: { status: "done" | "current" | "locked" }) => {
  if (status === "done") return <Check className="h-3.5 w-3.5 text-primary" aria-label="completed" />;
  if (status === "current") return <ArrowIcon className="h-3.5 w-3.5 text-foreground" aria-label="current" />;
  return <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="locked" />;
};

const Row = ({
  status,
  label,
  points,
}: {
  status: "done" | "current" | "locked";
  label: string;
  points: number;
}) => (
  <li className="flex items-center justify-between px-5 py-3 text-sm">
    <span className="flex items-center gap-2.5 text-foreground">
      <StatusIcon status={status} />
      {label}
    </span>
    <span className="font-semibold text-muted-foreground">+{points}</span>
  </li>
);

const Unlocks = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const currentDay = state.challenge?.currentDay ?? 1;
  const completed = !!state.challenge?.completed;
  const referralCount = state.network?.direct ?? 0;
  const totalPoints = state.points?.total ?? 0;

  const nextReward = getNextReward(totalPoints);
  const remaining = nextReward ? Math.max(0, nextReward.points - totalPoints) : 0;
  const prevThreshold = nextReward
    ? [...pointRewards].reverse().find((r) => r.points <= totalPoints)?.points ?? 0
    : 0;
  const progressPct = nextReward
    ? Math.min(100, Math.round(((totalPoints - prevThreshold) / (nextReward.points - prevThreshold)) * 100))
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
            Inviting people is the fastest way to earn points.
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
                  {totalPoints} / {nextReward.points} points
                </div>
              </div>

              <p className="mt-4 text-sm text-foreground">
                Invite 1 person who joins <span className="font-semibold text-primary">+50 points</span>
              </p>
            </CardContent>
          </Card>
        )}

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
                  points={r.points}
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
                points={50}
              />
            </ul>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full gap-2"
            onClick={() => navigate("/referrals")}
          >
            <UserPlus className="h-4 w-4" />
            Invite People
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unlocks;
