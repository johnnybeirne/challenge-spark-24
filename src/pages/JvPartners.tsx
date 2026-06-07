import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Crown, Trophy, Gift, Network, Megaphone, Rocket, Sparkles as SparklesIcon,
  TrendingUp, Users, Eye, Sparkles, ChevronRight, Medal, Infinity as InfinityIcon,
  Mail, Linkedin, Facebook, MessageCircle,
} from "lucide-react";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-6.99L4.5 22H1.244l8.02-9.17L1 2h7l4.84 6.39L18.244 2zm-1.2 18h1.86L7.06 4H5.1l11.944 16z" />
  </svg>
);

const ShareIconsRow = () => (
  <div className="flex items-center gap-1.5 mt-2">
    {[
      { Icon: Mail, color: "bg-slate-500" },
      { Icon: XIcon, color: "bg-black" },
      { Icon: Facebook, color: "bg-[#1877F2]" },
      { Icon: Linkedin, color: "bg-[#0A66C2]" },
      { Icon: MessageCircle, color: "bg-[#25D366]" },
    ].map(({ Icon, color }, i) => (
      <span
        key={i}
        className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${color}`}
      >
        <Icon className="h-3 w-3" />
      </span>
    ))}
  </div>
);

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

const BranchingGlyph = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  // Tier positions (x coords); root at center
  const root = { x: 110, y: 14 };
  const tier1 = [40, 110, 180].map((x) => ({ x, y: 54 }));
  const tier2: { x: number; y: number }[] = [];
  tier1.forEach((p) => {
    [-22, 0, 22].forEach((dx) => tier2.push({ x: p.x + dx, y: 94 }));
  });
  return (
    <div ref={ref} className="mt-3 w-full sm:-ml-[72px] sm:w-[calc(100%+72px)]">
      <svg
        viewBox="0 0 220 104"
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Tier 1 branches (root → 3) */}
        {tier1.map((p, i) => (
          <line
            key={`b1-${i}`}
            x1={root.x}
            y1={root.y}
            x2={p.x}
            y2={p.y}
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="80"
            strokeDashoffset={inView ? 0 : 80}
            style={{ transition: `stroke-dashoffset 1100ms ease-out ${300 + i * 180}ms`, opacity: 0.7 }}
          />
        ))}
        {/* Tier 2 branches (3 → 9) */}
        {tier1.map((p, pi) =>
          [-22, 0, 22].map((dx, ci) => (
            <line
              key={`b2-${pi}-${ci}`}
              x1={p.x}
              y1={p.y}
              x2={p.x + dx}
              y2={94}
              stroke="hsl(var(--primary))"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeDasharray="50"
              strokeDashoffset={inView ? 0 : 50}
              style={{
                transition: `stroke-dashoffset 950ms ease-out ${1300 + pi * 200 + ci * 100}ms`,
                opacity: 0.45,
              }}
            />
          )),
        )}
        {/* Root node (YOU) */}
        <g
          style={{
            transform: inView ? "scale(1)" : "scale(0)",
            transformOrigin: `${root.x}px ${root.y}px`,
            transition: "transform 700ms cubic-bezier(0.34,1.56,0.64,1) 0ms",
          }}
        >
          <circle cx={root.x} cy={root.y} r="14" fill="#10b981" />
          <text
            x={root.x}
            y={root.y + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.5 }}
          >
            YOU
          </text>
        </g>

        {/* Tier 1 people */}
        {tier1.map((p, i) => (
          <g
            key={`n1-${i}`}
            style={{
              transform: inView ? "scale(1)" : "scale(0)",
              transformOrigin: `${p.x}px ${p.y}px`,
              transition: `transform 600ms cubic-bezier(0.34,1.56,0.64,1) ${900 + i * 180}ms`,
            }}
          >
            <circle cx={p.x} cy={p.y - 3} r="2.4" fill="hsl(var(--primary))" fillOpacity="0.9" />
            <path
              d={`M ${p.x - 4} ${p.y + 5} Q ${p.x - 4} ${p.y - 0.5} ${p.x} ${p.y - 0.5} Q ${p.x + 4} ${p.y - 0.5} ${p.x + 4} ${p.y + 5} Z`}
              fill="hsl(var(--primary))"
              fillOpacity="0.85"
            />
          </g>
        ))}
        {/* Tier 2 people */}
        {tier2.map((p, i) => (
          <g
            key={`n2-${i}`}
            style={{
              transform: inView ? "scale(1)" : "scale(0)",
              transformOrigin: `${p.x}px ${p.y}px`,
              transition: `transform 550ms cubic-bezier(0.34,1.56,0.64,1) ${1900 + i * 90}ms`,
            }}
          >
            <circle cx={p.x} cy={p.y - 2} r="1.6" fill="hsl(var(--primary))" fillOpacity="0.65" />
            <path
              d={`M ${p.x - 2.6} ${p.y + 3.5} Q ${p.x - 2.6} ${p.y} ${p.x} ${p.y} Q ${p.x + 2.6} ${p.y} ${p.x + 2.6} ${p.y + 3.5} Z`}
              fill="hsl(var(--primary))"
              fillOpacity="0.6"
            />
          </g>
        ))}

      </svg>
      <div
        className="flex items-center justify-between mt-1.5 text-[10px] font-mono font-bold text-primary/80 px-1"
        style={{
          opacity: inView ? 1 : 0,
          transition: "opacity 600ms ease-out 2700ms",
        }}
      >

        <span>1</span>
        <span>3</span>
        <span>9</span>
        <span className="text-primary">→ ∞</span>
      </div>
    </div>
  );
};

const SparkleRow = () => (
  <div className="flex items-center gap-1 mt-2 text-amber-500">
    <SparklesIcon className="h-3.5 w-3.5" />
    <SparklesIcon className="h-3 w-3 opacity-70" />
    <SparklesIcon className="h-2.5 w-2.5 opacity-50" />
  </div>
);

const JOURNEY: JourneyItem[] = [
  { kind: "journey", icon: Megaphone, title: "You promote",               sub: "Share by email and on social.", visual: <ShareIconsRow /> },
  { kind: "journey", icon: Rocket,    title: "They join the challenge", sub: "3 days. Real build." },
  { kind: "reward",  icon: Trophy,    title: "You hit the leaderboard",  sub: "Seen by every participant.", visual: <LeaderboardGlyph /> },
  { kind: "journey", icon: Network,   title: "They invite. Then they invite.", sub: "Your name stays at the origin.", visual: <BranchingGlyph /> },
  { kind: "reward",  icon: Gift,      title: "Your offer = Their reward",  sub: "Earned, not advertised.", visual: <SparkleRow /> },
  { kind: "outcome", icon: InfinityIcon, title: "Your reach compounds",  sub: "One promotion. Infinite waves." },
];

const BENEFITS = [
  { icon: Eye, title: "Compounding visibility", desc: "Every invite your referrals send keeps your name circulating." },
  { icon: Network, title: "Network-driven reach", desc: "You tap into a system that grows itself, not just a one-off promo." },
  { icon: Trophy, title: "Stay visible by staying active.", desc: "The more you promote, the more visible you stay. Every new wave of referrals keeps your name in front of a growing audience." },
  { icon: Gift, title: "Featured reward placement", desc: "Your bonus sits on the rewards ladder, earned by motivated participants." },
  { icon: Sparkles, title: "No complex tracking", desc: "No pixels, no spreadsheets, no funnels to build. Share the link and Leadio does the rest." },
];

const LEADERBOARD = [
  { rank: 1, name: "Alex M.",    bio: "Growth advisor turning newsletter audiences into thriving paid communities.", you: false, medal: "text-amber-500" },
  { rank: 2, name: "Sarah K.",  bio: "Funnel coach helping solo founders turn cold traffic into paying customers.", you: false, medal: "text-slate-400" },
  { rank: 3, name: "Marcus T.", bio: "Offer strategist who has helped 400+ creators package what they actually sell.", you: false, medal: "text-amber-700" },
  { rank: 4, name: "Priya R.",  bio: "Email copywriter behind some of the highest-converting launch sequences in B2B.", you: false },
  { rank: 5, name: "Devon L.",  bio: "Launch mentor guiding first-time founders from idea to live in under 30 days.", you: false },
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

  const arrowStroke =
    nextKind === "reward"
      ? "#f59e0b"
      : nextKind === "outcome"
        ? "#10b981"
        : "hsl(var(--primary))";


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
        <CardContent className="p-4 flex items-start justify-center gap-4">
          {/* Big number / icon */}
          <div
            className={`h-14 w-14 rounded-full border-2 flex items-center justify-center shrink-0 font-bold ${numberCircle}`}
            style={{
              transform: card.inView ? "scale(1)" : "scale(0.85)",
              transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms",
            }}
          >
            {journeyNumber !== null ? (
              <span className="text-lg tabular-nums">{String(journeyNumber).padStart(2, "0")}</span>
            ) : (
              <Icon className="h-6 w-6" />
            )}
          </div>
          {/* Punchline */}
          <div className="min-w-0 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              {!isReward && <Icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />}
              <p className="text-base font-bold text-foreground leading-tight">{step.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{step.sub}</p>
            {step.visual && <div className="flex justify-center w-full">{step.visual}</div>}
          </div>
        </CardContent>


      </Card>
      {!isLast && (
        <div
          ref={line.ref}
          className="flex justify-center py-2"
          aria-hidden="true"
        >
          <svg width="20" height="56" viewBox="0 0 20 56" className="overflow-visible">
            <line
              x1="10"
              y1="2"
              x2="10"
              y2="44"
              stroke={arrowStroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="44"
              strokeDashoffset={line.inView ? 0 : 44}
              style={{ transition: "stroke-dashoffset 1400ms cubic-bezier(0.4,0,0.2,1)" }}
            />
            <polyline
              points="4,42 10,52 16,42"
              fill="none"
              stroke={arrowStroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: line.inView ? 1 : 0,
                transform: line.inView ? "translateY(0)" : "translateY(-6px)",
                transition: "opacity 500ms ease-out 1200ms, transform 600ms cubic-bezier(0.34,1.56,0.64,1) 1200ms",
              }}
            />
          </svg>
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
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono font-semibold tracking-[0.22em] uppercase text-primary">
                JV Partner Program
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/60" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
              We turn your audience into your biggest promoters.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Leadio is an evergreen 3-day challenge that grows itself through referrals.
              Every participant is rewarded for inviting others, compounding your reach with every new signup.
            </p>
          </header>


          {/* ─── HOW IT WORKS — ANIMATED VERTICAL JOURNEY ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">
              How it works
            </h2>
            <div className="flex flex-col items-center">
              {(() => {
                let journeyCount = 0;
                return JOURNEY.map((step, i) => {
                  const num = ++journeyCount;
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
              How challenge takers discover you
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
                    <h3 className="text-sm font-semibold text-foreground">Top Partners · This Week</h3>
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
                        <p className="text-[11px] text-muted-foreground truncate leading-snug">{row.bio}</p>
                      </div>

                    </li>

                  ))}
                </ol>
                <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
                  Visible to every challenge participant on an evergreen basis.
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
                  <Link to="/jv-apply" onClick={() => trackEvent("partner_application_started")}>
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
