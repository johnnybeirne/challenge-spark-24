import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig, type LadderRung } from "@/context/SiteConfigContext";
import { getPointTier } from "@/lib/points";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/SEO";
import { Sparkles, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LadderInviteBlock } from "@/components/LadderInviteBlock";

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
  const { rungs, fullSuitePrice, fullSuitePriceId } = config.rewards.ladder;

  const ordered = useMemo(() => sortRungs(rungs), [rungs]);
  const totalRetail = useMemo(
    () => ordered.reduce((sum, r) => sum + (r.buyPrice || 0), 0),
    [ordered],
  );

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
    <div className="flex h-[100svh] flex-col bg-gradient-to-b from-background to-muted/40">
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
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <LadderInviteBlock />
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
                      {reached ? "Unlocked" : `Earn free at ${rung.points} pts`}
                    </p>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {reached ? "Yours." : `${away} more to go`}
                    </p>
                  </div>

                  {/* BUY */}
                  <div className="rounded-lg border bg-background/60 p-3">
                    <p className="text-sm font-semibold">Or buy it now</p>
                    {rung.buyPrice > 0 ? (
                      <>
                        <Button
                          size="sm"
                          className="mt-2 h-9 w-full bg-primary text-sm font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white disabled:text-white"
                          onClick={() => handleBuy(rung.priceId)}
                          disabled={reached}
                        >
                          {reached ? "Already unlocked" : `Buy $${rung.buyPrice}`}
                        </Button>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Skip the wait — get it instantly.
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
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

      {/* Sticky full-suite footer */}
      <footer className="border-t bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Can't wait?</p>
            <p className="text-xs text-muted-foreground">
              Every reward unlocked instantly.{" "}
              {totalRetail > 0 && <span className="line-through">${totalRetail} value</span>}{" "}
              <span className="font-semibold text-foreground">${fullSuitePrice}</span>
            </p>
          </div>
          <Button
            size="lg"
            className="font-bold text-white transition-transform duration-150 hover:scale-105 hover:brightness-90 hover:text-white"
            onClick={() => handleBuy(fullSuitePriceId)}
          >
            Buy everything — ${fullSuitePrice}
          </Button>
        </div>
      </footer>

      {checkoutElement}
    </div>
  );
}
