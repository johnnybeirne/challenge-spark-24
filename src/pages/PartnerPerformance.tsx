import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePromoter } from "@/hooks/usePromoter";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Eye, MousePointerClick, Percent, Unlock, ExternalLink,
  Copy, Share2, Crown, BarChart3, TrendingUp, Shield,
  Lightbulb, AlertCircle, Rocket, Info, ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";

import { calculateLeaderboardScore, getVisibility } from "@/lib/scoring";

/* ─── Metric card ─── */
function MetricCard({ icon: Icon, label, value, tooltip }: {
  icon: React.ElementType; label: string; value: string | number; tooltip: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ─── Simple sparkline bar chart ─── */
function SparkBars({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      <div className="flex items-end gap-[2px] h-12">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-primary/60 rounded-t-sm transition-all hover:bg-primary"
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
        <span>30d ago</span><span>Today</span>
      </div>
    </div>
  );
}

const PartnerPerformance = () => {
  const navigate = useNavigate();
  const { promoter, loading } = usePromoter();
  const { state } = useAppState();
  const [asset, setAsset] = useState<any>(null);
  const [assetLoading, setAssetLoading] = useState(true);

  useEffect(() => { trackEvent("partner_performance_viewed"); }, []);

  // Fetch partner's approved contribution
  useEffect(() => {
    if (!promoter) return;
    (async () => {
      const { data } = await (supabase.from("partner_contributions") as any)
        .select("*")
        .eq("user_id", promoter.user_id)
        .eq("status", "approved")
        .limit(1)
        .single();
      setAsset(data || null);
      setAssetLoading(false);
    })();
  }, [promoter]);

  if (loading || assetLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  }

  // Access guard: must be approved promoter with approved asset
  if (!promoter || !promoter.is_approved || !asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Partner Performance</h1>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          This dashboard is available for approved partners with an active asset in the network.
        </p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  // Metrics from promoter record + simulated 30-day trend
  const impressions = promoter.assessment_starts || 0;
  const clicks = promoter.conversions || 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0";
  const unlocks = Math.min(clicks, Math.floor(clicks * 0.6)); // estimated
  const accesses = Math.floor(unlocks * 0.7); // estimated

  // Simulated 30-day sparkline (distributed from total)
  const makeTrend = (total: number) => {
    const arr = Array.from({ length: 30 }, () => 0);
    for (let i = 0; i < total; i++) arr[Math.floor(Math.random() * 30)]++;
    return arr;
  };
  const impressionTrend = makeTrend(impressions);
  const clickTrend = makeTrend(clicks);
  const unlockTrend = makeTrend(unlocks);

  const leaderboardScore = calculateLeaderboardScore(state);
  const visibility = getVisibility(leaderboardScore);

  const partnerLink = `${window.location.origin}/assess?ref=${promoter.partner_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partnerLink);
      toast.success("Partner link copied!");
    } catch { toast.error("Failed to copy"); }
  };

  const handleShare = () => {
    shareOrCopy({ text: "Join ChallengeOS — build and launch in 3 days", url: partnerLink });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Partner Performance</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            See how your asset and profile are performing inside the ChallengeOS network.
          </p>
          <Badge className="mt-2 bg-primary/10 text-primary text-xs">
            Approved asset: {asset.contribution_title}
          </Badge>
        </div>

        {/* ─── TOP METRICS ─── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricCard icon={Eye} label="Impressions" value={impressions} tooltip="How often your partner card or asset was shown to users" />
          <MetricCard icon={MousePointerClick} label="Clicks" value={clicks} tooltip="How often users clicked through to learn more" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MetricCard icon={Percent} label="CTR" value={`${ctr}%`} tooltip="Engagement rate: clicks ÷ impressions" />
          <MetricCard icon={Unlock} label="Unlocks" value={unlocks} tooltip="How many users qualified to access your asset" />
          <MetricCard icon={ExternalLink} label="Accesses" value={accesses} tooltip="How many users opened your asset page or link" />
        </div>

        {/* ─── PERFORMANCE TREND ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Performance over time</h3>
            </div>
            <div className="space-y-5">
              <SparkBars data={impressionTrend} label="Impressions" />
              <SparkBars data={clickTrend} label="Clicks" />
              <SparkBars data={unlockTrend} label="Unlocks" />
            </div>
          </CardContent>
        </Card>

        {/* ─── YOUR ASSET ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your asset</h3>
            </div>
            <p className="font-medium text-foreground text-sm">{asset.contribution_title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{asset.contribution_description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary/10 text-primary text-[10px]">${asset.estimated_value}+ value</Badge>
              <Badge className="bg-green-500/10 text-green-600 text-[10px]">Approved</Badge>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="gap-1 text-xs" onClick={() => {
                trackEvent("partner_asset_opened" as any, { asset_id: asset.id });
                window.open(asset.contribution_url, "_blank", "noopener,noreferrer");
              }}>
                <ExternalLink className="h-3 w-3" /> Open asset link
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => navigate("/rewards")}>
                View reward page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── VISIBILITY STATUS ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your visibility inside the network</h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${visibility.bg} ${visibility.color}`}>{visibility.label}</Badge>
              {promoter.is_founding_partner && (
                <Badge className="text-[10px] bg-primary/10 text-primary gap-1"><Shield className="h-3 w-3" /> Founding</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{visibility.desc}</p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              The more you contribute and the better your asset performs, the more visibility you earn.
            </p>
          </CardContent>
        </Card>

        {/* ─── UNLOCK SOURCES ─── */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">How users unlocked your asset</h3>
            <div className="space-y-2">
              {[
                { label: "Referral milestones", count: Math.floor(unlocks * 0.5), icon: "👥" },
                { label: "Challenge completion", count: Math.floor(unlocks * 0.3), icon: "🏆" },
                { label: "Builder Circle reward", count: Math.floor(unlocks * 0.15), icon: "⭐" },
                { label: "Admin assignment", count: Math.floor(unlocks * 0.05), icon: "🔑" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.icon}</span> {s.label}
                  </div>
                  <span className="text-sm font-medium text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── PARTNER STATUS ─── */}
        <Card className={`mb-6 ${promoter.is_eligible_for_promotion ? "border-border" : "border-destructive/30"}`}>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Partner status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eligible for promotion</span>
                <Badge className={promoter.is_eligible_for_promotion ? "bg-green-500/10 text-green-600 text-[10px]" : "bg-destructive/10 text-destructive text-[10px]"}>
                  {promoter.is_eligible_for_promotion ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset approved</span>
                <Badge className="bg-green-500/10 text-green-600 text-[10px]">Yes</Badge>
              </div>
              {promoter.is_founding_partner && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founding partner</span>
                  <Badge className="bg-primary/10 text-primary text-[10px]">#{promoter.founding_rank}</Badge>
                </div>
              )}
            </div>
            {!promoter.is_eligible_for_promotion && (
              <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Not active in cross-promotion</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Contact admin or update your asset to restore visibility.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── ACTIONS ─── */}
        <div className="grid gap-3 mb-6">
          <Button className="w-full gap-2 min-h-[48px]" onClick={handleCopy}>
            <Copy className="h-4 w-4" /> Copy my partner link
          </Button>
          <Button variant="outline" className="w-full gap-2 min-h-[48px]" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share ChallengeOS
          </Button>
          <Button variant="outline" className="w-full gap-2 min-h-[48px]" onClick={() => navigate("/partner")}>
            <Crown className="h-4 w-4" /> View promoter dashboard
          </Button>
        </div>

        {/* ─── IMPROVE VISIBILITY ─── */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">How to increase your visibility</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                "Invite more qualified builders to join the challenge",
                "Increase support activity inside Builder Circle",
                "Share your referral link consistently across channels",
                "Improve your asset clarity and positioning",
                "Stay active in the network to maintain momentum",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Rocket className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-xs gap-1"
              onClick={() => trackEvent("partner_visibility_help_viewed" as any)}
            >
              Got it <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* ─── EMPTY STATE (if no meaningful data yet) ─── */}
        {impressions === 0 && clicks === 0 && (
          <Card className="border-border">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-base font-semibold text-foreground mb-1">You're live — now let's build momentum</h2>
              <p className="text-xs text-muted-foreground mb-3">
                As your challenge and asset are shown across the network, your performance data will appear here.
              </p>
              <Button size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="h-3 w-3" /> Share ChallengeOS
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartnerPerformance;
