import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus")?.trim().toLowerCase() || "";
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!loading && focus && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, focus, entries.length]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Participant leaderboard — sourced from waitlist_signups (canonical referral activity).
      const { data: signups } = await supabase
        .from("waitlist_signups")
        .select("name, first_name, surname, referral_code, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(50);

      if (signups) {
        const userCode = state.user?.inviteCode;
        const mapped: LeaderboardEntry[] = signups.map((s: any) => {
          const lastInitial = (last: string) => `${last.charAt(0).toUpperCase()}.`;
          let display: string;
          if (s.first_name && s.surname && s.first_name !== s.surname) {
            display = `${s.first_name} ${lastInitial(s.surname)}`;
          } else if (s.name) {
            const parts = String(s.name).trim().split(/\s+/);
            display = parts.length >= 2 ? `${parts[0]} ${lastInitial(parts[parts.length - 1])}` : parts[0];
          } else {
            display = s.first_name || "Builder";
          }
          const direct = s.confirmed_invites ?? 0;
          return {
            name: display,
            invite_code: s.referral_code,
            direct_referral_count: direct,
            indirect_referral_count: 0,
            score: direct,
            isUser: !!userCode && s.referral_code === userCode,
          };
        });
        setEntries(mapped);
      }


      // Load partner leaderboard from canonical view (attributed signups + manual adjustment)
      const { data: rows } = await supabase.rpc("get_partner_leaderboard", { p_limit: 50 });

      if (rows && rows.length > 0) {
        const partnerIds = rows.map((r: any) => r.partner_id);
        // Resolve user_id + founding badge per partner
        const [{ data: partnerMeta }, { data: founders }] = await Promise.all([
          supabase.from("partners").select("id, user_id").in("id", partnerIds),
          supabase.from("promoters").select("user_id, is_founding_partner").eq("is_founding_partner", true),
        ]);
        const userByPartner = new Map((partnerMeta || []).map((p: any) => [p.id, p.user_id]));
        const foundingSet = new Set((founders || []).map((f: any) => f.user_id));

        const userIds = Array.from(userByPartner.values()).filter(Boolean) as string[];
        const { data: proProfiles } = userIds.length
          ? await supabase.from("profiles").select("user_id, name").in("user_id", userIds)
          : { data: [] as any[] };
        const nameMap = new Map((proProfiles || []).map((p: any) => [p.user_id, p.name]));

        setPromoterEntries(rows.map((r: any) => {
          const userId = userByPartner.get(r.partner_id) as string | undefined;
          return {
            partner_code: r.slug,
            name: r.display_name || (userId && nameMap.get(userId)) || `/${r.slug}`,
            avatar_url: r.avatar_url,
            signups: r.signups,
            score: r.total_score,
            is_founding_partner: userId ? foundingSet.has(userId) : false,
            isUser: userId ? userId === authUser?.id : false,
          };
        }));
      } else {
        setPromoterEntries([]);
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
                  const isFocus = !!focus && (entry.name || "").toLowerCase().includes(focus);
                  return (
                    <div
                      key={entry.invite_code}
                      ref={isFocus && !focusRef.current ? focusRef : undefined}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < entries.length - 1 ? "border-b border-border" : ""
                      } ${entry.isUser ? "bg-primary/5" : ""} ${isFocus ? "ring-2 ring-primary rounded-md bg-primary/10" : ""}`}
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
                          {entry.direct_referral_count} invite{entry.direct_referral_count === 1 ? "" : "s"}
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
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (entry.name || "?").slice(0, 2).toUpperCase()
                        )}
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
                        <p className="text-xs text-muted-foreground">
                          {entry.signups} attributed signup{entry.signups !== 1 ? "s" : ""}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
