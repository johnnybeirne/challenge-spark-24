import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getPointTier, pointTiers } from "@/lib/points";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { ChevronRight, Sparkles, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function tierForPoints(points: number) {
  return pointTiers.find(
    (t) => points >= t.min && (t.max === null || points <= t.max),
  )!;
}

export default function Rewards() {
  const { state } = useAppState();
  const { config } = useSiteConfig();
  const { openCheckout, checkoutElement } = useStripeCheckout();

  const userPoints = state.points?.total ?? 0;
  const userTier = getPointTier(userPoints);
  const { rungs, fullSuitePrice, fullSuitePriceId } = config.rewards.ladder;

  // Top-to-bottom: 1000 → 100
  const sortedRungs = useMemo(() => [...rungs].sort((a, b) => b.points - a.points), [rungs]);

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
      <SEO title="Points Rewards Ladder" description="Climb to 1000 points and unlock the full reward suite." />

      {/* Header */}
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Rewards Ladder</h1>
            <p className="text-xs text-muted-foreground">
              Climb to 1000 to unlock the full suite.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg bg-primary/10 px-3 py-1.5">
              <span className="font-bold text-primary">{userPoints}</span>
              <span className="text-muted-foreground"> pts</span>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tierColor[userTier.name])}>
              {userTier.name}
            </span>
          </div>
        </div>
      </header>

      {/* Ladder */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {sortedRungs.map((rung, idx) => {
            const reached = userPoints >= rung.points;
            const isCurrentRung =
              rung.points <= userPoints &&
              !sortedRungs.some((r) => r.points <= userPoints && r.points > rung.points);
            const tier = tierForPoints(rung.points);
            const prevTier = idx > 0 ? tierForPoints(sortedRungs[idx - 1].points) : null;
            const showTierDivider = !prevTier || prevTier.name !== tier.name;
            const isGold = rung.doubleUnlock;

            return (
              <div key={rung.points}>
                {showTierDivider && (
                  <div className={cn("mb-3 mt-6 flex items-center gap-3", idx === 0 ? "" : "")}>
                    <span className="text-xs font-medium text-muted-foreground">
                      {tier.name}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div
                  className={cn(
                    "relative grid grid-cols-[64px_1fr_auto] items-center gap-5 rounded-xl border px-5 py-4 transition-all",
                    reached ? "opacity-100" : "opacity-60",
                    isGold && "border-amber-400/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/40 dark:from-amber-950/30 dark:to-yellow-950/20",
                    isDest && "border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5",
                    !isGold && !isDest && "bg-card",
                    isCurrentRung && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {/* Points marker */}
                  <div className="flex items-center gap-2">
                    {isCurrentRung && (
                      <ChevronRight className="h-4 w-4 shrink-0 animate-pulse text-primary" />
                    )}
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold",
                      reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      isGold && reached && "bg-amber-500 text-white",
                      isDest && "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
                    )}>
                      {rung.points}
                    </div>
                  </div>

                  {/* Reward name (dominant) + retail (small, muted) */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {reached ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <p className={cn("truncate text-base font-bold tracking-tight")}>
                        {rung.name}
                      </p>
                      {isGold && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          <Sparkles className="mr-0.5 inline h-2 w-2" />
                          2×
                        </span>
                      )}
                    </div>
                    {rung.retailValue > 0 && (
                      <p className="mt-0.5 pl-6 text-xs text-muted-foreground">
                        Retail ${rung.retailValue}
                      </p>
                    )}
                  </div>

                  {/* Buy button — clean, minimal */}
                  <div className="flex shrink-0 items-center">
                    {rung.buyPrice > 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 text-sm font-semibold text-foreground hover:bg-muted"
                        onClick={() => handleBuy(rung.priceId)}
                      >
                        Buy ${rung.buyPrice}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>



      {/* Sticky full-suite footer */}
      <footer className="border-t bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Buy the full suite</p>
            <p className="text-xs text-muted-foreground">
              Every reward, unlocked instantly. Lifetime access.
            </p>
          </div>
          <Button
            size="lg"
            className="font-bold"
            onClick={() => handleBuy(fullSuitePriceId)}
          >
            Buy now — ${fullSuitePrice}
          </Button>
        </div>
      </footer>

      {checkoutElement}
    </div>
  );
}
