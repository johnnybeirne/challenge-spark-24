import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Users, TrendingUp, Crown, Award, Star } from "lucide-react";
import Spinner from "@/components/Spinner";

interface LeaderboardEntry {
  name: string;
  invite_code: string;
  direct_referral_count: number;
  indirect_referral_count: number;
  score: number;
  isUser?: boolean;
}

const Leaderboard = () => {
  const { state, authUser } = useAppState();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [promoterEntries, setPromoterEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("participants");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Load participant leaderboard from profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("name, invite_code, direct_referral_count, indirect_referral_count, user_id")
        .order("direct_referral_count", { ascending: false })
        .limit(50);

      if (profiles) {
        const mapped: LeaderboardEntry[] = profiles.map(p => ({
          name: p.name || "Builder",
          invite_code: p.invite_code,
          direct_referral_count: p.direct_referral_count,
          indirect_referral_count: p.indirect_referral_count,
          score: p.direct_referral_count * 3 + p.indirect_referral_count,
          isUser: p.user_id === authUser?.id,
        }));
        mapped.sort((a, b) => b.score - a.score);
        setEntries(mapped);
      }

      // Load promoter leaderboard
      const { data: promoters } = await (supabase.from("promoters") as any)
        .select("partner_code, tier, conversions, assessment_starts, is_founding_partner, user_id")
        .eq("is_approved", true)
        .order("conversions", { ascending: false })
        .limit(50);

      if (promoters) {
        // Get names from profiles
        const userIds = promoters.map((p: any) => p.user_id);
        const { data: proProfiles } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", userIds);

        const nameMap = new Map((proProfiles || []).map(p => [p.user_id, p.name]));

        setPromoterEntries(promoters.map((p: any) => ({
          ...p,
          name: nameMap.get(p.user_id) || "Partner",
          isUser: p.user_id === authUser?.id,
        })));
      }
    } catch {}
    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: "text-yellow-500", label: "1st" };
    if (rank === 2) return { icon: Award, color: "text-gray-400", label: "2nd" };
    if (rank === 3) return { icon: Star, color: "text-amber-600", label: "3rd" };
    return null;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Invite friends to unlock rewards, climb the leaderboard, and earn from your network.
        </p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="participants" className="text-xs gap-1">
              <Users className="h-3 w-3" /> Participants
            </TabsTrigger>
            <TabsTrigger value="promoters" className="text-xs gap-1">
              <Crown className="h-3 w-3" /> Promoters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <Card>
              <CardContent className="p-0">
                {entries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                )}
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  const badge = getRankBadge(rank);
                  return (
                    <div
                      key={entry.invite_code}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < entries.length - 1 ? "border-b border-border" : ""
                      } ${entry.isUser ? "bg-primary/5" : ""}`}
                    >
                      <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                        {badge ? (
                          <badge.icon className={`h-4 w-4 ${badge.color} inline`} />
                        ) : rank}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {(entry.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                          {entry.name} {entry.isUser && "(You)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.direct_referral_count} direct · {entry.indirect_referral_count} indirect
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{entry.score}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promoters">
            <Card>
              <CardContent className="p-0">
                {promoterEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No promoters yet</p>
                )}
                {promoterEntries.map((entry: any, i: number) => {
                  const rank = i + 1;
                  const badge = getRankBadge(rank);
                  const tierColor = {
                    bronze: "text-amber-600",
                    silver: "text-gray-400",
                    gold: "text-yellow-500",
                    elite: "text-purple-500",
                  }[entry.tier] || "text-muted-foreground";

                  return (
                    <div
                      key={entry.partner_code}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < promoterEntries.length - 1 ? "border-b border-border" : ""
                      } ${entry.isUser ? "bg-primary/5" : ""}`}
                    >
                      <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                        {badge ? (
                          <badge.icon className={`h-4 w-4 ${badge.color} inline`} />
                        ) : rank}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {(entry.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                            {entry.name} {entry.isUser && "(You)"}
                          </p>
                          {entry.is_founding_partner && (
                            <Badge className="text-xs bg-primary/10 text-primary">Founding</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Crown className={`h-3 w-3 ${tierColor}`} />
                          <p className="text-xs text-muted-foreground capitalize">{entry.tier}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{entry.conversions}</p>
                        <p className="text-xs text-muted-foreground">conversions</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
