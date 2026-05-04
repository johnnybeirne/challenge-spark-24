import { useNavigate } from "react-router-dom";
import { CheckCircle, Lock, Sparkles } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import CreditStatusCard from "@/components/CreditStatusCard";
import { creditRewards, creditRules, getNextReward } from "@/lib/credits";

const Unlocks = () => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const credits = state.credits?.total ?? 0;
  const nextReward = getNextReward(credits);

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">Access, status, and momentum</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Unlock Credits</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Credits unlock access inside Leadio as you complete the challenge and invite the right people.
          </p>
        </div>

        <div className="mb-6">
          <CreditStatusCard credits={credits} />
        </div>

        {credits === 0 && (
          <Card className="mb-6 border-border bg-card shadow-sm">
            <CardContent className="p-5 text-sm text-muted-foreground">
              You’ll start earning credits as you complete the challenge and invite others.
            </CardContent>
          </Card>
        )}

        {nextReward && (
          <Card className="mb-6 border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Progress toward next unlock</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextReward.credits - credits} credits to {nextReward.title}. Invite 1 person to unlock this faster.
              </p>
              <Progress value={Math.min(100, (credits / nextReward.credits) * 100)} className="mt-4 h-2" />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {creditRewards.map((reward, index) => {
            const unlocked = credits >= reward.credits;
            return (
              <Card key={reward.title} className={`border-border bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${!unlocked ? "opacity-80" : ""}`} style={{ animationDelay: `${index * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {unlocked ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{reward.credits} credits</span>
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-foreground">{reward.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {unlocked ? `${reward.accessLabel} available.` : `${reward.accessLabel} at ${reward.credits} credits.`}
                  </p>
                  <Button variant={unlocked ? "default" : "outline"} className="mt-5 w-full gap-2" onClick={() => navigate(unlocked ? "/bonus-vault" : "/referrals")}>
                    {unlocked ? "View access" : "Build momentum"}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Unlocks;