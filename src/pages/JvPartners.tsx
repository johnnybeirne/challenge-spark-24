import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Crown, Megaphone, Trophy, Gift, Network,
  TrendingUp, Users, Eye, Sparkles, ChevronRight, Repeat, ArrowDown, Medal,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";

const HOW_IT_WORKS = [
  {
    icon: Megaphone,
    title: "Promote once to your audience",
    desc: "One share. One email. One post. You point your audience at the 3-day challenge with your partner link.",
  },
  {
    icon: Trophy,
    title: "Land on the Top Referrers leaderboard",
    desc: "Every signup you send in lifts you on a leaderboard seen by every participant inside the challenge.",
  },
  {
    icon: Repeat,
    title: "Your referrals invite others — you stay at the top",
    desc: "Participants are rewarded for inviting more builders. That second and third wave still traces back to you as the origin.",
  },
  {
    icon: Gift,
    title: "Your bonus becomes a reward on the ladder",
    desc: "Your product or service is featured on the rewards ladder — earned by participants who hit a points threshold. Your brand lands in front of every active builder.",
  },
];

const BENEFITS = [
  { icon: Eye, title: "Compounding visibility", desc: "Every invite your referrals send keeps your name circulating." },
  { icon: Network, title: "Network-driven reach", desc: "You tap into a system that grows itself, not just a one-off promo." },
  { icon: Trophy, title: "Permanent leaderboard placement", desc: "Origin attribution means early partners stay visible as the network scales." },
  { icon: Gift, title: "Featured reward placement", desc: "Your bonus sits on the rewards ladder, earned by motivated participants." },
  { icon: Sparkles, title: "No complex tracking", desc: "No pixels, no spreadsheets, no funnels to build. Share the link and the platform does the rest." },
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

const JvPartners = () => {
  const flow = useInView<HTMLDivElement>(0.15);
  const board = useInView<HTMLDivElement>(0.2);

  useEffect(() => {
    trackEvent("partners_page_viewed");
  }, []);

  return (
    <>
      <SEO
        title="JV Partner Program | Leadio"
        description="Promote once. Land on the Top Referrers leaderboard. Get featured on the rewards ladder. Compounding visibility through the Leadio referral network."
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
              Promote once. Stay visible forever.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Leadio is a 3-day challenge platform that grows itself through referrals.
              Every participant is rewarded for inviting others — compounding your reach with every new signup.
            </p>
          </header>

          {/* ─── THE OFFER ─── */}
          <section className="mb-12">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">The JV partner benefit</h2>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  You promote <span className="font-semibold text-primary">once</span> to your audience.
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

          {/* ─── HOW IT WORKS — VERTICAL FLOWCHART ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">
              How it works
            </h2>
            <div className="flex flex-col items-center">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="w-full flex flex-col items-center">
                  <Card className="w-full max-w-md border-2 border-border hover:border-primary/40 transition-colors shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground mt-1.5 tracking-widest">
                          STEP {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-foreground mb-1.5">{step.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="flex flex-col items-center py-2" aria-hidden="true">
                      <div className="w-px h-6 bg-border" />
                      <div className="h-7 w-7 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="w-px h-6 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ─── LEADERBOARD MOCKUP ─── */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
              What every participant sees
            </h2>
            <Card className="border-border overflow-hidden shadow-md">
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
                  <Badge variant="secondary" className="text-[10px]">LIVE</Badge>
                </div>
                <ol className="space-y-2">
                  {[
                    { rank: 1, name: "Your Name", refs: 142, you: true, medal: "text-amber-500" },
                    { rank: 2, name: "Sarah K.",   refs:  87, you: false, medal: "text-slate-400" },
                    { rank: 3, name: "Marcus T.",  refs:  64, you: false, medal: "text-amber-700" },
                    { rank: 4, name: "Priya R.",   refs:  41, you: false },
                    { rank: 5, name: "Devon L.",   refs:  28, you: false },
                  ].map((row) => (
                    <li
                      key={row.rank}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                        row.you
                          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                          : "bg-muted/30 border-border"
                      }`}
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
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{row.refs}</p>
                        <p className="text-[10px] text-muted-foreground -mt-0.5">referrals</p>
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
                  Apply to become a JV partner. Share your bonus, get featured on the rewards ladder, and promote once to land on the leaderboard.
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
