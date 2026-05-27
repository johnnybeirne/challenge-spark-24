import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Copy,
  CheckCircle,
  Share2,
  MessageCircle,
  Mail,
  Users,
  TrendingUp,
  Gift,
  Lock,
  Trophy,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useUserRole } from "@/hooks/useUserRole";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { memoryShareText } from "@/lib/personalisation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const challengeBonuses = [
  { id: "day1_blueprint", title: "Challenge Blueprint", benefit: "Map the structure of your offer and user journey.", day: 1 },
  { id: "day2_playbook", title: "Experience Playbook", benefit: "Turn your idea into a step-by-step user experience.", day: 2 },
  { id: "day3_checklist", title: "Launch Checklist", benefit: "Ship with a cleaner message and launch plan.", day: 3 },
];

const partnerImages = ["bg-primary/10", "bg-accent/10", "bg-success/10"];

const CREDIT_REWARDS_CATALOG: Record<string, { title: string; description: string }> = {
  launch_checklist: { title: "Challenge Launch Checklist", description: "A printable checklist to make sure your launch goes live cleanly." },
  ai_prompt_pack: { title: "AI Prompt Pack", description: "Battle-tested prompts for shaping your challenge with AI." },
  referral_templates: { title: "Referral Message Templates", description: "Plug-and-play scripts for inviting people who actually join." },
};
const UNLOCKED_STORAGE_KEY = "leadio.unlockedRewards.v1";

/**
 * Earn Rewards — unified destination that replaces the separate
 * Invites (Referrals) and Rewards (Bonus Vault) pages. One page,
 * one job: help the user invite others and see what they unlock.
 */
