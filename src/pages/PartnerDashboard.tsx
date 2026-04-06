import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePromoter } from "@/hooks/usePromoter";
import { useAppState } from "@/context/AppContext";
import { useBadges } from "@/hooks/useBadges";
import { supabase } from "@/integrations/supabase/client";
import CrossPromoSlots from "@/components/CrossPromoSlots";
import FoundingPartnerPanel from "@/components/FoundingPartnerPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown, Users, TrendingUp, Globe, Copy, Share2, Eye,
  Gift, Trophy, Rocket, Shield, Zap, ArrowRight, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import Spinner from "@/components/Spinner";

/* ─── Leaderboard entry type ─── */
interface LeaderEntry {
  name: string;
  score: number;
  badge: string;
  isUser?: boolean;
}

/* ─── Reward milestones ─── */
const REWARD_MILESTONES = [
  { at: 10, name: "Partner Growth Kit", value: 197 },
  { at: 25, name: "Partner Accelerator Pack", value: 397 },
  { at: 50, name: "AI-powered challenge app", value: 5000 },
];

import { calculateLeaderboardScore, getVisibility } from "@/lib/scoring";

function getVisibilityLocal(score: number) {
  return getVisibility(score);
}

const PartnerDashboard = () => {
  const { state } = useAppState();
  const { promoter, loading } = usePromoter();
  const { badges } = useBadges();
  const navigate = useNavigate();
  const [topPromoters, setTopPromoters] = useState<LeaderEntry[]>([]);

  // Track page view
  useEffect(() => {
    trackEvent("promoter_dashboard_viewed");
  }, []);

  // Load top 5 promoters for leaderboard preview
  useEffect(() => {
    (async () => {
      try {
        const { data: promoters } = await (supabase.from("promoters") as any)
          .select("partner_code, conversions, user_id, is_founding_partner")
          .eq("is_approved", true)
          .order("conversions", { ascending: false })
          .limit(5);

        if (promoters?.length) {
          const userIds = promoters.map((p: any) => p.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, name")
            .in("user_id", userIds);
          const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.name]));

          setTopPromoters(
            promoters.map((p: any) => ({
              name: nameMap.get(p.user_id) || "Partner",
              score: p.conversions,
              badge: p.is_founding_partner ? "Founding" : "Partner",
              isUser: p.user_id === state.user?.id,
            }))
          );
        }
      } catch {}
    })();
  }, [state.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Non-promoter redirect
  if (!promoter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Crown className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Not a partner yet</h1>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Become a partner from the Builder Circle page to access this dashboard.
        </p>
        <Button onClick={() => navigate("/community")}>Go to Community</Button>
      </div>
    );
  }

  const direct = promoter.conversions;
  const indirect = Math.floor(direct * 0.4); // estimated from network
  const totalNetwork = direct + indirect;
  const estimatedReach = direct * 1 + indirect * 0.5;
  const leaderboardScore =
    state.network.direct * 3 +
    state.network.indirect +
    state.community.boostsGiven * 2 +
    state.community.boostsReceived * 4 +
    direct * 5;

  const visibility = getVisibility(leaderboardScore);
  const partnerLink = `${window.location.origin}/assess?ref=${promoter.partner_code}`;

  // Next reward milestone
  const nextMilestone = REWARD_MILESTONES.find((m) => direct < m.at);
  const prevMilestone = [...REWARD_MILESTONES].reverse().find((m) => direct >= m.at);
  const progressToNext = nextMilestone
    ? Math.min(100, (direct / nextMilestone.at) * 100)
    : 100;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partnerLink);
      toast.success("Partner link copied!");
      trackEvent("promoter_link_copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = () => {
    shareOrCopy({
      text: "I'm helping builders launch in 3 days — take the free assessment",
      url: partnerLink,
    });
    trackEvent("promoter_shared");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8 pb-24">
        {/* ─── HEADER ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Promoter Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            You're growing your audience through the ChallengeOS network.
          </p>
          {promoter.is_founding_partner && (
            <Badge className="mt-2 bg-primary/10 text-primary text-xs gap-1">
              <Shield className="h-3 w-3" /> Founding Partner
            </Badge>
          )}
        </div>

        {/* ─── SECTION 1: CORE METRICS ─── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Users, label: "Direct Referrals", value: direct, sub: `You brought in ${direct} builder${direct !== 1 ? "s" : ""}` },
            { icon: TrendingUp, label: "Indirect Referrals", value: indirect, sub: `They brought in ${indirect} more` },
            { icon: Globe, label: "Total Network", value: totalNetwork, sub: `Your network size: ${totalNetwork}` },
            { icon: Zap, label: "Estimated Reach", value: Math.round(estimatedReach), sub: `Estimated audience reach` },
          ].map(({ icon: Icon, label, value, sub }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4">
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── SECTION 2: NETWORK GROWTH VISUAL ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Your network is compounding</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Direct</span>
                  <span className="text-foreground font-medium">{direct}</span>
                </div>
                <Progress value={totalNetwork > 0 ? (direct / totalNetwork) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Indirect</span>
                  <span className="text-foreground font-medium">{indirect}</span>
                </div>
                <Progress value={totalNetwork > 0 ? (indirect / totalNetwork) * 100 : 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── SECTION 3: VISIBILITY & CROSS-PROMOTION ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your visibility inside the network</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`text-xs ${visibility.bg} ${visibility.color}`}>
                {visibility.label}
              </Badge>
              <span className="text-xs text-muted-foreground">Score: {leaderboardScore}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The more you contribute, the more your challenge is shown to other partners' audiences.
            </p>
          </CardContent>
        </Card>

        {/* ─── YOUR EXPOSURE (Cross-promo stats) ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your exposure</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "Impressions", value: promoter.assessment_starts || 0 },
                { label: "Clicks", value: promoter.conversions || 0 },
                { label: "CTR", value: promoter.assessment_starts > 0 ? `${Math.round((promoter.conversions / promoter.assessment_starts) * 100)}%` : "0%" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              The more you contribute, the more your challenge is shown across the network.
            </p>
          </CardContent>
        </Card>

        {/* ─── SECTION 4: REWARDS & PROGRESSION ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your rewards</h3>
            </div>
            <div className="space-y-3">
              {REWARD_MILESTONES.map((m) => {
                const unlocked = direct >= m.at;
                const progress = Math.min(100, (direct / m.at) * 100);
                return (
                  <div key={m.at} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-[10px] text-primary-foreground">✓</span>
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={`text-sm ${unlocked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {m.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">${m.value.toLocaleString()}</span>
                    </div>
                    <div className="ml-6">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {direct}/{m.at} conversions
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {nextMilestone && (
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                You're <span className="text-foreground font-semibold">{nextMilestone.at - direct} referrals</span> away from unlocking:<br />
                <span className="text-foreground font-medium">{nextMilestone.name}</span> (${nextMilestone.value.toLocaleString()} value)
              </p>
            )}
          </CardContent>
        </Card>

        {/* ─── SECTION 5: LEADERBOARD PREVIEW ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top promoters this week</h3>
            </div>
            {topPromoters.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No promoters yet</p>
            ) : (
              <div className="space-y-0">
                {topPromoters.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2.5 ${
                      i < topPromoters.length - 1 ? "border-b border-border" : ""
                    } ${entry.isUser ? "bg-primary/5 -mx-2 px-2 rounded" : ""}`}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                      {(entry.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                        {entry.name} {entry.isUser && "(You)"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{entry.score}</p>
                      <Badge className="text-[9px] bg-muted text-muted-foreground">{entry.badge}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-1 text-xs"
              onClick={() => {
                navigate("/leaderboard");
                trackEvent("promoter_cta_clicked", { cta: "view_leaderboard" });
              }}
            >
              View full leaderboard <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* ─── SECTION 6: ACTIONS ─── */}
        <div className="grid gap-3 mb-6">
          <Button className="w-full gap-2 min-h-[48px]" onClick={handleCopy}>
            <Copy className="h-4 w-4" /> Copy my referral link
          </Button>
          <Button variant="outline" className="w-full gap-2 min-h-[48px]" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share challenge
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 min-h-[48px]"
            onClick={() => {
              navigate("/community");
              trackEvent("promoter_cta_clicked", { cta: "view_builder_circle" });
            }}
          >
            <Crown className="h-4 w-4" /> View Builder Circle
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 min-h-[48px]"
            onClick={() => navigate("/partner/performance")}
          >
            <BarChart3 className="h-4 w-4" /> View asset performance
          </Button>
        </div>

        {/* ─── SECTION 7: IMPACT ─── */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your impact</h3>
            </div>
            <div className="space-y-1 text-sm text-foreground">
              <p>You introduced <span className="font-bold">{direct}</span> builder{direct !== 1 ? "s" : ""}</p>
              <p>They introduced <span className="font-bold">{indirect}</span> more</p>
              <p>You've helped grow the network by <span className="font-bold text-primary">{totalNetwork}</span> builders</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              This is how network-driven growth compounds.
            </p>
          </CardContent>
        </Card>

        {/* ─── SECTION 8: FOUNDING PARTNER PANEL ─── */}
        <FoundingPartnerPanel promoter={promoter} />

        {/* ─── SECTION 9: PERFORMANCE NUDGE ─── */}
        {direct < 3 && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Start your network</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Invite your first 3 builders to activate your growth.
              </p>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  handleShare();
                  trackEvent("promoter_cta_clicked", { cta: "nudge_invite" });
                }}
              >
                Invite builders <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Partner since */}
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
