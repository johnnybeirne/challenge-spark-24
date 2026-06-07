import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Crown, Trophy, Gift, Network, Megaphone, Rocket, Sparkles as SparklesIcon,
  TrendingUp, Users, Eye, Sparkles, ChevronRight, Medal, Infinity as InfinityIcon,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";

type JourneyKind = "journey" | "reward" | "outcome";
type JourneyItem = {
  kind: JourneyKind;
  title: string;
  sub: string;
  icon: typeof Megaphone;
  visual?: ReactNode;
};

/** Tiny visual glyphs that replace paragraphs of copy. */
const ArchetypeChips = () => (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {["Pioneer", "Architect", "Authority"].map((a) => (
      <span
        key={a}
        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
      >
        {a}
      </span>
    ))}
  </div>
);

const LeaderboardGlyph = () => (
  <div className="flex items-end gap-1 mt-2 h-8">
    <Crown className="h-3 w-3 text-amber-500 self-start -mb-0.5" />
    <div className="w-3 h-6 rounded-sm bg-amber-500/80" />
    <div className="w-3 h-4 rounded-sm bg-amber-500/50" />
    <div className="w-3 h-3 rounded-sm bg-amber-500/30" />
  </div>
);

const BranchingGlyph = () => (
  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-muted-foreground">
    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">1</span>
    <ChevronRight className="h-3 w-3" />
    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">3</span>
    <ChevronRight className="h-3 w-3" />
    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">9</span>
    <ChevronRight className="h-3 w-3" />
    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">27+</span>
  </div>
);

const SparkleRow = () => (
  <div className="flex items-center gap-1 mt-2 text-amber-500">
    <SparklesIcon className="h-3.5 w-3.5" />
    <SparklesIcon className="h-3 w-3 opacity-70" />
    <SparklesIcon className="h-2.5 w-2.5 opacity-50" />
  </div>
);

const JOURNEY: JourneyItem[] = [
  { kind: "journey", icon: Megaphone, title: "You promote",               sub: "One link. One post." },
  { kind: "journey", icon: SparklesIcon, title: "They get diagnosed",    sub: "A personalised result they can't ignore.", visual: <ArchetypeChips /> },
  { kind: "journey", icon: Rocket,    title: "They join the challenge", sub: "3 days. Real build." },
  { kind: "reward",  icon: Trophy,    title: "You hit the leaderboard",  sub: "Seen by every participant.", visual: <LeaderboardGlyph /> },
  { kind: "journey", icon: Network,   title: "They invite. Then they invite.", sub: "Your name stays at the origin.", visual: <BranchingGlyph /> },
  { kind: "reward",  icon: Gift,      title: "Your offer = the reward",  sub: "Earned, not advertised.", visual: <SparkleRow /> },
  { kind: "outcome", icon: InfinityIcon, title: "Your reach compounds",  sub: "One promotion. Infinite waves." },
];

const BENEFITS = [
  { icon: Eye, title: "Compounding visibility", desc: "Every invite your referrals send keeps your name circulating." },
  { icon: Network, title: "Network-driven reach", desc: "You tap into a system that grows itself, not just a one-off promo." },
  { icon: Trophy, title: "Permanent leaderboard placement", desc: "Origin attribution means early partners stay visible as the network scales." },
  { icon: Gift, title: "Featured reward placement", desc: "Your bonus sits on the rewards ladder, earned by motivated participants." },
  { icon: Sparkles, title: "No complex tracking", desc: "No pixels, no spreadsheets, no funnels to build. Share the link and Leadio does the rest." },
];

const LEADERBOARD = [
  { rank: 1, name: "Your Name", refs: 142, you: true,  medal: "text-amber-500" },
  { rank: 2, name: "Sarah K.",  refs:  87, you: false, medal: "text-slate-400" },
  { rank: 3, name: "Marcus T.", refs:  64, you: false, medal: "text-amber-700" },
  { rank: 4, name: "Priya R.",  refs:  41, you: false },
  { rank: 5, name: "Devon L.",  refs:  28, you: false },
];

