import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Copy,
  CheckCircle,
  Share2,
  MessageCircle,
  Mail,
  Gift,
  Lock,
  Trophy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { memoryShareText } from "@/lib/personalisation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Spinner from "@/components/Spinner";
import { getNextReward, creditRewards } from "@/lib/credits";

interface PartnerAsset {
  id: string;
  contribution_title: string;
  contribution_description: string;
  estimated_value: number;
  contribution_url: string;
  user_id: string;
  partner_name?: string;
}

// Reward ladder — points-based milestones.
// `major: true` marks headline rewards used for "next major" emphasis.
interface Rung {
  points: number;
  title: string;
  desc?: string;
  major?: boolean;
}
const ladder: Rung[] = [
  { points: 100, title: "Starter Resource Kit" },
  { points: 200, title: "Advanced Challenge Training" },
  { points: 300, title: "VIP Implementation Workshop" },
  { points: 400, title: "Private Community Access" },
  { points: 500, title: "Challenge Promotion Spotlight", desc: "We'll help showcase and promote your challenge to the LEADIO audience and ecosystem.", major: true },
  { points: 600, title: "Partner Bonus Training" },
  { points: 750, title: "Founder Inner Circle Session" },
  { points: 1000, title: "Featured Challenge Opportunity", desc: "Top challenge creators may receive visibility, featured placement, or collaboration opportunities inside the LEADIO network.", major: true },
];

/**
 * Earn Rewards — single, focused destination.
 * Section order is fixed: Invite, Progress, Ladder, Partner Bonuses, Leaderboard.
 * Premium / quiet by design — minimal cards, no scoreboards, no animation noise.
 */
