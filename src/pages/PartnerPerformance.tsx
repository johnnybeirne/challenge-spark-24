import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartner } from "@/hooks/usePartner";
import { usePromoter } from "@/hooks/usePromoter";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Users, GitBranch, Wallet, BadgeCheck, ExternalLink,
  Copy, Share2, Crown, BarChart3, TrendingUp, Shield,
  Lightbulb, Eye, Info, ArrowRight, Sparkles, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { calculateLeaderboardScore, getVisibility } from "@/lib/scoring";

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

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
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>30d ago</span><span>Today</span>
      </div>
    </div>
  );
}

const PartnerPerformance = () => {
  const navigate = useNavigate();
  const { partner, loading, shareLink, attributions, subAttributions, totals } = usePartner();
  const { promoter } = usePromoter();
  const { state } = useAppState();
  const [asset, setAsset] = useState<any>(null);
  const [assetLoading, setAssetLoading] = useState(true);

  useEffect(() => { trackEvent("partner_performance_viewed"); }, []);

  useEffect(() => {
    if (!partner) {
      setAssetLoading(false);
      return;
    }
    (async () => {
      const { data } = await (supabase.from("partner_contributions") as any)
        .select("*")
        .eq("user_id", partner.user_id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();
      setAsset(data || null);
      setAssetLoading(false);
    })();
  }, [partner]);

  // Real 30-day referral activity from attribution timestamps
  const referralTrend = useMemo(() => {
    const buckets = Array.from({ length: 30 }, () => 0);
    const now = Date.now();
    [...attributions, ...subAttributions].forEach((a) => {
      const days = Math.floor((now - new Date(a.first_touch_at).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days < 30) buckets[29 - days]++;
    });
    return buckets;
  }, [attributions, subAttributions]);

  if (loading || assetLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Partner Performance</h1>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          This dashboard is available for active partners.
        </p>
        <Button onClick={() => navigate("/challenger-dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  const leaderboardScore = calculateLeaderboardScore(state);
  const visibility = getVisibility(leaderboardScore);

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Partner link copied!");
    } catch { toast.error("Failed to copy"); }
  };

  const handleShare = () => {
    if (!shareLink) return;
    shareOrCopy({ text: "Join the challenge — build and launch in 3 days", url: shareLink });
  };

  const noActivity = totals.network === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Partner Performance</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Real referral and commission activity from your partner network.
          </p>
          {asset && (
            <Badge className="mt-2 bg-primary/10 text-primary text-xs">
              Approved asset: {asset.contribution_title}
            </Badge>
          )}
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={Users} label="Direct referrals" value={totals.direct} tooltip="Users attributed to your slug via ?ref or partner share." />
          <MetricCard icon={GitBranch} label="Sub-partner referrals" value={totals.indirect} tooltip="Level-2 — referrals brought in by partners under you." />
          <MetricCard icon={Wallet} label="Pending commissions" value={formatEur(totals.pendingCommissionsCents)} tooltip="Awaiting approval or payout." />
          <MetricCard icon={BadgeCheck} label="Paid commissions" value={formatEur(totals.paidCommissionsCents)} tooltip="Already paid out to you." />
        </div>

        {/* REFERRAL TREND */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Referral activity (last 30 days)</h3>
            </div>
            <SparkBars data={referralTrend} label="Attributions" />
          </CardContent>
        </Card>

        {/* YOUR ASSET */}
        {asset && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Your asset</h3>
              </div>
              <p className="font-medium text-foreground text-sm">{asset.contribution_title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{asset.contribution_description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-primary/10 text-primary text-xs">${asset.estimated_value}+ value</Badge>
                <Badge className="bg-green-500/10 text-green-600 text-xs">Approved</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="gap-1 text-xs" onClick={() => {
                  trackEvent("partner_asset_opened", { asset_id: asset.id });
                  window.open(asset.contribution_url, "_blank", "noopener,noreferrer");
                }}>
                  <ExternalLink className="h-3 w-3" /> Open asset link
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => navigate("/bonus-vault")}>
                  View reward page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VISIBILITY */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your visibility inside the network</h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${visibility.bg} ${visibility.color}`}>{visibility.label}</Badge>
              {promoter?.is_founding_partner && (
                <Badge className="text-xs bg-primary/10 text-primary gap-1"><Shield className="h-3 w-3" /> Founding</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{visibility.desc}</p>
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="grid gap-3 mb-6">
          <Button className="w-full gap-2 min-h-[48px]" onClick={handleCopy}>
            <Copy className="h-4 w-4" /> Copy my partner link
          </Button>
          <Button variant="outline" className="w-full gap-2 min-h-[48px]" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share the challenge
          </Button>
          <Button variant="outline" className="w-full gap-2 min-h-[48px]" onClick={() => navigate("/partner")}>
            <Crown className="h-4 w-4" /> View partner dashboard
          </Button>
        </div>

        {/* IMPROVE VISIBILITY */}
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
            <Button size="sm" variant="outline" className="mt-3 text-xs gap-1" onClick={() => trackEvent("partner_visibility_help_viewed")}>
              Got it <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* EMPTY STATE */}
        {noActivity && (
          <Card className="border-border">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-base font-semibold text-foreground mb-1">You're live — now let's build momentum</h2>
              <p className="text-xs text-muted-foreground mb-3">
                As your link drives signups, real attribution and commission data will appear here.
              </p>
              <Button size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="h-3 w-3" /> Share the challenge
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartnerPerformance;