/** Trigger when an element first scrolls into view. */
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function JourneyStepRow({
  step,
  index,
  journeyNumber,
  isLast,
  nextKind,
}: {
  step: JourneyItem;
  index: number;
  journeyNumber: number | null;
  isLast: boolean;
  nextKind?: JourneyKind;
}) {
  const card = useInView<HTMLDivElement>(0.25);
  const line = useInView<HTMLDivElement>(0.5);

  const isReward = step.kind === "reward";
  const isOutcome = step.kind === "outcome";
  const Icon = step.icon;

  // Outcome card = the finale. Render distinct, full-bleed gradient.
  if (isOutcome) {
    return (
      <div className="w-full flex flex-col items-center">
        <Card
          ref={card.ref}
          className="w-full max-w-md border-0 shadow-lg overflow-hidden relative bg-gradient-to-br from-primary via-primary/90 to-emerald-500"
          style={{
            opacity: card.inView ? 1 : 0,
            transform: card.inView ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
            transition: "opacity 600ms ease-out, transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <InfinityIcon
            className="absolute -right-6 -bottom-6 h-40 w-40 text-white/15"
            aria-hidden="true"
          />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/80">
                The payoff
              </span>
            </div>
            <p className="text-xl font-bold text-white mb-1">{step.title}</p>
            <p className="text-sm text-white/85 leading-snug">{step.sub}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cardBorder = isReward
    ? "border-amber-500/60 ring-2 ring-amber-500/20 animate-pulse-soft"
    : "border-border hover:border-primary/40";

  const numberCircle = isReward
    ? "bg-amber-500 text-white border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]"
    : "bg-primary text-primary-foreground border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]";

  const lineColor =
    nextKind === "reward"
      ? "from-primary/60 to-amber-500/70"
      : nextKind === "outcome"
        ? "from-amber-500/70 to-emerald-500/70"
        : "from-primary/50 to-primary/60";

  return (
    <div className="w-full flex flex-col items-center">
      <Card
        ref={card.ref}
        className={`w-full max-w-md border-2 ${cardBorder} transition-colors shadow-sm relative overflow-hidden`}
        style={{
          opacity: card.inView ? 1 : 0,
          transform: card.inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 500ms ease-out, transform 500ms ease-out",
        }}
      >
        {isReward && (
          <>
            <Gift
              className="absolute -right-3 -bottom-3 h-20 w-20 text-amber-500/10"
              aria-hidden="true"
            />
            <span className="absolute top-2.5 right-2.5 text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500 text-white">
              REWARD
            </span>
          </>
        )}
        <CardContent className="p-4 flex items-center gap-4">
          {/* Big number / icon */}
          <div
            className={`h-14 w-14 rounded-full border-2 flex items-center justify-center shrink-0 font-bold ${numberCircle}`}
            style={{
              transform: card.inView ? "scale(1)" : "scale(0.85)",
              transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms",
            }}
          >
            {isReward ? (
              <Icon className="h-6 w-6" />
            ) : (
              <span className="text-lg tabular-nums">{String(journeyNumber).padStart(2, "0")}</span>
            )}
          </div>
          {/* Punchline */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {!isReward && <Icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />}
              <p className="text-base font-bold text-foreground leading-tight">{step.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{step.sub}</p>
            {step.visual}
          </div>
        </CardContent>
      </Card>
      {!isLast && (
        <div
          ref={line.ref}
          className="flex flex-col items-center py-1.5 overflow-hidden"
          aria-hidden="true"
          style={{
            transform: line.inView ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "top",
            transition: "transform 450ms ease-out",
          }}
        >
          <div className={`w-[3px] h-8 rounded-full bg-gradient-to-b ${lineColor}`} />
        </div>
      )}
    </div>
  );
}



const JvPartners = () => {
  const board = useInView<HTMLDivElement>(0.2);

  useEffect(() => {
    trackEvent("partners_page_viewed");
  }, []);

  return (
    <>
      <SEO
        title="JV Partner Program | Leadio"
        description="Promote to your audience. Land on the Top Referrers leaderboard. Get featured on the rewards ladder. Compounding visibility through the Leadio referral network."
        canonical="/jv"
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">

          {/* ─── HERO ─── */}
          <header className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Crown className="h-3.5 w-3.5" /> JV Partner Program
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
              Promote to your audience. Stay visible forever.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Leadio is an evergreen 3-day challenge that grows itself through referrals.
              Every participant is rewarded for inviting others — compounding your reach with every new signup.
            </p>
          </header>

          {/* ─── THE OFFER ─── */}
          <section className="mb-12">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">The JV partner benefit</h2>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  You promote to your audience.
                  Every person you send in earns you visibility on the
                  {" "}<span className="font-semibold">Top Referrers leaderboard</span> — seen by every single challenge participant.
                  The people you invite then invite others, and your name stays at the top as the
                  {" "}<span className="font-semibold">origin of that growth</span>.
                </p>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mt-4">
                  Your bonus product or service is featured as a reward on the
                  {" "}<span className="font-semibold">rewards ladder</span>, putting your brand in front of every participant who hits that points threshold.
                </p>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mt-4 italic">
                  No complex tracking — just compounding visibility the more your referrals engage and invite others.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* ─── HOW IT WORKS — ANIMATED VERTICAL JOURNEY ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">
              How it works
            </h2>
            <div className="flex flex-col items-center">
              {(() => {
                let journeyCount = 0;
                return JOURNEY.map((step, i) => {
                  const num = step.kind === "journey" ? ++journeyCount : null;
                  return (
                    <JourneyStepRow
                      key={i}
                      step={step}
                      index={i}
                      journeyNumber={num}
                      isLast={i === JOURNEY.length - 1}
                      nextKind={JOURNEY[i + 1]?.kind}
                    />
                  );
                });
              })()}
            </div>
          </section>




          {/* ─── LEADERBOARD MOCKUP — ANIMATED ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
              What every participant sees
            </h2>
            <Card ref={board.ref} className="border-border overflow-hidden shadow-md">
              {/* Mock app chrome */}
              <div className="bg-muted/50 border-b border-border px-4 py-2.5 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="text-[10px] font-mono text-muted-foreground ml-3">leadio.app / leaderboard</span>
              </div>
              <CardContent className="p-5 sm:p-6 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Top Referrers · This Week</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    LIVE
                  </Badge>
                </div>
                <ol className="space-y-2">
                  {LEADERBOARD.map((row, i) => (
                    <li
                      key={row.rank}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                        row.you
                          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                          : "bg-muted/30 border-border"
                      }`}
                      style={{
                        opacity: board.inView ? 1 : 0,
                        transform: board.inView ? "translateX(0)" : "translateX(-12px)",
                        transition: `opacity 400ms ease-out ${i * 120}ms, transform 400ms ease-out ${i * 120}ms`,
                      }}
                    >
                      <div className="w-6 flex justify-center">
                        {row.rank <= 3 ? (
                          <Medal className={`h-4 w-4 ${row.medal}`} />
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">#{row.rank}</span>
                        )}
                      </div>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-semibold text-foreground">
                        {row.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${row.you ? "font-semibold text-foreground" : "text-foreground/90"}`}>
                          {row.name}
                          {row.you && (
                            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-primary">you</span>
                          )}
                        </p>
                      </div>
                    </li>

                  ))}
                </ol>
                <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
                  Visible to every participant, every day of the challenge.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* ─── NETWORK EFFECT ─── */}
          <section className="mb-12">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Your one promotion, multiplied
                </h2>
                <div className="flex items-center gap-2 text-xs text-foreground font-medium justify-center flex-wrap">
                  <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> You</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary">Your audience</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary">Their invites</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Network growth</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                  Every wave traces back to you. The leaderboard remembers the origin.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* ─── WHAT YOU GET ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              What you get
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 flex items-start gap-3">
                    <b.icon className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ─── CTA ─── */}
          <section className="mb-4">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6 sm:p-8 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Ready to plug in?
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  Apply to become a JV partner. Share your bonus, get featured on the rewards ladder, and promote to land on the leaderboard.
                </p>
                <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto">
                  <Link to="/partners" onClick={() => trackEvent("partner_application_started")}>
                    <Crown className="h-4 w-4" /> Apply to become a JV partner
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </>
  );
};

export default JvPartners;
