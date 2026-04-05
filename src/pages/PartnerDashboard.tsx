import { useAppState, getPartnerTier } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Users, BarChart3, Crown, Share2, Copy, CheckCircle, Gift,
} from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";

const TIER_CONFIG = {
  bronze: { label: "Bronze", next: "Silver", target: 25, color: "text-amber-600" },
  silver: { label: "Silver", next: "Gold", target: 50, color: "text-gray-400" },
  gold: { label: "Gold", next: null, target: 50, color: "text-yellow-500" },
} as const;

const PARTNER_MILESTONES = [
  { conversions: 10, name: "Partner Growth Kit", value: 197, id: "partner_10_kit" },
  { conversions: 25, name: "Partner Accelerator Pack", value: 397, id: "partner_25_accel" },
  { conversions: 50, name: "Elite Partner System", value: 997, id: "partner_50_elite" },
];

const PartnerDashboard = () => {
  const { state } = useAppState();
  const { partner } = state;

  const tier = getPartnerTier(partner.conversions);
  const tierInfo = TIER_CONFIG[tier];
  const conversionRate = partner.assessmentStarts > 0
    ? Math.round((partner.conversions / partner.assessmentStarts) * 100)
    : 0;

  const progressToNext = tierInfo.next
    ? Math.min(100, (partner.conversions / tierInfo.target) * 100)
    : 100;

  const partnerLink = `${window.location.origin}/assess?ref=${partner.partnerCode}`;

  const handleShare = () => {
    shareOrCopy(
      "I'm helping builders launch in 3 days — take the free assessment",
      partnerLink
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partnerLink);
      toast.success("Partner link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const unlockedIds = new Set(state.unlocks.map((u) => u.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Partner Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Drive builders into the challenge and earn premium rewards.
          </p>
        </div>

        {/* Tier badge */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className={`h-5 w-5 ${tierInfo.color}`} />
                <span className="font-semibold text-foreground">{tierInfo.label} Partner</span>
              </div>
              <Badge className="bg-primary/10 text-primary text-xs">
                {partner.conversions} conversion{partner.conversions !== 1 ? "s" : ""}
              </Badge>
            </div>
            {tierInfo.next && (
              <>
                <Progress value={progressToNext} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {tierInfo.target - partner.conversions} more to reach {tierInfo.next}
                </p>
              </>
            )}
            {!tierInfo.next && (
              <p className="text-xs text-muted-foreground">
                You've reached the highest tier. Keep growing your network!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Users, label: "Conversions", value: partner.conversions },
            { icon: BarChart3, label: "Assessment starts", value: partner.assessmentStarts },
            { icon: TrendingUp, label: "Conversion rate", value: `${conversionRate}%` },
            { icon: Crown, label: "Current tier", value: tierInfo.label },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4 text-center">
                <Icon className="h-4 w-4 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partner link */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Your partner link</h3>
            <div className="bg-muted/50 rounded-lg p-3 mb-3 break-all">
              <p className="text-xs text-muted-foreground font-mono">{partnerLink}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 min-h-[44px]" onClick={handleCopy}>
                <Copy className="h-3 w-3" /> Copy link
              </Button>
              <Button size="sm" className="flex-1 gap-1 min-h-[44px]" onClick={handleShare}>
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reward milestones */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Partner rewards</h3>
            </div>
            <div className="space-y-3">
              {PARTNER_MILESTONES.map((m) => {
                const unlocked = unlockedIds.has(m.id);
                const progress = Math.min(100, (partner.conversions / m.conversions) * 100);
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={`text-sm ${unlocked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {m.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">${m.value}</span>
                    </div>
                    <div className="ml-6">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {partner.conversions}/{m.conversions} conversions
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Partner since */}
        {partner.partnerSince && (
          <p className="text-xs text-muted-foreground text-center">
            Partner since {new Date(partner.partnerSince).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;
