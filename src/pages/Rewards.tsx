import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getPointTier, pointTiers } from "@/lib/points";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { ChevronRight, Sparkles, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tierColor: Record<string, string> = {
  Starter: "bg-slate-200 text-slate-700",
  Builder: "bg-sky-200 text-sky-800",
  "Growth Partner": "bg-emerald-200 text-emerald-800",
  "Featured Creator": "bg-violet-200 text-violet-800",
  "Strategic Partner": "bg-rose-200 text-rose-800",
};

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
      <main className="flex-1 overflow-y-auto px-6 py-3">
        <div className="mx-auto max-w-5xl space-y-1.5">
          {sortedRungs.map((rung) => {
            const reached = userPoints >= rung.points;
            const isCurrentRung =
              rung.points <= userPoints &&
              !sortedRungs.some((r) => r.points <= userPoints && r.points > rung.points);
            const tier = tierForPoints(rung.points);
            const isGold = rung.doubleUnlock;
            const isDest = rung.isDestination;

            return (
              <div
                key={rung.points}
                className={cn(
                  "relative grid grid-cols-[80px_1fr_auto] items-center gap-4 rounded-xl border px-4 py-2.5 transition-all",
                  reached ? "opacity-100" : "opacity-70",
                  isGold && "border-amber-400/60 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30",
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
                    "flex h-10 w-12 items-center justify-center rounded-lg text-sm font-bold",
                    reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    isGold && reached && "bg-amber-500 text-white",
                    isDest && "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
                  )}>
                    {rung.points}
                  </div>
                </div>

                {/* Reward + tier */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {reached ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <p className={cn("truncate text-sm font-semibold", isDest && "text-base")}>
                      {rung.name}
                    </p>
                    {isGold && (
                      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
                        Double
                      </span>
                    )}
                    {isDest && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                        Destination
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", tierColor[tier.name])}>
                      {tier.name}
                    </span>
                    {rung.retailValue > 0 && (
                      <span className="ml-2">Retail ${rung.retailValue}</span>
                    )}
                  </p>
                </div>

                {/* Buy button */}
                <div className="flex shrink-0 items-center gap-3">
                  {rung.buyPrice > 0 && !isDest ? (
                    <Button
                      size="sm"
                      variant={isGold ? "default" : "outline"}
                      className={cn(
                        "h-8 text-xs font-semibold",
                        isGold && "bg-amber-500 text-white hover:bg-amber-600",
                      )}
                      onClick={() => handleBuy(rung.priceId)}
                    >
                      Buy ${rung.buyPrice}
                    </Button>
                  ) : isDest ? (
                    <span className="text-xs font-bold text-primary">★ Top reward</span>
                  ) : null}
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
