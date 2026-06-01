import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Gift, ArrowRight } from "lucide-react";

import { useSiteConfig, type UpgradeCardPlan } from "@/context/SiteConfigContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useDeadline } from "@/hooks/useDeadline";

function PlanCard({ plan, featured }: { plan: UpgradeCardPlan; featured?: boolean }) {
  return (
    <Card
      className={
        featured
          ? "flex flex-col border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm"
          : "flex flex-col border-border"
      }
    >
      <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2 text-primary">
          {featured ? <Crown className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            {featured ? "Best value" : "Lifetime"}
          </span>
        </div>
        <h3 className="mt-3 text-base font-bold text-foreground">{plan.name}</h3>
        <p className="mt-2 text-2xl font-black text-foreground">{plan.price}</p>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{plan.description}</p>
        <Button
          asChild
          className={
            featured
              ? "mt-4 w-full"
              : "mt-4 w-full bg-orange-500 text-white hover:bg-orange-600 border-transparent"
          }
          variant={featured ? "default" : "outline"}
        >
          <Link to={plan.ctaLink}>{plan.ctaText}</Link>
        </Button>

      </CardContent>
    </Card>
  );
}

const UpgradeCards = () => {
  const { config } = useSiteConfig();
  const { heading, plan1, plan2 } = config.upgradeCards;
  const { t: tGlobal } = useSiteContent("global");
  const deadline = useDeadline();
  const urgency = deadline.render(
    tGlobal("urgency.upgrade_card", `Have this live by ${deadline.dayName} — upgrade to keep momentum.`),
  );
  return (
    <section className="mt-6">
      <p className="mb-1 text-sm font-semibold text-foreground sm:text-base">{heading}</p>
      <p className="mb-4 text-xs font-medium text-muted-foreground">{urgency}</p>

      <Link
        to="/earn"
        className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 transition hover:border-primary/50 hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Gift className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              Unlock with reward points
            </p>
            <p className="text-xs text-muted-foreground">
              Refer a friend and earn points toward lifetime access.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      </Link>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlanCard plan={plan1} />
        <PlanCard plan={plan2} featured />
      </div>
    </section>

  );
};

export default UpgradeCards;
