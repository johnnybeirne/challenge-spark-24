import { useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const dayRewards = [
  { label: "Complete Day 1", credits: 10 },
  { label: "Complete Day 2", credits: 15 },
  { label: "Complete Day 3", credits: 25 },
];

const Unlocks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Unlock Faster</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inviting people gets you there quickest.
          </p>
        </div>

        {/* Primary action */}
        <Card className="mb-6 border-primary/30 bg-primary/5 shadow-sm">
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
                  <p className="mt-0.5 text-sm font-bold text-primary">+50 credits</p>
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

        {/* Secondary list */}
        <div className="rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {dayRewards.map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-foreground">{r.label}</span>
                <span className="font-semibold text-muted-foreground">+{r.credits}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Unlocks;