const EarnRewards = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState<PartnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [topChallengers, setTopChallengers] = useState<{ name: string; pts: number }[]>([]);

  const inviteCode = state.user?.inviteCode ?? "builder";
  const referralLink = `${window.location.origin}/assess?ref=${inviteCode}`;
  const shareText = memoryShareText(state.memory);
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "";

  const direct = state.network.direct;
  const indirect = state.network.indirect;
  const totalNetwork = direct + indirect;

  const completedDay = state.challenge.completed ? 3 : Math.max(0, state.challenge.currentDay - 1);
  const unlockedPartnerCount = direct >= 10 ? assets.length : direct >= 5 ? 5 : direct >= 3 ? 3 : Math.min(1, assets.length);


  useEffect(() => { trackEvent("reward_accessed"); }, []);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("waitlist_signups")
        .select("name, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(5);
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

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8 pb-24 lg:py-10">
        {/* Eyebrow */}
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Earn Rewards</p>

        {/* 1. INVITE FRIENDS — dominant hero */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-7 shadow-sm sm:p-9">
            <div className="mb-6 max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {firstName ? `Invite Friends, ${firstName}` : "Invite Friends"}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Invite others to join the challenge and unlock bonus rewards, training, and visibility opportunities.
              </p>
            </div>

            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Your personal referral link</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-3 backdrop-blur">
              <code className="flex-1 truncate text-sm text-foreground">{referralLink}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyLink} aria-label="Copy link">
                {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Button size="lg" className="w-full gap-2 sm:min-w-[220px]" onClick={() => shareOrCopy({ text: shareText, url: referralLink })}>
                <Share2 className="h-4 w-4" /> Share my link
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" onClick={copyLink}>
                {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span>Share via</span>
              <button onClick={shareWhatsApp} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
              <button onClick={shareEmail} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Share your link → invite people → unlock rewards.
          </p>
        </section>

        {/* 2. YOUR PROGRESS — simple clarity */}
        {(() => {
          const points = state.credits?.total ?? 0;
          const nextReward = getNextReward(points);
          const threshold = nextReward?.credits ?? points;
          const prevThreshold = (() => {
            const earned = creditRewards.map((r) => r.credits).filter((c) => c <= points);
            return earned.length ? earned[earned.length - 1] : 0;
          })();
          const pct = nextReward
            ? Math.min(100, Math.max(0, ((points - prevThreshold) / Math.max(1, threshold - prevThreshold)) * 100))
            : 100;
          return (
            <section className="mb-14">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your progress</h2>
              <div className="rounded-xl border border-border bg-card px-5 py-5">
                <div className="space-y-1.5">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold tabular-nums">{direct}</span>{" "}
                    <span className="text-muted-foreground">successful invite{direct === 1 ? "" : "s"}</span>
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold tabular-nums">{points}</span>{" "}
                    <span className="text-muted-foreground">points earned</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextReward
                      ? <>Next unlock at <span className="font-semibold text-foreground tabular-nums">{threshold}</span> points</>
                      : "You've unlocked every reward."}
                  </p>
                </div>
                <Progress value={pct} className="mt-4 h-1.5" />
              </div>
            </section>
          );
        })()}

        {/* 3. REWARD LADDER — emphasise current + next + next major */}
        {(() => {
          const points = state.credits?.total ?? 0;
          const unlockedRungs = ladder.filter((r) => points >= r.points);
          const lockedRungs = ladder.filter((r) => points < r.points);
          const justUnlocked = unlockedRungs[unlockedRungs.length - 1];
          const nextUp = lockedRungs[0];
          const nextMajor = lockedRungs.find((r) => r.major && r !== nextUp);
          const featuredKeys = new Set(
            [justUnlocked, nextUp, nextMajor].filter(Boolean).map((r) => r!.points),
          );
          const otherLocked = lockedRungs.filter((r) => !featuredKeys.has(r.points));

          const FeaturedCard = ({
            rung, kind,
          }: { rung: Rung; kind: "unlocked" | "next" | "major" }) => {
            const label =
              kind === "unlocked" ? "Just unlocked" :
              kind === "next" ? "Next unlock" : "Next major reward";
            const accent =
              kind === "next"
                ? "border-primary/40 bg-primary/5"
                : kind === "unlocked"
                  ? "border-border bg-card"
                  : "border-border bg-card";
            const pillCls =
              kind === "next"
                ? "bg-primary text-primary-foreground"
                : kind === "unlocked"
                  ? "bg-foreground/90 text-background"
                  : "bg-muted text-muted-foreground";
            return (
              <div className={`rounded-xl border ${accent} px-5 py-4`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pillCls}`}>
                    {label}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {rung.points} pts
                  </span>
                </div>
                <p className="text-base font-semibold text-foreground">{rung.title}</p>
                {rung.desc && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{rung.desc}</p>
                )}
                {kind === "next" && (
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    {Math.max(0, rung.points - points)} points to go
                  </p>
                )}
              </div>
            );
          };

          return (
            <section className="mb-14">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reward ladder</h2>

              <div className="space-y-3">
                {justUnlocked && <FeaturedCard rung={justUnlocked} kind="unlocked" />}
                {nextUp && <FeaturedCard rung={nextUp} kind="next" />}
                {nextMajor && <FeaturedCard rung={nextMajor} kind="major" />}
              </div>

              {otherLocked.length > 0 && (
                <ol className="mt-4 overflow-hidden rounded-xl border border-border">
                  {otherLocked.map((rung, i) => (
                    <li
                      key={rung.points}
                      className={`flex items-center gap-4 px-5 py-3 bg-muted/20 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                        {rung.points}
                      </span>
                      <span className="flex-1 truncate text-sm text-muted-foreground">{rung.title}</span>
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })()}

        {/* 4. PARTNER BONUSES */}
        <section className="mb-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Partner bonuses</h2>
          {assets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Gift className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Partner bonuses are coming soon.</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-xl border border-border">
              {assets.map((asset, index) => {
                const unlocked = index < unlockedPartnerCount;
                return (
                  <li
                    key={asset.id}
                    className={`flex items-center gap-4 px-5 py-4 ${index > 0 ? "border-t border-border" : ""} ${unlocked ? "bg-card" : "bg-muted/30"}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {unlocked ? <Gift className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{asset.contribution_title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">By {asset.partner_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={unlocked ? "ghost" : "ghost"}
                      className="shrink-0 gap-1 text-xs"
                      onClick={() => unlocked ? navigate(`/reward/${asset.id}`) : copyLink()}
                    >
                      {unlocked ? <>Open <ExternalLink className="h-3 w-3" /></> : "Invite to unlock"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 5. LEADERBOARD */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Leaderboard</h2>
            <Link to="/leaderboard" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {topChallengers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Trophy className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Be the first to invite — climb the leaderboard.</p>
            </div>
          ) : (
            <ol className="overflow-hidden rounded-xl border border-border">
              {topChallengers.map((c, i) => (
                <li key={c.name} className={`${i > 0 ? "border-t border-border" : ""}`}>
                  <Link
                    to={`/leaderboard?focus=${encodeURIComponent(c.name)}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40"
                  >
                    <span className="w-5 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate text-sm font-semibold text-foreground">{c.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};

export default EarnRewards;
