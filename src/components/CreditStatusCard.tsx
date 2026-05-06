import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { creditRules, creditTiers, getCreditTier, getNextReward, getNextTier, getTierProgress } from "@/lib/credits";

const GROWTH_MIN = creditTiers.find((t) => t.name === "Growth Partner")!.min;
const FEATURED_MIN = creditTiers.find((t) => t.name === "Featured Creator")!.min;

const GrowthToFeaturedBar = ({ credits, compact }: { credits: number; compact?: boolean }) => {
  const navigate = useNavigate();
  const span = Math.max(1, FEATURED_MIN - GROWTH_MIN);
  const pct = Math.min(100, Math.max(0, ((credits - GROWTH_MIN) / span) * 100));
  const goFeatured = () => navigate("/featured-creator");

  return (
    <div className={compact ? "mb-3" : "mb-5"}>
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>Growth Partner</span>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={goFeatured}
                className="inline-flex items-center gap-1 rounded-md text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Featured Creator
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-[240px] text-left">
              <p className="text-xs font-bold">Featured Creator</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Unlock premium visibility, promotion, and priority placement in the network.
              </p>
              <button
                type="button"
                onClick={goFeatured}
                className="mt-2 text-[11px] font-semibold text-primary hover:underline"
              >
                Learn more →
              </button>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/40 via-primary/70 to-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow transition-all duration-700"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
};

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
        <GrowthToFeaturedBar credits={credits} compact={compact} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={compact ? "text-[11px] font-black uppercase text-primary" : "text-xs font-black uppercase text-primary"}>Points</p>
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