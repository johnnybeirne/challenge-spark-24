import { useCrossPromo } from "@/hooks/useCrossPromo";
import CrossPromoCard from "@/components/CrossPromoCard";
import { Sparkles } from "lucide-react";

interface CrossPromoSlotsProps {
  slots?: number;
  title?: string;
}

const CrossPromoSlots = ({ slots = 3, title = "Featured builders" }: CrossPromoSlotsProps) => {
  const { promos, loading, trackImpression, trackClick } = useCrossPromo(slots);

  if (loading || promos.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      {promos.map((p) => (
        <CrossPromoCard
          key={p.id}
          promo={p}
          onImpression={trackImpression}
          onClick={trackClick}
        />
      ))}
    </div>
  );
};

export default CrossPromoSlots;
