import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { creditRules, getCreditTier, getNextReward, getNextTier, getTierProgress } from "@/lib/credits";

interface CreditStatusCardProps {
  credits: number;
  compact?: boolean;
}

const CreditStatusCard = ({ credits, compact = false }: CreditStatusCardProps) => {
  const navigate = useNavigate();
  const tier = getCreditTier(credits);
  const nextTier = getNextTier(credits);
  const nextReward = getNextReward(credits);
  const progress = getTierProgress(credits);
  const creditsToNextTier = nextTier ? nextTier.min - credits : 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={compact ? "text-[11px] font-black uppercase text-primary" : "text-xs font-black uppercase text-primary"}>Unlock Credits</p>
            <div className={compact ? "mt-2 flex items-end gap-2" : "mt-2 flex items-end gap-3"}>
              <span className={compact ? "text-3xl font-black leading-none text-foreground transition-all duration-700" : "text-4xl font-black leading-none text-foreground transition-all duration-700"}>{credits}</span>
              <span className={compact ? "mb-0.5 rounded-full border border-primary/30 bg-background px-2.5 py-0.5 text-xs font-bold text-primary shadow-[0_0_18px_hsl(var(--primary)/0.12)]" : "mb-1 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-bold text-primary shadow-[0_0_18px_hsl(var(--primary)/0.12)]"}>
                {tier.name}
              </span>
            </div>
            {compact && <p className="mt-3 text-sm font-medium text-muted-foreground">Next: {nextTier ? `${nextTier.min} credits` : "Top status"}</p>}
          </div>
          <div className={compact ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"}>
            <Sparkles className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </div>
        </div>

        {!compact && <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{tier.name}</span>
            <span>{nextTier ? nextTier.name : "Top status"}</span>
          </div>
          <Progress value={progress} className="h-2 transition-all duration-700" />
          <p className="mt-3 text-sm text-muted-foreground">
            {nextTier ? `You’re ${creditsToNextTier} credits away from ${nextTier.name} status.` : "You’ve reached Strategic Partner status."}
          </p>
        </div>}

        {!compact && <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Next unlock</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {nextReward ? `${nextReward.credits} Credits — ${nextReward.title}` : "All Phase 1 unlocks are available"}
          </p>
        </div>}

        {!compact && (
          <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {creditRules.slice(0, 4).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                <span>{rule.label}</span>
                <span className="font-bold text-primary">+{rule.credits}</span>
              </div>
            ))}
          </div>
        )}

        {!compact && <Button className="mt-5 w-full gap-2" onClick={() => navigate("/referrals")}>
          Invite to earn credits
          <ArrowRight className="h-4 w-4" />
        </Button>}
      </CardContent>
    </Card>
  );
};

export default CreditStatusCard;