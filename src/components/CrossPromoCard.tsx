import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import type { CrossPromoEntry } from "@/hooks/useCrossPromo";

interface CrossPromoCardProps {
  promo: CrossPromoEntry;
  onImpression?: (id: string) => void;
  onClick?: (id: string) => void;
}

const CrossPromoCard = ({ promo, onImpression, onClick }: CrossPromoCardProps) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      onImpression?.(promo.id);
    }
  }, [promo.id, onImpression]);

  const handleClick = () => {
    onClick?.(promo.id);
    if (promo.url) {
      window.open(promo.url, "_blank", "noopener");
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {(promo.builder_name || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">{promo.builder_name}</p>
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
          </div>
          <p className="text-xs font-medium text-foreground">{promo.title}</p>
          {promo.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{promo.description}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-xs min-h-[36px] gap-1"
          onClick={handleClick}
        >
          View <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CrossPromoCard;
