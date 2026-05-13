import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { shareOrCopy } from "@/lib/share";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import {
  Rocket, Users, Link2, Trophy, Copy, Share2, ArrowUp,
  Zap, Star, Crown, Shield, Award, CheckCircle2, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

/* ───── tier config ───── */
interface TierDef {
  name: string;
  min: number;
  icon: React.ReactNode;
  color: string;
  rewards: string[];
}

const TIERS: TierDef[] = [
  { name: "Joined", min: 0, icon: <CheckCircle2 className="h-5 w-5" />, color: "from-slate-400 to-slate-500", rewards: ["Waitlist access", "Referral link", "Visible position"] },
  { name: "Starter", min: 1, icon: <Zap className="h-5 w-5" />, color: "from-blue-500 to-blue-600", rewards: ["Move up the leaderboard", "Starter badge"] },
  { name: "Mover", min: 3, icon: <ArrowUp className="h-5 w-5" />, color: "from-emerald-500 to-emerald-600", rewards: ["24-hour early access", "Early Builder Preview", "Momentum Score boost"] },
  { name: "Builder", min: 5, icon: <Shield className="h-5 w-5" />, color: "from-amber-500 to-amber-600", rewards: ["Bonus starting points", "Reduced friction in early steps", "Builder status"] },
  { name: "Accelerator", min: 10, icon: <Star className="h-5 w-5" />, color: "from-purple-500 to-purple-600", rewards: ["48-hour early access", "Pre-unlocked rewards", "Higher Momentum Score", "Top Promoter visibility"] },
  { name: "Founder", min: 20, icon: <Crown className="h-5 w-5" />, color: "from-yellow-500 to-orange-500", rewards: ["VIP Founder status", "Maximum starting advantage", "Private early group", "Priority visibility"] },
];

function getTierIndex(invites: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (invites >= TIERS[i].min) return i;
  }
  return 0;
}

function getNextTier(invites: number) {
  const idx = getTierIndex(invites);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/* ───── types ───── */
interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  confirmed_invites: number;
  current_tier: string;
  waitlist_position: number;
}

