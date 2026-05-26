import { useState, useEffect, useCallback } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Lock, CheckCircle, Star, TrendingUp, Users, Share2, Rocket,
  Crown, Heart, Globe, Copy, Award, Zap, ArrowRight, Shield,
  UserPlus, Eye, Handshake
} from "lucide-react";
import { toast } from "sonner";

// ─── Mock Data ───────────────────────────────────────────────

const FEATURED_BUILDERS = [
  { name: "Sarah Chen", app: "FitTracker Pro", desc: "AI-powered fitness tracking for busy professionals", status: "Featured" as const, score: 142 },
  { name: "Alex Rivera", app: "InvoiceFlow", desc: "Simple invoicing for freelancers", status: "Launched" as const, score: 118 },
  { name: "Maria Santos", app: "LearnLoop", desc: "Micro-learning platform for teams", status: "Launched" as const, score: 95 },
  { name: "James Park", app: "GreenPlate", desc: "Sustainable meal planning app", status: "Building" as const, score: 78 },
  { name: "Tara Nguyen", app: "PodCast AI", desc: "AI summaries for podcast episodes", status: "Featured" as const, score: 134 },
];




function generateLeaderboard(userScore: number, userName: string) {
  const entries = [
    { name: "Sarah C.", stat: "42 boosts given", score: 186, badge: "Top supporter" },
    { name: "Tara N.", stat: "28 direct referrals", score: 172, badge: "Network builder" },
    { name: "Alex R.", stat: "Active this week", score: 148, badge: "Rising builder" },
    { name: "Maria S.", stat: "Launched 2 days ago", score: 132, badge: "Launched this week" },
    { name: "James P.", stat: "15 boosts given", score: 98, badge: "Rising builder" },
    { name: "Owen L.", stat: "12 referrals", score: 87, badge: "Network builder" },
    { name: "Priya K.", stat: "Featured build", score: 76, badge: "Featured" },
  ];
  const userEntry = { name: userName || "You", stat: "Your score", score: userScore, badge: "You", isUser: true };
  const all = [...entries, { ...userEntry }].sort((a, b) => b.score - a.score);
  return all.map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── Locked State ────────────────────────────────────────────

const LockedCommunity = () => {
  const { state } = useAppState();
  const navigate = useNavigate();

  const day3Done = state.challenge.completed || state.challenge.currentDay > 3;
  const hasUrl = !!state.challenge.launchUrl;
  const hasPromotion = state.network.direct >= 3;

  const getCtaAction = () => {
    if (!day3Done) return { label: "Finish the challenge", path: "/challenge/day-3" };
    if (!hasUrl) return { label: "Submit your live challenge", path: "/challenge/day-3" };
    return { label: "Unlock Builder Circle", path: "/referrals" };
  };

  const cta = getCtaAction();

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Builder Circle</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A private promotion network for builders who have launched something real.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">You're almost in</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've done the hard part — you built something.
              Now complete one promotion step to unlock a network where other builders help your challenge get seen too.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3 mb-6">
          {[
            { icon: Star, title: "Get your challenge featured", desc: "Submitted builds can be highlighted inside the Circle." },
            { icon: TrendingUp, title: "Climb the builder leaderboard", desc: "The more you support the ecosystem, the more visibility you earn." },
            { icon: Heart, title: "Get support from real builders", desc: "This is a network of people launching, sharing, and helping each other grow." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="shrink-0 rounded-full bg-primary/10 p-2 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Unlock requirements</h3>
            <div className="space-y-3">
              {[
                { done: day3Done, label: "Day 3 completed" },
                { done: hasUrl, label: "Live URL submitted" },
                { done: hasPromotion, label: "Shared once or invited 3 builders" },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={() => navigate(cta.path)}>
          {cta.label}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// ─── Unlocked State ──────────────────────────────────────────

const UnlockedCommunity = () => {
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const { promoter, becomePromoter } = usePromoter();
  const [boostedBuilders, setBoostedBuilders] = useState<Set<string>>(new Set());

  const direct = state.network.direct;
  const indirect = state.network.indirect;
  const score =
    direct * 3 +
    indirect * 1 +
    state.community.boostsGiven * 2 +
    state.community.boostsReceived * 4;

  const boostBuilder = useCallback((name: string) => {
    if (boostedBuilders.has(name)) return;
    setBoostedBuilders((prev) => new Set(prev).add(name));
    setState((prev) => {
      const newBoosts = prev.community.boostsGiven + 1;
      const newScore =
        prev.network.direct * 3 +
        prev.network.indirect * 1 +
        newBoosts * 2 +
        prev.community.boostsReceived * 4;
      return {
        ...prev,
        community: {
          ...prev.community,
          boostsGiven: newBoosts,
          leaderboardScore: newScore,
        },
      };
    });
    toast.success("You supported a builder — your visibility increased.");
  }, [boostedBuilders, setState]);

  const copyLink = async () => {
    const link = state.user?.submittedUrl || state.challenge.launchUrl || window.location.origin;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const leaderboard = generateLeaderboard(score, state.user?.name || "You");
  const appUrl = state.user?.submittedUrl || state.challenge.launchUrl;

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "Featured": return "bg-primary/10 text-primary";
      case "Launched": return "bg-green-500/10 text-green-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        {/* 1. Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Builder Circle</h1>
          </div>
          <p className="text-sm text-muted-foreground">Builders who promote each other's work.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            This is not a social feed. It's a promotion network designed to help serious builders get seen.
          </p>
        </div>

        {/* 2. Value Banner */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground text-sm mb-1">Support builders. Get support back.</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Circle rewards contribution. When you help other builders gain visibility, your own challenge becomes more visible too.
            </p>
          </CardContent>
        </Card>

        {/* 3. My Build Card */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            {appUrl ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">Your build</h3>
                  <Badge className={`text-xs ${
                    state.community.featuredStatus === "featured"
                      ? "bg-primary/10 text-primary"
                      : state.community.featuredStatus === "eligible"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {state.community.featuredStatus === "featured"
                      ? "Featured"
                      : state.community.featuredStatus === "eligible"
                      ? "Eligible for feature"
                      : "Needs more support activity"}
                  </Badge>
                </div>
                <p className="text-xs text-primary truncate mb-3">{appUrl}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Score", value: score },
                    { label: "Direct referrals", value: direct },
                    { label: "Indirect referrals", value: indirect },
                    { label: "Boosts given", value: state.community.boostsGiven },
                    { label: "Boosts received", value: state.community.boostsReceived },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={copyLink}>
                    <Copy className="h-3 w-3" /> Copy my link
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => navigate("/referrals")}>
                    <Share2 className="h-3 w-3" /> Share again
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-foreground text-sm mb-1">Submit your challenge</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  To get visibility inside Builder Circle, add your live challenge URL.
                </p>
                <Button size="sm" onClick={() => navigate("/day/3")} className="gap-1">
                  <Globe className="h-3 w-3" /> Add live URL
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. Featured Builds */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Featured builders</h3>
          <div className="space-y-2">
            {FEATURED_BUILDERS.map((b) => (
              <Card key={b.name} className="border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {b.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">{b.name}</p>
                      <Badge className={`text-xs ${statusBadgeColor(b.status)}`}>{b.status}</Badge>
                    </div>
                    <p className="text-xs text-primary truncate">{b.app}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={boostedBuilders.has(b.name) ? "secondary" : "outline"}
                    className="shrink-0 text-xs min-h-[44px]"
                    onClick={() => boostBuilder(b.name)}
                    disabled={boostedBuilders.has(b.name)}
                  >
                    {boostedBuilders.has(b.name) ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Supported</>
                    ) : (
                      <><Heart className="h-3 w-3 mr-1" /> Support</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 5. Leaderboard */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">This week's builder leaderboard</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Visibility here is earned through support, momentum, and network growth.
          </p>
          <Tabs
            defaultValue="supportive"
            onValueChange={(v) =>
              setState((prev) => ({
                ...prev,
                community: { ...prev.community, leaderboardTab: v as any },
              }))
            }
          >
            <TabsList className="w-full grid grid-cols-4 mb-3">
              <TabsTrigger value="supportive" className="text-xs px-1">Most supportive</TabsTrigger>
              <TabsTrigger value="network" className="text-xs px-1">Network</TabsTrigger>
              <TabsTrigger value="active" className="text-xs px-1">Most active</TabsTrigger>
              <TabsTrigger value="launched" className="text-xs px-1">Launched</TabsTrigger>
            </TabsList>
            {["supportive", "network", "active", "launched"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <Card className="border-border">
                  <CardContent className="p-0">
                    {leaderboard.map((entry: any, i: number) => (
                      <div
                        key={entry.name}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          i < leaderboard.length - 1 ? "border-b border-border" : ""
                        } ${entry.isUser ? "bg-primary/5" : ""}`}
                      >
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                          {entry.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                          {entry.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                            {entry.name} {entry.isUser && "(You)"}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.stat}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{entry.score}</p>
                          <Badge className="text-xs bg-muted text-muted-foreground">{entry.badge}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* 6. Support Action */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Support another builder</h3>
            {(() => {
              const rec = FEATURED_BUILDERS[Math.floor(Date.now() / 86400000) % FEATURED_BUILDERS.length];
              const supported = boostedBuilders.has(rec.name);
              return (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {rec.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{rec.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.app} — {rec.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={supported ? "secondary" : "default"}
                    className="shrink-0 min-h-[44px] text-xs"
                    disabled={supported}
                    onClick={() => boostBuilder(rec.name)}
                  >
                    {supported ? <><CheckCircle className="h-3 w-3 mr-1" /> Supported</> : <><Heart className="h-3 w-3 mr-1" /> Support</>}
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Recommended builder (rotating slot) */}
        <div className="mb-6">
          <CrossPromoSpotlight
            title="Recommended builder"
            subtitle=""
            position="community"
          />
        </div>

        {/* 7. Activity Feed */}
        <div className="mb-6">
          <ActivityFeed limit={5} refresh title="Builder activity" />
        </div>

        {/* 8. Your Impact */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Your impact</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              You invited <strong className="text-primary">{direct}</strong> builder{direct !== 1 ? "s" : ""}.
              They invited <strong className="text-primary">{indirect}</strong> more.
            </p>
            <p className="text-sm text-foreground mt-1">
              You've helped grow the ecosystem by <strong className="text-primary">{direct + indirect}</strong> builder{direct + indirect !== 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              This is what network-based growth looks like when builders help builders.
            </p>
          </CardContent>
        </Card>

        {/* 9. Benefits Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Star, title: "Featured challenge slots", desc: "High-contribution builders can be highlighted inside the Circle." },
            { icon: Award, title: "Builder shoutouts", desc: "Top supporters get recognized across the network." },
            { icon: Eye, title: "Network visibility", desc: "Your build gains exposure as your contribution grows." },
            { icon: Heart, title: "Support exchange", desc: "Give support, receive support — a growth loop." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border">
              <CardContent className="p-4">
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Become a Partner CTA */}
        {!promoter && (
          <Card className="border-primary/20 bg-primary/5 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Handshake className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Become a JV Partner</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Drive volume into the challenge ecosystem with a dedicated partner code, analytics dashboard, and premium reward tiers worth up to $997.
              </p>
              <Button
                className="w-full min-h-[44px] gap-1"
                onClick={async () => {
                  const result = await becomePromoter();
                  if (result) {
                    navigate("/partner");
                    toast.success("Welcome, Partner! Your JV dashboard is ready.");
                  } else {
                    toast.error("Failed to activate partner account");
                  }
                }}
              >
                <Handshake className="h-4 w-4" /> Activate Partner Account
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 10. Bottom CTA */}
        <Card className="border-border">
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-foreground text-sm mb-1">
              The more you support, the more your build gets seen.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Builder Circle rewards contribution, not noise.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1 gap-1" onClick={copyLink}>
                <Share2 className="h-4 w-4" /> Share my challenge
              </Button>
              <Button variant="outline" className="flex-1 gap-1" onClick={() => navigate("/referrals")}>
                <UserPlus className="h-4 w-4" /> Invite a builder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────

const Community = () => {
  const { state, setState } = useAppState();

  const day3Done = state.challenge.completed || state.challenge.currentDay > 3;
  const hasUrl = !!state.challenge.launchUrl;
  const hasPromotion = state.network.direct >= 3;
  const shouldUnlock = day3Done && hasUrl && hasPromotion && !state.community.unlocked;

  useEffect(() => {
    if (shouldUnlock) {
      const reason = state.network.direct >= 3 ? "invited_3" : "launched_and_promoted";

      setState((prev) => ({
        ...prev,
        community: {
          ...prev.community,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          entryReason: reason,
          featuredStatus: "eligible",
        },
        unlocks: [
          ...prev.unlocks,
          {
            id: "builder_circle",
            name: "Builder Circle access",
            value: 197,
            reason: "Launched and promoted challenge",
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      toast.success("Builder Circle unlocked — your challenge can now earn visibility.");
    }
  }, [shouldUnlock, setState, state.network.direct, state.challenge.launchUrl]);

  if (!state.community.unlocked && !shouldUnlock) {
    return <LockedCommunity />;
  }

  return <UnlockedCommunity />;
};

export default Community;
