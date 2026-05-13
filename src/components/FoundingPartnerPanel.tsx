import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Crown } from "lucide-react";
import { useFoundingConfig } from "@/hooks/useFoundingConfig";
import type { PromoterRecord } from "@/hooks/usePromoter";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface FoundingPartnerPanelProps {
  promoter: PromoterRecord | null;
}

const FoundingPartnerPanel = ({ promoter }: FoundingPartnerPanelProps) => {
  const { slotsRemaining, loading } = useFoundingConfig();
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent("promoter_cta_clicked", { cta: "founder_viewed" });
  }, []);

  if (loading) return null;

  // Founding partner view
  if (promoter?.is_founding_partner) {
    return (
      <Card className="border-primary/30 bg-primary/5 mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Founding Partner</h3>
            <Badge className="bg-primary/10 text-primary text-xs ml-auto">
              #{promoter.founding_rank}
            </Badge>
          </div>
          <p className="text-xs text-foreground leading-relaxed mb-2">
            You joined early and secured priority visibility within the network.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Visibility is based on active contribution and alignment with platform standards.
          </p>
          {!promoter.is_eligible_for_promotion && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠ Your cross-promotion visibility is currently paused. Continue contributing to restore it.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Non-founder promoter view
  if (promoter) {
    return (
      <Card className="border-border mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Founding Partner</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Early partners receive priority visibility inside the network.
          </p>
          {slotsRemaining > 0 ? (
            <>
              <p className="text-base font-black text-foreground mb-3">
                Only <span className="text-primary text-xl">{slotsRemaining}</span> remaining
              </p>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  trackEvent("promoter_cta_clicked", { cta: "become_founder" });
                  navigate("/community");
                }}
              >
                Become a founding partner
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              All founding partner spots have been claimed.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default FoundingPartnerPanel;
