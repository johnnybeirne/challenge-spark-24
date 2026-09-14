import { useEffect, useMemo, useRef, useState } from "react";
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
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { memoryShareText } from "@/lib/personalisation";
import { getReferralUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/progress";
import Spinner from "@/components/Spinner";
import { getNextReward, pointRewards } from "@/lib/points";
import ReferralMilestoneCard from "@/components/ReferralMilestoneCard";
import { useSiteConfig, type LadderRung } from "@/context/SiteConfigContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface PartnerAsset {
  id: string;
  contribution_title: string;
  contribution_description: string;
  estimated_value: number;
  contribution_url: string;
  user_id: string;
  partner_name?: string;
}

// Partner bonuses — placeholder data (safe defaults until real partners are wired).
interface PartnerBonus {
  partner: string;
  title: string;
  description: string;
  threshold: number; // points required to unlock
}
const partnerBonuses: PartnerBonus[] = [
  { partner: "Notion Templates Co.", title: "Challenge Operating System Template", description: "A complete Notion workspace for planning, running, and reviewing your challenge.", threshold: 100 },
  { partner: "Lead Magnet Lab", title: "Audience Growth Playbook", description: "A short playbook on turning a 3-day challenge into a long-term audience asset.", threshold: 200 },
  { partner: "Funnel Studio", title: "Post-Challenge Funnel Map", description: "A visual map of what to offer participants after the challenge ends.", threshold: 300 },
  { partner: "Creator Coaching Collective", title: "Group Coaching Drop-In", description: "An invite to a live drop-in session with experienced challenge creators.", threshold: 500 },
  { partner: "LEADTREE Studio", title: "Brand & Positioning Teardown", description: "A recorded teardown reviewing your positioning, hook, and challenge promise.", threshold: 750 },
];

const partnerInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

/**
 * Earn Rewards — single, focused destination.
 * Section order is fixed: Invite, Progress, Ladder, Partner Bonuses, Leaderboard.
 * Premium / quiet by design — minimal cards, no scoreboards, no animation noise.
 */
