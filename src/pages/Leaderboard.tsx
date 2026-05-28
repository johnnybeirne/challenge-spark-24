import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Users, Crown, Award, Star, Linkedin, Facebook, Instagram, Youtube, Globe } from "lucide-react";
import Spinner from "@/components/Spinner";

interface ProfileBio {
  bio?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
}

interface LeaderboardEntry extends ProfileBio {
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
  const focusRef = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<(ProfileBio & { name: string; score: number; isUser?: boolean }) | null>(null);

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
        .select("name, first_name, surname, email, referral_code, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(50);

      if (signups) {
        // Resolve bios via profiles (email match — waitlist has no FK to profiles).
        const emails = (signups as any[]).map((s) => (s.email || "").toLowerCase()).filter(Boolean);
        const { data: profileRows } = emails.length
          ? await supabase
              .from("profiles")
              .select("email, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url")
              .in("email", emails)
          : { data: [] as any[] };
        const profileMap = new Map<string, ProfileBio>(
          (profileRows || []).map((p: any) => [String(p.email || "").toLowerCase(), p])
        );

        const userCode = state.user?.inviteCode;
        const mapped: LeaderboardEntry[] = (signups as any[]).map((s: any) => {
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
          const prof = profileMap.get(String(s.email || "").toLowerCase()) || {};
          return {
            name: display,
            invite_code: s.referral_code,
            direct_referral_count: direct,
            indirect_referral_count: 0,
            score: direct,
            isUser: !!userCode && s.referral_code === userCode,
            ...prof,
          };
        });
        // Pad to 5 with random fake builders (not on the waitlist).
        const FAKES = [
          { name: "Alex R.", bio: "Founder coaching SaaS teams on retention." },
          { name: "Priya S.", bio: "Helping creators launch their first paid offer." },
          { name: "Marcus T.", bio: "B2B sales strategist turned indie builder." },
          { name: "Niamh O.", bio: "Productising consulting for agency owners." },
          { name: "Diego F.", bio: "No-code maker shipping weekend experiments." },
          { name: "Hannah K.", bio: "Wellness brand operator and community builder." },
        ];
        const realNames = new Set(mapped.map((m) => m.name.toLowerCase()));
        const pool = FAKES.filter((f) => !realNames.has(f.name.toLowerCase()));
        const needed = Math.max(0, 5 - mapped.length);
        const padded: LeaderboardEntry[] = [...mapped];
        for (let k = 0; k < needed && k < pool.length; k++) {
          const f = pool[k];
          padded.push({
            name: f.name,
            invite_code: `fake-${k}`,
            direct_referral_count: 0,
            indirect_referral_count: 0,
            score: 0,
            bio: f.bio,
          });
        }
        setEntries(padded);
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
          ? await supabase
              .from("profiles")
              .select("user_id, name, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url")
              .in("user_id", userIds)
          : { data: [] as any[] };
        const profByUser = new Map((proProfiles || []).map((p: any) => [p.user_id, p]));

        const realPromoters = rows.map((r: any) => {
          const userId = userByPartner.get(r.partner_id) as string | undefined;
          const prof: any = userId ? profByUser.get(userId) || {} : {};
          return {
            partner_code: r.slug,
            name: r.display_name || prof.name || `/${r.slug}`,
            avatar_url: r.avatar_url || prof.avatar_url,
            bio: prof.bio,
            linkedin_url: prof.linkedin_url,
            facebook_url: prof.facebook_url,
            instagram_url: prof.instagram_url,
            youtube_url: prof.youtube_url,
            website_url: prof.website_url,
            signups: r.signups,
            score: r.total_score,
            is_founding_partner: userId ? foundingSet.has(userId) : false,
            isUser: userId ? userId === authUser?.id : false,
          };
        });
        setPromoterEntries(padPromoters(realPromoters));
      } else {
        setPromoterEntries(padPromoters([]));
      }
    } catch {}
    setLoading(false);
  };

  // Pad promoter list to 5 with fake promoters not already on the list.
  const padPromoters = (real: any[]) => {
    const FAKES = [
      { name: "Sarah L.", bio: "Performance marketer running launch campaigns." },
      { name: "Tomás B.", bio: "Community-led growth for early-stage SaaS." },
      { name: "Maya K.", bio: "Affiliate strategist for creator economy brands." },
      { name: "Owen P.", bio: "Newsletter operator and growth advisor." },
      { name: "Lena V.", bio: "Partnerships lead helping founders ship faster." },
    ];
    const realNames = new Set(real.map((r) => String(r.name || "").toLowerCase()));
    const pool = FAKES.filter((f) => !realNames.has(f.name.toLowerCase()));
    const needed = Math.max(0, 5 - real.length);
    const out = [...real];
    for (let k = 0; k < needed && k < pool.length; k++) {
      const f = pool[k];
      out.push({
        partner_code: `fake-promoter-${k}`,
        name: f.name,
        bio: f.bio,
        signups: 0,
        score: 0,
        is_founding_partner: false,
      });
    }
    return out;
  };


  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: "text-yellow-500", label: "1st" };
    if (rank === 2) return { icon: Award, color: "text-gray-400", label: "2nd" };
    if (rank === 3) return { icon: Star, color: "text-amber-600", label: "3rd" };
    return null;
  };

  const openBio = (e: ProfileBio & { name: string; score: number; isUser?: boolean }) => setSelected(e);

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
                    <button
                      type="button"
                      key={entry.invite_code}
                      ref={isFocus && !focusRef.current ? focusRef : undefined}
                      onClick={() => openBio(entry)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${
                        i < entries.length - 1 ? "border-b border-border" : ""
                      } ${entry.isUser ? "bg-primary/5" : ""} ${isFocus ? "ring-2 ring-primary rounded-md bg-primary/10" : ""}`}
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
                        <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                          {entry.name} {entry.isUser && "(You)"}
                        </p>

                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{entry.score}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </button>
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
                    <button
                      type="button"
                      key={entry.partner_code}
                      onClick={() => openBio(entry)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${
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
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0 overflow-hidden">
                    {selected.avatar_url ? (
                      <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (selected.name || "?").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-base">{selected.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{selected.score} pts</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3">
                {selected.bio ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selected.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">This builder hasn't added a bio yet.</p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {selected.linkedin_url && (
                    <a href={selected.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {selected.facebook_url && (
                    <a href={selected.facebook_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {selected.instagram_url && (
                    <a href={selected.instagram_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {selected.youtube_url && (
                    <a href={selected.youtube_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="YouTube">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                  {selected.website_url && (
                    <a href={selected.website_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Website">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
