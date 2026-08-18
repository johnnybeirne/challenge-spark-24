import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig, type LadderRung } from "@/context/SiteConfigContext";
import { getPointTier, pointRules } from "@/lib/points";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/SEO";
import { Sparkles, Lock, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { LadderInviteBlock } from "@/components/LadderInviteBlock";
import InvitesRewardsHeader from "@/components/InvitesRewardsHeader";

/** Ladder order is driven by one shared `position` field, sorted ascending. */
export function sortRungs(rungs: LadderRung[]): LadderRung[] {
  return rungs
    .map((r, i) => ({ ...r, position: typeof r.position === "number" ? r.position : i + 1 }))
    .sort((a, b) => a.position - b.position);
}

export default function Rewards() {
  const { state } = useAppState();
  const { config } = useSiteConfig();
  const { openCheckout, checkoutElement } = useStripeCheckout();

  const userPoints = state.points?.total ?? 0;
  const userTier = getPointTier(userPoints);
  const { rungs } = config.rewards.ladder;

  const ordered = useMemo(() => sortRungs(rungs), [rungs]);

  const pointsPerDay =
    pointRules.find((rule) => rule.id === "complete_day_1")?.points ?? 50;

  const handleBuy = (priceId: string) => {
    openCheckout({
      priceId,
      quantity: 1,
      customerEmail: state.user?.email,
      userId: state.user?.id || "",
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-background to-muted/40">
      <SEO
        title="Rewards Ladder"
        description="Earn rewards with points, or buy any reward outright."
      />

      {/* Header */}
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">Rewards Ladder</h1>
            <p className="text-xs text-muted-foreground">
              Two ways to get every reward: climb by earning points (invite friends +
              complete challenge days), or buy any reward outright.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg bg-primary/10 px-3 py-1.5">
              <span className="font-bold text-primary">{userPoints}</span>
              <span className="text-muted-foreground"> pts</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{userTier.name}</span>
          </div>
        </div>
      </header>

      {/* Ladder */}
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <InvitesRewardsHeader tierLabel={userTier.name} subtitle="Earn points by inviting people and completing each challenge day." />
          <LadderInviteBlock />
          <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Two ways to climb: share your invite link, and complete each
              challenge day — you earn{" "}
              <span className="font-semibold text-foreground">
                {pointsPerDay} points
              </span>{" "}
              for every day you finish.
            </p>
          </div>
          {ordered.map((rung) => {
            const reached = userPoints >= rung.points;
            const away = Math.max(0, rung.points - userPoints);
            const pct = Math.min(100, Math.round((userPoints / Math.max(rung.points, 1)) * 100));
            const isGold = rung.doubleUnlock;

            return (
              <div
                key={rung.priceId || rung.position}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isGold
                    ? "border-amber-400/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/40 dark:from-amber-950/30 dark:to-yellow-950/20"
                    : "bg-card",
                  reached && "ring-1 ring-emerald-500/40",
                )}
              >
                {/* Reward name + value */}
                <div className="flex flex-wrap items-center gap-2">
                  {reached ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <p className="text-base font-bold tracking-tight">{rung.name}</p>
                  {isGold && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      <Sparkles className="mr-0.5 inline h-2 w-2" />
                      2×
                    </span>
                  )}
                </div>

                {/* Two paths, equal weight */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {/* EARN */}
                  <div className="rounded-lg border bg-background/60 p-3">
                    <p className="text-sm font-semibold">
                      {reached ? "Unlocked" : `Access at ${rung.points} pts`}
                    </p>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {reached ? "Yours." : `${away} more to go`}
                    </p>
                  </div>

                  {/* BUY */}
                  <div className="rounded-lg border bg-background/60 p-3">
                    {rung.buyPrice > 0 ? (
                      <>
                        <Button
                          size="sm"
                          className="h-9 w-full bg-primary text-sm font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white disabled:text-white"
                          onClick={() => handleBuy(rung.priceId)}
                          disabled={reached}
                        >
                          {reached ? "Already unlocked" : `Buy it now — $${rung.buyPrice}`}
                        </Button>
                        <p className="mt-1.5 text-center text-xs text-muted-foreground">
                          Skip the wait — get it instantly.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Earn-only reward — not available to buy.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <LadderInviteBlock className="mt-3" />
        </div>
      </main>

      {checkoutElement}
    </div>
  );
}