const EarnRewards = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [copied, setCopied] = useState<"quiz" | "challenge" | null>(null);
  const [assets, setAssets] = useState<PartnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [topChallengers, setTopChallengers] = useState<{ name: string; pts: number }[]>([]);

  const inviteCode = state.user?.inviteCode ?? "";
  const quizLink = getReferralUrl("/assess", inviteCode);
  const challengeLink = getReferralUrl("/", inviteCode);
  const referralLink = quizLink; // legacy alias for share text helpers below

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
      const { data: profiles } = await (supabase.from("public_profiles" as any) as any).select("user_id, name").in("user_id", userIds as string[]);
      const nameMap = new Map(((profiles || []) as any[]).map((p: any) => [p.user_id, p.name]));
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

  // ── Canonical reward ladder (same source as /rewards) ──
  const { config } = useSiteConfig();
  const { openCheckout, closeCheckout, checkoutElement } = useStripeCheckout();
  const ladderUserPoints = state.points?.total ?? 0;
  const { rungs } = config.rewards.ladder;
  const ordered = useMemo(
    () =>
      [...rungs]
        .map((r, i) => ({ ...r, position: typeof r.position === "number" ? r.position : i + 1 }))
        .sort((a, b) => a.position - b.position),
    [rungs],
  );

  // Paid rungs are fulfilled server-side into `unlock_grants` by gate key.
  const [purchasedKeys, setPurchasedKeys] = useState<Set<string>>(new Set());
  const gateKeys = useMemo(
    () => ordered.map((r) => r.gateKey).filter(Boolean) as string[],
    [ordered],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!gateKeys.length) return;
      const { data } = await supabase
        .from("unlock_grants")
        .select("gate_key")
        .in("gate_key", gateKeys);
      if (!active) return;
      setPurchasedKeys(new Set((data ?? []).map((r) => r.gate_key as string)));
    };
    load();
    return () => {
      active = false;
    };
  }, [gateKeys.join("|")]);

  // Inline rung checkout accordion: at most one rung's checkout open at a time.
  const [hostKey, setHostKey] = useState<string | null>(null);
  const [openRungKey, setOpenRungKey] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const rungKey = (rung: LadderRung) => rung.priceId || String(rung.position);

  const openRungCheckout = (rung: LadderRung) => {
    if (!rung.gateKey) {
      toast.error("This reward is not ready to buy yet. Please try again shortly.");
      return;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHostKey(rungKey(rung));
    setOpenRungKey(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setOpenRungKey(rungKey(rung)));
    openCheckout({
      priceId: rung.priceId,
      gateKey: rung.gateKey,
      quantity: 1,
      customerEmail: state.user?.email,
      userId: state.user?.id || "",
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const closeRungCheckout = () => {
    setOpenRungKey(null);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setHostKey(null);
      closeCheckout();
      closeTimerRef.current = null;
    }, 320);
  };

  const handleBuyClick = (rung: LadderRung) => {
    const key = rungKey(rung);
    if (openRungKey === key) {
      closeRungCheckout();
      return;
    }
    openRungCheckout(rung);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const copyLink = async (which: "quiz" | "challenge", url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(which);
      toast("Link copied! Share it with your network.");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareWhatsApp = (url: string) => {
    const wa = `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + url)}`;
    window.open(wa, "_blank");
  };

  const shareEmail = (url: string) => {
    const subject = encodeURIComponent("Quick assessment on audience growth");
    const body = encodeURIComponent(shareText + "\n\n" + url);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  const LinkCard = ({
    which,
    title,
    hint,
    url,
  }: {
    which: "quiz" | "challenge";
    title: string;
    hint: string;
    url: string;
  }) => {
    const isCopied = copied === which;
    if (!url) {
      return (
        <div className="rounded-[16px] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">{title}</p>
          <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>
          <p className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm text-[#6B7280]">
            Your personal link is being set up — refresh in a moment.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-[16px] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
        <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">{title}</p>
        <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3">
          <code className="flex-1 truncate text-sm text-[#1F2937]">{url}</code>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyLink(which, url)} aria-label="Copy link">
            {isCopied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button size="lg" className="w-full gap-2 rounded-[12px] sm:min-w-[220px]" onClick={() => shareOrCopy({ text: shareText, url })}>
            <Share2 className="h-4 w-4" /> Share this link
          </Button>
          <Button size="lg" variant="outline" className="w-full gap-2 rounded-[12px] sm:w-auto" onClick={() => copyLink(which, url)}>
            {isCopied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#6B7280]">
          <span>Share via</span>
          <button onClick={() => shareWhatsApp(url)} className="inline-flex items-center gap-1.5 font-medium text-[#1F2937] hover:text-primary">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button onClick={() => shareEmail(url)} className="inline-flex items-center gap-1.5 font-medium text-[#1F2937] hover:text-primary">
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 pb-24 sm:px-10 lg:py-12">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-[32px] font-semibold tracking-tight text-[#1F2937]">
            {firstName ? `Invite friends, ${firstName}` : "Invite friends"}
          </h1>
          <p className="mt-2 text-base text-[#6B7280]">
            Invite others to join the challenge and unlock bonus rewards, training, and visibility opportunities.
          </p>
        </header>

        {/* 1. INVITE FRIENDS — two referral links */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <LinkCard
            which="quiz"
            title="Quiz referral link"
            hint="Send people to the assessment quiz first."
            url={quizLink}
          />
          <LinkCard
            which="challenge"
            title="Challenge referral link"
            hint="Send people straight to the challenge."
            url={challengeLink}
          />
        </section>
        <p className="mb-8 -mt-4 text-xs text-[#6B7280]">
          Both links track referrals to you. Pick the one that fits where you're sharing.
        </p>


        <div className="mb-8">
          <ReferralMilestoneCard />
        </div>

        {/* 2. YOUR PROGRESS */}
        {(() => {
          const points = state.points?.total ?? 0;
          const nextReward = getNextReward(points);
          const threshold = nextReward?.points ?? points;
          const prevThreshold = (() => {
            const earned = pointRewards.map((r) => r.points).filter((c) => c <= points);
            return earned.length ? earned[earned.length - 1] : 0;
          })();
          const pct = nextReward
            ? Math.min(100, Math.max(0, ((points - prevThreshold) / Math.max(1, threshold - prevThreshold)) * 100))
            : 100;
          return (
            <section className="mb-8">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Your progress</h2>
              <div className="rounded-[16px] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-[#1F2937]">{direct}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">Successful invite{direct === 1 ? "" : "s"}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-[#1F2937]">{points}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">Points earned</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-[#1F2937]">
                      {nextReward ? threshold : "—"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {nextReward ? "Points for next unlock" : "All rewards unlocked"}
                    </p>
                  </div>
                </div>
                <Progress value={pct} className="mt-6 h-1.5" />
                <p className="mt-3 text-xs text-[#6B7280]">
                  Most users unlock their first reward by inviting 2–3 people.
                </p>
              </div>
            </section>
          );
        })()}

        {/* 3. REWARD LADDER — canonical rungs from SiteConfigContext */}
        <section className="mb-8">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Reward ladder</h2>
          <p className="mb-4 text-xs text-[#6B7280]">
            Two ways to get every reward: climb by earning points, or buy any reward outright.
          </p>
          <div className="space-y-3">
            {ordered.map((rung) => {
              const earned = ladderUserPoints >= rung.points;
              const bought = !!rung.gateKey && purchasedKeys.has(rung.gateKey);
              const reached = earned || bought;
              const away = Math.max(0, rung.points - ladderUserPoints);
              const pct = Math.min(100, Math.round((ladderUserPoints / Math.max(rung.points, 1)) * 100));
              const isGold = rung.doubleUnlock;

              return (
                <div
                  key={rung.priceId || rung.position}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isGold
                      ? "border-amber-400/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/40 dark:from-amber-950/30 dark:to-yellow-950/20"
                      : "bg-white",
                    reached && "ring-1 ring-emerald-500/40",
                  )}
                >
                  {/* Reward name + value */}
                  <div className="flex flex-wrap items-center gap-2">
                    {reached ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-[#6B7280]" />
                    )}
                    <p className="text-base font-bold tracking-tight text-[#1F2937]">{rung.name}</p>
                    {isGold && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        <Sparkles className="mr-0.5 inline h-2 w-2" />
                        2×
                      </span>
                    )}
                  </div>

                  {/* Two paths, equal weight */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {/* EARN */}
                    <div className="rounded-lg border bg-[#F7F8FA] p-3">
                      <p className="text-sm font-semibold text-[#1F2937]">
                        {reached ? "Unlocked" : `Access at ${rung.points} pts`}
                      </p>
                      <Progress value={pct} className="mt-2 h-1.5" />
                      <p className="mt-1.5 text-xs text-[#6B7280]">
                        {bought ? "Yours — purchased." : reached ? "Yours." : `${away} more to go`}
                      </p>
                    </div>

                    {/* BUY */}
                    <div className="rounded-lg border bg-[#F7F8FA] p-3">
                      {reached ? (
                        <Button
                          size="sm"
                          className="h-9 w-full bg-primary text-sm font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white"
                          onClick={() => navigate(`/rewards/${rung.gateKey}`)}
                          disabled={!rung.gateKey}
                        >
                          Unlocked — Open
                        </Button>
                      ) : rung.buyPrice > 0 ? (
                        <>
                          <Button
                            size="sm"
                            className="h-9 w-full bg-primary text-sm font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white disabled:text-white"
                            onClick={() => handleBuyClick(rung)}
                          >
                            {openRungKey === rungKey(rung)
                              ? `Close — $${rung.buyPrice}`
                              : `Buy it now — $${rung.buyPrice}`}
                          </Button>
                          <p className="mt-1.5 text-center text-xs text-[#6B7280]">
                            Skip the wait — get it instantly.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[#6B7280]">
                          Earn-only reward — not available to buy.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline checkout accordion — only the hosting rung mounts it,
                      expanding directly beneath its Buy button. One open at a time. */}
                  {hostKey === rungKey(rung) && (
                    <div
                      className={cn(
                        "grid overflow-hidden transition-all duration-300 ease-in-out",
                        openRungKey === rungKey(rung)
                          ? "mt-3 grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden rounded-lg border bg-[#F7F8FA] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-medium text-[#6B7280]">
                            Secure checkout — {rung.name}
                          </p>
                          <button
                            type="button"
                            onClick={closeRungCheckout}
                            className="rounded-md px-2 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1F2937]"
                          >
                            Close
                          </button>
                        </div>
                        <div className="overflow-x-hidden">{checkoutElement}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. PARTNER BONUSES */}
        {(() => {
          const points = state.points?.total ?? 0;
          return (
            <section className="mb-8">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Partner bonuses</h2>
              <p className="mb-4 text-sm leading-relaxed text-[#6B7280]">
                Exclusive rewards, tools, training, and opportunities contributed by LEADTREE partners and experts.
              </p>
              <div className="rounded-[16px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <ul>
                  {partnerBonuses.map((bonus, i) => {
                    const unlocked = points >= bonus.threshold;
                    return (
                      <li
                        key={bonus.partner + bonus.title}
                        className={`flex items-start gap-4 px-6 py-5 ${i > 0 ? "border-t border-[#E5E7EB]" : ""}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide ${
                            unlocked ? "bg-primary/10 text-primary" : "bg-[#F7F8FA] text-[#6B7280]"
                          }`}
                          aria-hidden
                        >
                          {partnerInitials(bonus.partner)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
                            {bonus.partner}
                          </p>
                          <p className={`mt-0.5 text-sm font-semibold ${unlocked ? "text-[#1F2937]" : "text-[#6B7280]"}`}>
                            {bonus.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                            {bonus.description}
                          </p>
                        </div>
                        <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                          {unlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                              <Gift className="h-3.5 w-3.5" /> Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                          <span className="text-[11px] text-[#6B7280] tabular-nums">
                            {bonus.threshold} pts
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="mt-3 text-xs text-[#6B7280]">
                Partner bonuses are added regularly.
              </p>
            </section>
          );
        })()}

        {/* 5. LEADERBOARD */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Leaderboard</h2>
            <Link to="/leaderboard" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {topChallengers.length === 0 ? (
            <div className="rounded-[16px] bg-white p-10 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Trophy className="mx-auto mb-2 h-5 w-5 text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Be the first to invite — climb the leaderboard.</p>
            </div>
          ) : (
            <div className="rounded-[16px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              <ol>
                {topChallengers.map((c, i) => (
                  <li key={c.name} className={`${i > 0 ? "border-t border-[#E5E7EB]" : ""}`}>
                    <Link
                      to={`/leaderboard?focus=${encodeURIComponent(c.name)}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[#F7F8FA]"
                    >
                      <span className="w-5 text-xs font-semibold text-[#6B7280] tabular-nums">{i + 1}</span>
                      <span className="flex-1 truncate text-sm font-semibold text-[#1F2937]">{c.name}</span>
                      <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};


export default EarnRewards;
