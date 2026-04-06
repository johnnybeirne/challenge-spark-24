import { useCrossPromo } from "@/hooks/useCrossPromo";
import CrossPromoCard from "@/components/CrossPromoCard";
import { Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useRef } from "react";

interface CrossPromoSpotlightProps {
  title?: string;
  subtitle?: string;
  position?: string;
}

/**
 * Single-slot cross-promo placement with header/subtext.
 * Tracks position for analytics.
 */
const CrossPromoSpotlight = ({
  title = "Builder spotlight",
  subtitle = "See what other builders are launching inside the network",
  position = "unknown",
}: CrossPromoSpotlightProps) => {
  const { promos, loading, trackImpression, trackClick } = useCrossPromo(1);
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && promos.length > 0) {
      tracked.current = true;
      trackEvent("crosspromo_impression", { position, promo_id: promos[0].id });
    }
  }, [promos, position]);

  if (loading || promos.length === 0) return null;

  const handleImpression = (id: string) => {
    trackImpression(id);
  };

  const handleClick = (id: string) => {
    trackClick(id);
    trackEvent("crosspromo_click", { position, promo_id: id });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground -mt-1">{subtitle}</p>
      )}
      <CrossPromoCard
        promo={promos[0]}
        onImpression={handleImpression}
        onClick={handleClick}
      />
    </div>
  );
};

export default CrossPromoSpotlight;