const EarnRewards = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { permissions } = useUserRole();
  const showGamification = permissions.showChallengeGamification;

  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState<PartnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditUnlocked, setCreditUnlocked] = useState<string[]>([]);
  const [topChallengers, setTopChallengers] = useState<{ name: string; pts: number }[]>([]);

  const inviteCode = state.user?.inviteCode ?? "builder";
  const referralLink = `${window.location.origin}/assess?ref=${inviteCode}`;
  const shareText = memoryShareText(state.memory);
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "";

  const direct = state.network.direct;
  const indirect = state.network.indirect;
  const totalNetwork = direct + indirect;
  const score = direct * 3 + indirect * 1;
  const referralCredits = (state.credits?.awardedActions ?? []).filter((id) => id.startsWith("referral_join_")).length * 50;
  const pendingReferralCredits = Math.max(0, direct * 100 - referralCredits);

  const completedDay = state.challenge.completed ? 3 : Math.max(0, state.challenge.currentDay - 1);
  const unlockedChallengeBonuses = challengeBonuses.filter((b) => completedDay >= b.day).length;
  const unlockedPartnerCount = direct >= 10 ? assets.length : direct >= 5 ? 5 : direct >= 3 ? 3 : Math.min(1, assets.length);

  useEffect(() => { trackEvent("reward_accessed"); }, []);

  // Read locally unlocked credit rewards (kept for backwards-compat with Bonus Vault flow).
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY);
        setCreditUnlocked(raw ? JSON.parse(raw) : []);
      } catch { setCreditUnlocked([]); }
    };
    read();
    const onStorage = (e: StorageEvent) => { if (e.key === UNLOCKED_STORAGE_KEY) read(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", read);
    };
  }, []);

  // Approved partner contributions.
  useEffect(() => {
    (async () => {
      const { data: contribs } = await (supabase.from("partner_contributions") as any)
        .select("id, contribution_title, contribution_description, estimated_value, contribution_url, user_id")
        .eq("status", "approved")
        .order("estimated_value", { ascending: false });

      if (!contribs?.length) { setAssets([]); setLoading(false); return; }
      const userIds = [...new Set(contribs.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds as string[]);
      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.name]));
      setAssets(contribs.map((c: any) => ({ ...c, partner_name: nameMap.get(c.user_id) || "Builder" })));
      setLoading(false);
    })();
  }, []);

  // Mini leaderboard — top 3 challengers by confirmed invites.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("waitlist_signups")
        .select("name, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(3);
      if (cancelled) return;
      setTopChallengers(
        (data ?? []).map((r: { name: string | null; confirmed_invites: number | null }) => ({
          name: (r.name || "Builder").split(" ")[0],
          pts: r.confirmed_invites ?? 0,
        })),
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast("Link copied! Share it with your network.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + referralLink)}`;
    window.open(url, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Quick assessment on audience growth");
    const body = encodeURIComponent(shareText + "\n\n" + referralLink);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const creditUnlockedItems = creditUnlocked
    .map((id) => ({ id, ...CREDIT_REWARDS_CATALOG[id] }))
    .filter((r) => r.title);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  const totalUnlocked = unlockedChallengeBonuses + Math.min(unlockedPartnerCount, assets.length) + creditUnlockedItems.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        {/* Header */}
        <header className="mb-6 max-w-3xl">
          <div className="flex items-center gap-3 mb-1">
            <Gift className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Earn Rewards</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Invite builders, complete challenge days, and unlock bonuses. One link does it all.
          </p>
        </header>

        {/* Headline summary */}
        <Card className="mb-6 border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-lg font-semibold text-foreground">
              {firstName ? `${firstName}, you've` : "You've"} unlocked {totalUnlocked} bonus{totalUnlocked === 1 ? "" : "es"}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every builder you invite opens more of the vault and grows your visibility.
            </p>
          </CardContent>
        </Card>

        {/* Invite link + share — top of page, always */}
        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.5fr)] lg:items-start">
          <div>
            <Card className="border-border mb-4">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">Your invite link</p>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                  <code className="flex-1 truncate text-xs text-foreground">{referralLink}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyLink}>
                    {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-3 text-xs italic text-muted-foreground">"{shareText}"</p>
              </CardContent>
            </Card>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="w-full gap-2" onClick={() => shareOrCopy({ text: shareText, url: referralLink })}>
                <Share2 className="h-4 w-4" /> Share my link
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={copyLink}>
                <Copy className="h-4 w-4" /> Copy link
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={shareWhatsApp}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={shareEmail}>
                <Mail className="h-4 w-4" /> Email
              </Button>
            </div>
          </div>

          {/* Progress / Your impact */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Your impact</h2>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  You invited <strong className="text-primary">{direct}</strong> builder{direct !== 1 ? "s" : ""}.
                  {" "}They invited <strong className="text-primary">{indirect}</strong> more.
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Network grown by <strong className="text-primary">{totalNetwork}</strong> builder{totalNetwork !== 1 ? "s" : ""}.
                </p>
                {showGamification && (
                  <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    <p>Network score: <strong className="text-foreground">{score}</strong> <span className="opacity-60">({direct}×3 + {indirect}×1)</span></p>
                    <p className="mt-1">Points earned: <strong className="text-foreground">{referralCredits}</strong> · pending: <strong className="text-foreground">{pendingReferralCredits}</strong></p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mini leaderboard */}
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-foreground">Top challengers</h2>
                  </div>
                </div>
                {topChallengers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Be the first to invite — climb the leaderboard.</p>
                ) : (
                  <ol className="space-y-2">
                    {topChallengers.map((c, i) => (
                      <li key={c.name}>
                        <Link
                          to={`/leaderboard?focus=${encodeURIComponent(c.name)}`}
                          className="flex items-center gap-2 group"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                            {i + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">{c.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
                <Link to="/leaderboard" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  View full leaderboard <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Points rewards (locally unlocked) */}
        {creditUnlockedItems.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-foreground">Points rewards</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {creditUnlockedItems.map((r) => (
                <Card key={r.id} className="border-primary/25 bg-card shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{r.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                    <Button className="mt-4 w-full" onClick={() => navigate("/redeem")}>View</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Challenge bonuses */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-foreground">Challenge bonuses</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {challengeBonuses.map((bonus) => {
              const unlocked = completedDay >= bonus.day;
              return (
                <Card key={bonus.id} className={unlocked ? "border-primary/25 bg-card shadow-sm" : "border-border bg-muted/40 opacity-70"}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Gift className={unlocked ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
                      {unlocked ? <CheckCircle className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h3 className="font-semibold text-foreground">{bonus.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{bonus.benefit}</p>
                    <Button
                      className="mt-4 w-full"
                      variant={unlocked ? "default" : "outline"}
                      onClick={() => navigate(`/challenge/day-${bonus.day}`)}
                    >
                      {unlocked ? "Access" : `Unlock by completing Day ${bonus.day}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Partner bonuses */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-foreground">Partner bonuses</h2>
          {assets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">Partner bonuses are coming soon</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset, index) => {
                const unlocked = index < unlockedPartnerCount;
                const requirement = index < 3 ? "Invite 3 builders" : "Complete Day 2";
                return (
                  <Card
                    key={asset.id}
                    className={unlocked ? "overflow-hidden border-border bg-card shadow-sm" : "overflow-hidden border-border bg-muted/40 opacity-75"}
                  >
                    <div className={`relative aspect-video ${partnerImages[index % partnerImages.length]} flex items-center justify-center`}>
                      <Gift className="h-12 w-12 text-primary" />
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold text-foreground">
                          Unlock this bonus
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">By {asset.partner_name}</p>
                      <h3 className="mt-1 font-semibold text-foreground">{asset.contribution_title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{asset.contribution_description}</p>
                      <Button
                        className="mt-4 w-full gap-2"
                        variant={unlocked ? "default" : "outline"}
                        onClick={() => unlocked ? navigate(`/reward/${asset.id}`) : (index < 3 ? copyLink() : navigate("/challenge/day-2"))}
                      >
                        {unlocked ? <ExternalLink className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {unlocked ? "Access bonus" : requirement}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* How to unlock more */}
        <section>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 text-base font-semibold text-foreground">How to unlock more</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { icon: Users, label: "Share your invite link" },
                  { icon: Gift, label: "Complete challenge days" },
                  { icon: Trophy, label: "Help other builders" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                    <Icon className="mb-2 h-5 w-5 text-primary" /> {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default EarnRewards;
