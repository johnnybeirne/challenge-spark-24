import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartner } from "@/hooks/usePartner";
import { usePromoter } from "@/hooks/usePromoter";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import FoundingPartnerPanel from "@/components/FoundingPartnerPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown, Users, TrendingUp, Globe, Copy, Share2, Eye,
  Gift, Trophy, Rocket, Shield, Zap, ArrowRight, BarChart3,
  Wallet, GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import Spinner from "@/components/Spinner";
import { calculateLeaderboardScore, getVisibility } from "@/lib/scoring";

interface LeaderEntry {
  name: string;
  score: number;
  badge: string;
  isUser?: boolean;
}

const REWARD_MILESTONES = [
  { at: 10, name: "Partner Growth Kit", value: 197 },
  { at: 25, name: "Partner Accelerator Pack", value: 397 },
  { at: 50, name: "AI-powered challenge app", value: 5000 },
];

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const PartnerDashboard = () => {
  const { state } = useAppState();
  const { partner, loading, shareLink, attributions, subAttributions, subPartners, totals, refresh } = usePartner();
  const { promoter } = usePromoter();
  const navigate = useNavigate();
  const [topPartners, setTopPartners] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    trackEvent("promoter_dashboard_viewed");
  }, []);

  // Top 5 leaderboard preview from partners view (still uses promoters table for now — Phase 7 rewrites)
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

          setTopPartners(
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

  if (!partner) {
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

  const { direct, indirect, network, pendingCommissionsCents, approvedCommissionsCents, paidCommissionsCents } = totals;

  const leaderboardScore = calculateLeaderboardScore(state);
  const visibility = getVisibility(leaderboardScore);

  const nextMilestone = REWARD_MILESTONES.find((m) => direct < m.at);
  const progressToNext = nextMilestone ? Math.min(100, (direct / nextMilestone.at) * 100) : 100;

  const handleCopy = async () => {
    if (!shareLink) {
      toast.error("Your partner slug is missing. Contact admin.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Partner link copied!");
      trackEvent("promoter_link_copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = () => {
    if (!shareLink) return;
    shareOrCopy({
      text: "I'm helping builders launch in 3 days — take the free assessment",
      url: shareLink,
    });
    trackEvent("promoter_shared");
  };

  const hasAnyData = direct > 0 || indirect > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Partner Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {partner.display_name || "You're"} growing your audience through the challenge network.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="bg-muted text-muted-foreground text-xs">/{partner.slug}</Badge>
            {partner.status !== "active" && (
              <Badge className="bg-amber-500/10 text-amber-600 text-xs">{partner.status}</Badge>
            )}
            {promoter?.is_founding_partner && (
              <Badge className="bg-primary/10 text-primary text-xs gap-1">
                <Shield className="h-3 w-3" /> Founding Partner
              </Badge>
            )}
          </div>
        </div>

        {/* CORE METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Direct Referrals", value: direct, sub: `${direct} builder${direct !== 1 ? "s" : ""} attributed to you` },
            { icon: TrendingUp, label: "Sub-partner Referrals", value: indirect, sub: `From your level-2 network` },
            { icon: Globe, label: "Total Network", value: network, sub: `Direct + indirect attributions` },
            { icon: Wallet, label: "Pending Commission", value: formatEur(pendingCommissionsCents), sub: `Awaiting payout` },
          ].map(({ icon: Icon, label, value, sub }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4">
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EMPTY STATE */}
        {!hasAnyData && (
          <Card className="border-primary/20 bg-primary/5 mb-6">
            <CardContent className="p-5 text-center">
              <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Share your link to start tracking</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Every signup that comes through your link will appear here in real time.
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={handleCopy} className="gap-1"><Copy className="h-3 w-3" /> Copy link</Button>
                <Button size="sm" variant="outline" onClick={handleShare} className="gap-1"><Share2 className="h-3 w-3" /> Share</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RECENT REFERRALS */}
        {attributions.length > 0 && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent referrals</h3>
              </div>
              <div className="space-y-0">
                {attributions.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{a.profile_name}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.first_touch_at)}</p>
                    </div>
                    <Badge className="text-xs bg-muted text-muted-foreground shrink-0">{a.source}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* COMMISSIONS SNAPSHOT */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Commissions</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pending", value: pendingCommissionsCents },
                { label: "Approved", value: approvedCommissionsCents },
                { label: "Paid", value: paidCommissionsCents },
              ].map((c) => (
                <div key={c.label} className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-base font-bold text-foreground">{formatEur(c.value)}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>
            {pendingCommissionsCents + approvedCommissionsCents + paidCommissionsCents === 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Commissions appear here when a referred user purchases.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SUB-PARTNERS */}
        {subPartners.length > 0 && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Your sub-partners</h3>
              </div>
              <div className="space-y-0">
                {subPartners.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{s.display_name || `/${s.slug}`}</p>
                      <p className="text-xs text-muted-foreground">{s.direct_count} direct referral{s.direct_count !== 1 ? "s" : ""}</p>
                    </div>
                    <Badge className="text-xs bg-muted text-muted-foreground shrink-0">L2</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* COMMISSION RATES */}
        {partner && (
          <CommissionRatesCard
            partner={partner}
            onSaved={refresh}
          />
        )}

        {/* VISIBILITY */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your visibility inside the network</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`text-xs ${visibility.bg} ${visibility.color}`}>{visibility.label}</Badge>
              <span className="text-xs text-muted-foreground">Score: {leaderboardScore}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The more you contribute, the more your challenge is shown to other partners' audiences.
            </p>
          </CardContent>
        </Card>

        {/* REWARDS */}
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
                            <span className="text-xs text-primary-foreground">✓</span>
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {direct}/{m.at} referrals
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

        {/* LEADERBOARD PREVIEW */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top partners this week</h3>
            </div>
            {topPartners.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No partners yet</p>
            ) : (
              <div className="space-y-0">
                {topPartners.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2.5 ${i < topPartners.length - 1 ? "border-b border-border" : ""} ${entry.isUser ? "bg-primary/5 -mx-2 px-2 rounded" : ""}`}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {(entry.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                        {entry.name} {entry.isUser && "(You)"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{entry.score}</p>
                      <Badge className="text-xs bg-muted text-muted-foreground">{entry.badge}</Badge>
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

        {/* ACTIONS */}
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

        {/* FOUNDING PARTNER PANEL (still uses promoters) */}
        {promoter && <FoundingPartnerPanel promoter={promoter} />}

        {/* PERFORMANCE NUDGE */}
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
                <Share2 className="h-3 w-3" /> Share now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

import { Input } from "@/components/ui/input";
import type { PartnerRow } from "@/hooks/usePartner";

function CommissionRatesCard({ partner, onSaved }: { partner: PartnerRow; onSaved: () => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<string>(partner.default_l2_commission_type);
  const [value, setValue] = useState<number>(Number(partner.default_l2_commission_value));
  const [saving, setSaving] = useState(false);

  const fmt = (t: string, v: number) => (t === "percent" ? `${v}%` : `€${v}`);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("partners")
      .update({ default_l2_commission_type: type as "percent" | "fixed", default_l2_commission_value: value })
      .eq("id", partner.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save", { description: error.message });
      return;
    }
    toast.success("L2 rate updated");
    setEditing(false);
    await onSaved();
  };

  return (
    <Card className="border-border mb-6">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Commission rates</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Your direct (L1)</p>
            <p className="text-base font-bold text-foreground">
              {fmt(partner.default_commission_type, Number(partner.default_commission_value))}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Per referred sale</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">From sub-partners (L2)</p>
            {editing ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="h-7 text-sm"
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-7 text-xs rounded border border-input bg-background px-1"
                >
                  <option value="percent">%</option>
                  <option value="flat">€</option>
                </select>
              </div>
            ) : (
              <p className="text-base font-bold text-foreground">{fmt(type, value)}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Per sub-partner sale</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setType(partner.default_l2_commission_type); setValue(Number(partner.default_l2_commission_value)); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit L2 rate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PartnerDashboard;
