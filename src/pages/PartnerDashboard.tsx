import { useEffect } from "react";
import { usePromoter } from "@/hooks/usePromoter";
import { useBadges } from "@/hooks/useBadges";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Users, BarChart3, Crown, Share2, Copy, CheckCircle, Gift, Star, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/Spinner";

const TIER_CONFIG = {
  bronze: { label: "Bronze", next: "Silver", target: 10, color: "text-amber-600" },
  silver: { label: "Silver", next: "Gold", target: 25, color: "text-gray-400" },
  gold: { label: "Gold", next: "Elite", target: 50, color: "text-yellow-500" },
  elite: { label: "Elite", next: null, target: 50, color: "text-purple-500" },
} as const;

const PARTNER_MILESTONES = [
  { conversions: 10, name: "Partner Growth Kit", value: 197, id: "partner_10_kit" },
  { conversions: 25, name: "Partner Accelerator Pack", value: 397, id: "partner_25_accel" },
  { conversions: 50, name: "Elite Partner System", value: 997, id: "partner_50_elite" },
];

const PartnerDashboard = () => {
  const { state } = useAppState();
  const { promoter, loading } = usePromoter();
  const { badges } = useBadges();
  const navigate = useNavigate();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  if (!promoter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Crown className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Not a partner yet</h1>
        <p className="text-sm text-muted-foreground mb-4">Become a partner from the Builder Circle page.</p>
        <Button onClick={() => navigate("/community")}>Go to Community</Button>
      </div>
    );
  }

  const tier = promoter.tier as keyof typeof TIER_CONFIG;
  const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const conversionRate = promoter.assessment_starts > 0
    ? Math.round((promoter.conversions / promoter.assessment_starts) * 100)
    : 0;

  const progressToNext = tierInfo.next
    ? Math.min(100, (promoter.conversions / tierInfo.target) * 100)
    : 100;

  const partnerLink = `${window.location.origin}/assess?ref=${promoter.partner_code}`;

  const handleShare = () => {
    shareOrCopy({
      text: "I'm helping builders launch in 3 days — take the free assessment",
      url: partnerLink,
    });
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Partner Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Drive builders into the challenge and earn premium rewards.
          </p>
        </div>

        {/* Tier + Founding badge */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className={`h-5 w-5 ${tierInfo.color}`} />
                <span className="font-semibold text-foreground">{tierInfo.label} Partner</span>
                {promoter.is_founding_partner && (
                  <Badge className="bg-primary/10 text-primary text-[9px]">Founding Partner</Badge>
                )}
              </div>
              <Badge className="bg-primary/10 text-primary text-xs">
                {promoter.conversions} conversion{promoter.conversions !== 1 ? "s" : ""}
              </Badge>
            </div>
            {!promoter.is_approved && (
              <p className="text-xs text-amber-600 mb-2">⏳ Pending admin approval</p>
            )}
            {tierInfo.next ? (
              <>
                <Progress value={progressToNext} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {tierInfo.target - promoter.conversions} more to reach {tierInfo.next}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                You've reached the highest tier. Keep growing your network!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Users, label: "Conversions", value: promoter.conversions },
            { icon: BarChart3, label: "Assessment starts", value: promoter.assessment_starts },
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

        {/* Leaderboard link */}
        <Button variant="outline" className="w-full mb-6 gap-2" onClick={() => navigate("/leaderboard")}>
          <Trophy className="h-4 w-4" /> View Leaderboard
        </Button>

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
                const progress = Math.min(100, (promoter.conversions / m.conversions) * 100);
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
                        {promoter.conversions}/{m.conversions} conversions
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        {badges.length > 0 && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Your badges</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <Badge key={b.badge_id} className="bg-primary/10 text-primary text-xs gap-1">
                    {b.badge_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {promoter.created_at && (
          <p className="text-xs text-muted-foreground text-center">
            Partner since {new Date(promoter.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;
