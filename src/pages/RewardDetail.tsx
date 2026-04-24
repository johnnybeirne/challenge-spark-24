import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Lock, ExternalLink, Shield, Users, Crown,
  Sparkles, ArrowLeft, AlertTriangle,
} from "lucide-react";
import Spinner from "@/components/Spinner";

/* Unlock tiers — mirrors Rewards page */
const UNLOCK_TIERS = [
  { referrals: 0, assets: 1 },
  { referrals: 3, assets: 3 },
  { referrals: 5, assets: 5 },
  { referrals: 10, assets: Infinity },
];

function getUnlockedCount(directReferrals: number): number {
  let count = 0;
  for (const tier of UNLOCK_TIERS) {
    if (directReferrals >= tier.referrals) count = tier.assets;
  }
  return count;
}

interface AssetData {
  id: string;
  contribution_title: string;
  contribution_description: string;
  estimated_value: number;
  contribution_url: string;
  user_id: string;
}

const RewardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useAppState();
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [partnerName, setPartnerName] = useState("Builder");
  const [assetIndex, setAssetIndex] = useState<number>(-1);
  const [unlockCount, setUnlockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const directReferrals = state.network.direct;
  const unlockedSlots = getUnlockedCount(directReferrals);

  useEffect(() => {
    trackEvent("reward_accessed", { asset_id: id });
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }

      // Fetch all approved assets to determine index
      const { data: allAssets } = await (supabase.from("partner_contributions") as any)
        .select("id, contribution_title, contribution_description, estimated_value, contribution_url, user_id")
        .eq("status", "approved")
        .order("estimated_value", { ascending: false });

      if (!allAssets?.length) { setLoading(false); return; }

      const idx = allAssets.findIndex((a: any) => a.id === id);
      if (idx === -1) { setLoading(false); return; }

      setAsset(allAssets[idx]);
      setAssetIndex(idx);

      // Simulated unlock count
      setUnlockCount(Math.max(1, Math.floor(Math.random() * 20 + 5)));

      // Get partner name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", allAssets[idx].user_id)
        .single();
      if (profile?.name) setPartnerName(profile.name);

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  }

  // Asset not found
  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Reward not available</h1>
        <p className="text-sm text-muted-foreground mb-4">This resource may have been removed or is no longer active.</p>
        <Button onClick={() => navigate("/dashboard")}>Return to dashboard</Button>
      </div>
    );
  }

  const isUnlocked = assetIndex < unlockedSlots;

  // Locked state
  if (!isUnlocked) {
    const nextTier = UNLOCK_TIERS.find((t) => t.assets > assetIndex && directReferrals < t.referrals);
    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-8 pb-24">
          <Button variant="ghost" size="sm" className="mb-4 gap-1 text-xs" onClick={() => navigate("/rewards")}>
            <ArrowLeft className="h-3 w-3" /> Back to rewards
          </Button>
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-bold text-foreground mb-2">This reward is locked</h1>
              <p className="text-sm text-muted-foreground mb-1">{asset.contribution_title}</p>
              <Badge className="bg-primary/10 text-primary text-xs mb-4">${asset.estimated_value}+ value</Badge>
              <p className="text-sm text-muted-foreground mb-6">
                Invite more builders or complete the challenge to unlock this resource.
                {nextTier && (
                  <span className="block mt-1 font-medium text-foreground">
                    {nextTier.referrals - directReferrals} more referral{nextTier.referrals - directReferrals !== 1 ? "s" : ""} needed
                  </span>
                )}
              </p>
              <Button onClick={() => navigate("/referrals")} className="gap-2">
                <Users className="h-4 w-4" /> Go to referrals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAccess = () => {
    setLeaving(true);
    trackEvent("partner_asset_clicked", { asset_id: asset.id, partner_user_id: asset.user_id });
    setTimeout(() => {
      window.open(asset.contribution_url, "_blank", "noopener,noreferrer");
      setLeaving(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        {/* Back nav */}
        <Button variant="ghost" size="sm" className="mb-4 gap-1 text-xs" onClick={() => navigate("/rewards")}>
          <ArrowLeft className="h-3 w-3" /> Back to rewards
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unlocked Reward</h1>
          <p className="text-sm text-muted-foreground mt-1">You've earned access to a high-value resource</p>
        </div>

        {/* Asset card */}
        <Card className="border-primary/20 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary/10 text-primary text-xs">${asset.estimated_value}+ value</Badge>
              <Badge className="bg-green-500/10 text-green-600 text-xs gap-1">
                <Shield className="h-3 w-3" /> Verified Partner
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{asset.contribution_title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{asset.contribution_description}</p>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Crown className="h-3 w-3" />
              <span>Provided by a verified Leadio partner</span>
            </div>
          </CardContent>
        </Card>

        {/* Value reinforcement */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Why this matters</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This resource was contributed by a builder inside the network to help you move faster.
              Every partner asset is reviewed for quality before it enters the system.
            </p>
          </CardContent>
        </Card>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
          <Users className="h-3 w-3" />
          <span>Unlocked by {unlockCount} builders</span>
        </div>

        {/* Primary CTA */}
        {leaving ? (
          <Card className="border-border mb-6">
            <CardContent className="p-5 text-center">
              <ExternalLink className="h-6 w-6 text-primary mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium text-foreground">You are leaving Leadio</p>
              <p className="text-xs text-muted-foreground mt-1">Opening resource in a new tab…</p>
            </CardContent>
          </Card>
        ) : (
          <Button className="w-full gap-2 min-h-[48px] mb-3" onClick={handleAccess}>
            <ExternalLink className="h-4 w-4" /> Access resource
          </Button>
        )}

        {/* About this builder */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">About this builder</h3>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {partnerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{partnerName}</p>
                <p className="text-xs text-muted-foreground">Leadio Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary: back to rewards */}
        <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/rewards")}>
          <Gift className="h-4 w-4" /> View all rewards
        </Button>
      </div>
    </div>
  );
};

export default RewardDetail;
