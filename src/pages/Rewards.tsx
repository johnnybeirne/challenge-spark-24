import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Lock, ExternalLink, Users, Crown, Sparkles,
} from "lucide-react";
import Spinner from "@/components/Spinner";

interface PartnerAsset {
  id: string;
  contribution_title: string;
  contribution_description: string;
  estimated_value: number;
  contribution_url: string;
  user_id: string;
  partner_name?: string;
}

/** Unlock tiers: direct referrals required → how many assets unlocked */
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

function getNextTier(directReferrals: number) {
  return UNLOCK_TIERS.find((t) => directReferrals < t.referrals) || null;
}

const Rewards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useAppState();
  const [assets, setAssets] = useState<PartnerAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const directReferrals = state.network.direct;
  const unlockedCount = getUnlockedCount(directReferrals);
  const nextTier = getNextTier(directReferrals);

  useEffect(() => {
    trackEvent("reward_accessed");
  }, []);

  useEffect(() => {
    (async () => {
      // Fetch approved partner contributions
      const { data: contribs } = await (supabase.from("partner_contributions") as any)
        .select("id, contribution_title, contribution_description, estimated_value, contribution_url, user_id")
        .eq("status", "approved")
        .order("estimated_value", { ascending: false });

      if (!contribs?.length) {
        setAssets([]);
        setLoading(false);
        return;
      }

      // Get partner names
      const userIds = [...new Set(contribs.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds as string[]);

      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.name]));

      setAssets(
        contribs.map((c: any) => ({
          ...c,
          partner_name: nameMap.get(c.user_id) || "Builder",
        }))
      );
      setLoading(false);
    })();
  }, []);

  const handleAccess = (asset: PartnerAsset) => {
    trackEvent("reward_accessed", { asset_id: asset.id, title: asset.contribution_title });
    trackEvent("partner_asset_clicked", { asset_id: asset.id, partner_user_id: asset.user_id });
    navigate(`/reward/${asset.id}`);
  };

  const totalUnlockedValue = assets
    .slice(0, unlockedCount)
    .reduce((sum, a) => sum + a.estimated_value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Your unlocked rewards</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Access high-value resources from builders in the network.
          </p>
        </div>

        {/* Summary card */}
        {assets.length > 0 && (
          <Card className="border-primary/20 bg-primary/5 mb-6">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-primary">${totalUnlockedValue}</p>
              <p className="text-xs text-muted-foreground">
                in unlocked rewards · {Math.min(unlockedCount, assets.length)} of {assets.length} assets
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next tier nudge */}
        {nextTier && assets.length > unlockedCount && (
          <Card className="border-border mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Invite {nextTier.referrals - directReferrals} more builder{nextTier.referrals - directReferrals !== 1 ? "s" : ""} to unlock more
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextTier.assets === Infinity ? "All" : nextTier.assets} rewards unlock at {nextTier.referrals} referrals
                </p>
              </div>
              <Button size="sm" variant="default" onClick={() => navigate("/referrals")}>
                Invite
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {assets.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-1">No rewards available yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Partner rewards will appear here as builders contribute assets to the network.
              </p>
              <Button variant="outline" onClick={() => navigate("/partners")}>
                Become a partner
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Asset list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map((asset, index) => {
            const isUnlocked = index < unlockedCount;
            const neededReferrals = UNLOCK_TIERS.find(
              (t) => t.assets > index && directReferrals < t.referrals
            );

            return (
              <Card
                key={asset.id}
                className={`border-border transition-all ${
                  isUnlocked ? "bg-card" : "bg-muted/40 opacity-70"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`shrink-0 rounded-full p-2.5 ${
                        isUnlocked
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUnlocked ? (
                        <Gift className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {asset.contribution_title}
                        </p>
                        <Badge className="bg-primary/10 text-primary text-[10px] shrink-0">
                          ${asset.estimated_value}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {asset.contribution_description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Crown className="h-3 w-3" />
                        <span>Provided by {asset.partner_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-3 pl-11">
                    {isUnlocked ? (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => handleAccess(asset)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Access reward
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate("/referrals")}
                      >
                        <Users className="h-3 w-3" />
                        {neededReferrals
                          ? `Invite ${neededReferrals.referrals - directReferrals} more to unlock`
                          : "Invite builders to unlock"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