/* ───── Leaderboard row ───── */
const LeaderRow = ({ entry, rank }: { entry: WaitlistEntry; rank: number }) => {
  const tierIdx = getTierIndex(entry.confirmed_invites);
  const tier = TIERS[tierIdx];
  const isTop3 = rank <= 3;
  const medalColors = ["", "from-yellow-400 to-amber-500", "from-gray-300 to-gray-400", "from-amber-600 to-amber-700"];

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isTop3 ? "bg-gradient-to-r " + medalColors[rank] + " text-white shadow-lg" : "bg-card/60 border border-border/50"}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${isTop3 ? "bg-white/20" : "bg-muted"}`}>
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${isTop3 ? "" : "text-foreground"}`}>
          {entry.name || entry.email.replace(/(.{2}).*(@.*)/, "$1***$2")}
        </p>
        <div className="flex items-center gap-1.5 text-xs opacity-80">
          {tier.icon}
          <span>{tier.name}</span>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-black ${isTop3 ? "" : "text-foreground"}`}>{entry.confirmed_invites}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-70">invites</p>
      </div>
    </div>
  );
};

/* ───── Main component ───── */
const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<WaitlistEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leaderboard, setLeaderboard] = useState<WaitlistEntry[]>([]);
  const [totalSignups, setTotalSignups] = useState(0);

  /* load leaderboard */
  const loadLeaderboard = useCallback(async () => {
    const { data, count } = await supabase
      .from("waitlist_signups")
      .select("id, email, name, referral_code, confirmed_invites, current_tier, waitlist_position", { count: "exact" })
      .order("confirmed_invites", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(20);
    if (data) setLeaderboard(data);
    if (count !== null) setTotalSignups(count);
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      // generate referral code
      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert({
          email: trimmed,
          name: name.trim() || null,
          referral_code: code,
          referred_by_code: refCode || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // duplicate email — load existing entry
          const { data: existing } = await supabase
            .from("waitlist_signups")
            .select("*")
            .eq("email", trimmed)
            .single();
          if (existing) {
            setSignedUp(existing);
            toast.info("You're already on the list! Here's your referral link.");
          }
        } else {
          toast.error("Something went wrong. Please try again.");
          console.error(error);
        }
      } else if (data) {
        setSignedUp(data);
        setShowConfetti(true);
        toast.success("You're in! 🎉");
        loadLeaderboard();
      }
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = signedUp
    ? `https://leadio.johnnybeirne.com/waitlist?ref=${signedUp.referral_code}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Link copied!");
  };

  const handleShare = () => {
    shareOrCopy({
      title: "Join Leadio Early Access",
      text: "I just joined the Leadio early access list. It helps experts build AI-powered challenges that generate leads and grow through referrals. Join here:",
      url: referralUrl,
    });
  };

  const currentTierIdx = signedUp ? getTierIndex(signedUp.confirmed_invites) : 0;
  const nextTier = signedUp ? getNextTier(signedUp.confirmed_invites) : null;
  const invitesNeeded = nextTier ? nextTier.min - (signedUp?.confirmed_invites || 0) : 0;

  return (
    <>
      <SEO title="Early Access Waitlist" description="Join the waitlist for Leadio — build a challenge that grows before it even launches. Climb the leaderboard with referrals." canonical="/waitlist" />
    <div className="min-h-screen">
      {showConfetti && <Confetti />}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 px-5 py-20 sm:px-6 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            Early Access
          </Badge>

          <h1 className="text-4xl font-black leading-[1.1] text-foreground sm:text-5xl md:text-6xl">
            Build a challenge that grows{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              before it even launches
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Join the Leadio early access list. Move up by inviting others. Unlock better access,
            founder status, and a stronger starting position when the challenge opens.
          </p>

          {!signedUp ? (
            <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-card/80 backdrop-blur"
                maxLength={100}
              />
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-card/80 backdrop-blur"
                maxLength={255}
              />
              <Button type="submit" disabled={loading} size="lg" className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent px-8 text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
                {loading ? "Joining…" : "Join Early Access"}
              </Button>
            </form>
          ) : (
            /* ── POST-SIGNUP SUCCESS ── */
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-border/40 bg-card/80 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Award className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-black text-foreground">You're in. Now move up.</h2>
              </div>

              <div className="mb-6 flex items-center justify-center gap-6 text-center">
                <div>
                  <p className="text-3xl font-black text-primary">#{signedUp.waitlist_position}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Position</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <Badge className={`bg-gradient-to-r ${TIERS[currentTierIdx].color} text-white border-0 px-3 py-1`}>
                    {TIERS[currentTierIdx].icon}
                    <span className="ml-1">{TIERS[currentTierIdx].name}</span>
                  </Badge>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Tier</p>
                </div>
              </div>

              {/* referral link */}
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                <input readOnly value={referralUrl} className="min-w-0 flex-1 truncate bg-transparent text-sm text-foreground outline-none" />
                <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleShare} className="shrink-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* progress to next tier */}
              {nextTier && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{signedUp.confirmed_invites} invite{signedUp.confirmed_invites !== 1 ? "s" : ""}</span>
                    <span>{nextTier.min} to unlock <strong className="text-foreground">{nextTier.name}</strong></span>
                  </div>
                  <Progress
                    value={(signedUp.confirmed_invites / nextTier.min) * 100}
                    className="h-3 rounded-full"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    You are <strong className="text-foreground">{invitesNeeded} invite{invitesNeeded !== 1 ? "s" : ""}</strong> away from unlocking{" "}
                    <strong className="text-foreground">{nextTier.rewards[0]}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground/70">
            Early access is limited. Top inviters get priority treatment when the challenge opens.
          </p>
          {totalSignups > 0 && (
            <p className="mt-2 text-xs font-medium text-primary">
              {totalSignups.toLocaleString()} builder{totalSignups !== 1 ? "s" : ""} already on the list
            </p>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-border/30 bg-card/40 px-5 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-black text-foreground sm:text-4xl">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Rocket className="h-8 w-8" />, title: "Join the list", desc: "Enter your email and secure your spot on the early access list." },
              { icon: <Link2 className="h-8 w-8" />, title: "Get your invite link", desc: "Receive a unique referral link to share with friends and colleagues." },
              { icon: <Users className="h-8 w-8" />, title: "Move up by inviting", desc: "Each confirmed invite boosts your rank and unlocks better rewards." },
            ].map((step, i) => (
              <div key={i} className="group relative rounded-2xl border border-border/40 bg-card/80 p-6 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary transition-colors group-hover:from-primary/20 group-hover:to-accent/20">
                  {step.icon}
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-black text-primary-foreground">
                  Step {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-black text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REWARD LADDER ── */}
      <section className="border-t border-border/30 px-5 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-black text-foreground sm:text-4xl">Reward Ladder</h2>
          <p className="mb-12 text-center text-muted-foreground">
            Every invite moves you closer to the top. Here's what you unlock along the way.
          </p>

          <div className="space-y-4">
            {TIERS.map((tier, i) => {
              const isActive = signedUp && currentTierIdx >= i;
              const isCurrent = signedUp && currentTierIdx === i;
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    isCurrent
                      ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                      : isActive
                        ? "border-border/60 bg-card/80"
                        : "border-border/30 bg-card/40 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color} text-white shadow-md`}>
                      {tier.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] uppercase">Current</Badge>
                        )}
                        {isActive && !isCurrent && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {tier.min === 0 ? "Join the waitlist" : `${tier.min}+ confirmed invite${tier.min !== 1 ? "s" : ""}`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.rewards.map((r) => (
                          <span key={r} className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!isActive && (
                      <div className="shrink-0 text-muted-foreground/40">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD ── */}
      <section className="border-t border-border/30 bg-card/40 px-5 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-black text-foreground sm:text-4xl">Leaderboard</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" />
              Top Founders & Promoters
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <LeaderRow key={entry.id} entry={entry} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/50 bg-card/60 p-10 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Be the first to join and claim the #1 spot.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      {!signedUp && (
        <section className="border-t border-border/30 bg-gradient-to-b from-primary/5 to-background px-5 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-4 text-2xl font-black text-foreground sm:text-3xl">Your position matters</h2>
            <p className="mb-8 text-muted-foreground">
              The earlier you join and the more quality people you invite, the more advantage you start with.
            </p>
            <Button
              size="lg"
              className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent px-10 text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/25"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Join Early Access <ArrowUp className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}
    </div>
    </>
  );
};

export default Waitlist;
