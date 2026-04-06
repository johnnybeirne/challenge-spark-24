import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Zap, Target, Link2, Mail, Users, TrendingUp,
  CheckCircle2, BarChart3, Share2, Rocket, Gift, MessageSquare,
  ChevronRight, Award, Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";

/* ══ Hooks ══ */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.unobserve(el); } },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
}

function useScrollDepth() {
  const fired = useRef(new Set<number>());
  useEffect(() => {
    const h = () => {
      const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
      for (const t of [25, 50, 75, 100]) { if (pct >= t && !fired.current.has(t)) { fired.current.add(t); trackEvent("landing_scroll_depth", { depth: t }); } }
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
}

/* ══ Helpers ══ */
const Reveal = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useReveal();
  return <section ref={ref} className={`reveal-section ${className}`}>{children}</section>;
};

const Cta = ({ text, section, to = "/assess", full = true }: { text: string; section: string; to?: string; full?: boolean }) => (
  <Button asChild size="lg" className={`cta-premium rounded-[14px] text-base font-semibold h-14 text-primary-foreground ${full ? "w-full" : "px-8"}`}
    onClick={() => trackEvent("landing_cta_clicked", { section })}>
    <Link to={to}>{text}<ArrowRight className="ml-2 h-5 w-5" /></Link>
  </Button>
);

/* ── Fake product mockup screens ── */
const MockupPhone = ({ title, items }: { title: string; items: string[] }) => (
  <div className="mockup-phone float-gentle">
    <div className="bg-gradient-to-b from-[#534AB7] to-[#6C63FF] p-4 pt-2">
      <p className="text-white text-[11px] font-bold text-center mb-3">{title}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white/15 rounded-lg px-3 py-2 text-white text-[10px] backdrop-blur-sm">{item}</div>
        ))}
      </div>
    </div>
  </div>
);

const MockupBrowser = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mockup-browser float-gentle-delay w-[280px] md:w-[320px]">
    <div className="mockup-browser-bar">
      <div className="mockup-dot mockup-dot-red" />
      <div className="mockup-dot mockup-dot-yellow" />
      <div className="mockup-dot mockup-dot-green" />
      <span className="text-[9px] text-muted-foreground ml-2">{title}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/* ── Growth loop diagram ── */
const GrowthLoopDiagram = () => {
  const steps = [
    { icon: <Target className="w-5 h-5" />, label: "Take quiz", color: "bg-primary/10 text-primary" },
    { icon: <Zap className="w-5 h-5" />, label: "Join challenge", color: "bg-accent/10 text-accent" },
    { icon: <Award className="w-5 h-5" />, label: "Get results", color: "bg-success/10 text-success" },
    { icon: <Share2 className="w-5 h-5" />, label: "Invite others", color: "bg-primary/10 text-primary" },
    { icon: <Users className="w-5 h-5" />, label: "More people enter", color: "bg-accent/10 text-accent" },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Your list grows", color: "bg-success/10 text-success" },
  ];
  return (
    <div className="relative">
      {/* Desktop: circular layout */}
      <div className="hidden md:flex items-center justify-center relative" style={{ height: 320 }}>
        <div className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-primary/15 loop-arrow" />
        {steps.map((s, i) => {
          const angle = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
          const r = 140;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <div key={i} className="absolute flex flex-col items-center gap-1.5 loop-node"
              style={{ left: `calc(50% + ${x}px - 40px)`, top: `calc(50% + ${y}px - 30px)` }}>
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shadow-sm`}>{s.icon}</div>
              <span className="text-[11px] font-medium text-foreground text-center w-20">{s.label}</span>
            </div>
          );
        })}
        <div className="absolute text-center">
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-[10px] font-bold text-primary">GROWTH<br/>LOOP</p>
        </div>
      </div>
      {/* Mobile: vertical connected */}
      <div className="md:hidden flex flex-col gap-0">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4 stagger-child">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shadow-sm`}>{s.icon}</div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-primary/15 my-1" />}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium text-foreground">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-primary/15" />
            <ChevronRight className="w-4 h-4 text-primary rotate-[-90deg]" />
          </div>
          <p className="text-xs text-primary font-bold pt-2">Loop repeats automatically</p>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════ LANDING PAGE ══════════════════ */
const Landing = () => {
  const { config } = useSiteConfig();
  const lc = config.landing;

  useEffect(() => { trackEvent("landing_viewed"); }, []);
  useScrollDepth();

  const target = lc.countdownTarget ? new Date(lc.countdownTarget) : (() => { const n = new Date(); const d = n.getDay(); const diff = d === 0 ? 1 : 8 - d; const nx = new Date(n); nx.setDate(n.getDate() + diff); nx.setHours(0,0,0,0); return nx; })();
  const { d, h, m, s } = useCountdown(target);

  const ICONS = [<Target className="w-5 h-5" />, <Zap className="w-5 h-5" />, <Link2 className="w-5 h-5" />, <Mail className="w-5 h-5" />];

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Global ambient gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(83,74,183,0.05), transparent 50%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(220,100,50,0.03), transparent 40%)"
      }} />

      {/* ═══════ 1. HERO — SPLIT LAYOUT ═══════ */}
      <section className="relative overflow-hidden">
        <div className="hero-glow-orb" />
        <div className="landing-container px-6 md:px-10 pt-16 md:pt-24 pb-16 md:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-[480px]">
              <h1 className="text-[2rem] md:text-[2.6rem] leading-[1.08] font-extrabold tracking-tight text-foreground mb-5">
                {lc.heroHeadline}
              </h1>
              <p className="text-[15px] md:text-base text-muted-foreground leading-[1.65] mb-3">{lc.heroSubheadline}</p>
              <p className="text-sm text-foreground/45 italic mb-8">{lc.heroSupportingLine}</p>
              <div className="max-w-[340px]">
                <Cta text={lc.primaryCtaText} section="hero" />
              </div>
              <p className="text-xs text-muted-foreground mt-3.5 tracking-wide">{lc.heroBelowCtaText}</p>
              <p className="text-xs font-bold text-primary mt-1.5">{lc.heroMicroProof}</p>
            </div>
            {/* Right: Product Mockup Composition */}
            <div className="relative flex justify-center md:justify-end items-center min-h-[380px] mt-8 md:mt-0">
              <div className="relative">
                {/* Browser mockup — results */}
                <MockupBrowser title="Your Challenge Results">
                  <div className="space-y-3">
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-[11px] font-bold text-primary mb-1">Your Recommendation</p>
                      <p className="text-[10px] text-foreground font-medium">Build a client acquisition challenge</p>
                      <p className="text-[9px] text-muted-foreground mt-1">3-day system for B2B lead generation</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Quiz", "Challenge", "Referrals"].map(l => (
                        <div key={l} className="bg-muted rounded-md p-2 text-center">
                          <p className="text-[9px] font-medium text-foreground">{l}</p>
                          <div className="w-full h-1 bg-primary/20 rounded mt-1"><div className="h-full bg-primary rounded" style={{ width: "70%" }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </MockupBrowser>
                {/* Phone mockup — overlapping */}
                <div className="absolute -bottom-6 -left-8 md:-left-12 z-10">
                  <MockupPhone title="Assessment" items={[
                    "Who do you want to reach?",
                    "   Business owners / teams",
                    "   Individuals / consumers",
                    "   Both audiences",
                  ]} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 2. PROOF STRIP ═══════ */}
      <section className="border-y border-border/30 section-tinted">
        <div className="landing-container px-6 md:px-10 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-5 h-5 text-primary" />, value: "147", label: "builders started" },
              { icon: <Rocket className="w-5 h-5 text-accent" />, value: "38", label: "launched this week" },
              { icon: <Zap className="w-5 h-5 text-primary" />, value: "3 days", label: "to build & launch" },
              { icon: <TrendingUp className="w-5 h-5 text-success" />, value: "Referral", label: "powered growth" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border/40">{s.icon}</div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 3. FEATURES — GRID + PRODUCT PANEL ═══════ */}
      {lc.showFeatures && (
        <Reveal className="py-20 md:py-28">
          <div className="landing-container px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              {/* Left: title + 2x2 grid */}
              <div>
                <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-2">{lc.featuresTitle}</h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">{lc.featuresFooter}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {lc.featureCards.map((card, i) => (
                    <div key={i} className="stagger-child card-float p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-3">
                        {ICONS[i] || <span>{card.icon}</span>}
                      </div>
                      <p className="font-bold text-foreground text-[14px] mb-1">{card.title}</p>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 max-w-[300px]">
                  <Cta text={lc.featuresCtaText} section="features" />
                </div>
              </div>
              {/* Right: Product preview panel */}
              <div className="relative hidden md:block">
                <div className="card-float p-1 overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6">
                    <div className="flex gap-2 mb-4">
                      {["Quiz", "Challenge", "Referrals", "Leads"].map((tab, i) => (
                        <div key={tab} className={`px-3 py-1.5 rounded-full text-[11px] font-medium ${i === 0 ? "bg-primary text-white" : "bg-white/60 text-muted-foreground"}`}>{tab}</div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-[11px] font-bold text-foreground mb-2">Assessment Preview</p>
                        <div className="w-full h-1.5 bg-muted rounded-full mb-3"><div className="h-full bg-primary rounded-full" style={{ width: "37%" }} /></div>
                        <p className="text-[12px] text-muted-foreground">Who do you primarily want to reach?</p>
                        <div className="mt-2 space-y-1.5">
                          {["Business owners", "Individuals", "Both"].map(o => (
                            <div key={o} className="bg-muted/50 rounded-lg px-3 py-2 text-[11px] text-foreground">{o}</div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <p className="text-[11px] font-bold text-foreground">Day 1 Complete</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-1.5 bg-success rounded-full" />
                          <div className="flex-1 h-1.5 bg-muted rounded-full" />
                          <div className="flex-1 h-1.5 bg-muted rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 4. WHY THIS WORKS ═══════ */}
      {lc.showWhyThisWorks && (
        <Reveal className="section-tinted py-20 md:py-28">
          <div className="landing-container px-6 md:px-10 max-w-[720px] mx-auto">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-6">{lc.whyTitle}</h2>
            <div className="space-y-4">
              {lc.whyBody.split("\n\n").map((para, i) => {
                const bold = para.startsWith("Instead") || para.startsWith("That turns");
                return <p key={i} className={`stagger-child text-[15px] leading-[1.75] ${bold ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{para}</p>;
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 5. HOW IT WORKS — HORIZONTAL DIAGRAM ═══════ */}
      {lc.showHowItWorks && (
        <Reveal className="py-20 md:py-28">
          <div className="landing-container px-6 md:px-10">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-3 text-center">{lc.howTitle}</h2>
            <p className="text-[14px] text-muted-foreground text-center mb-10 max-w-[500px] mx-auto">{lc.howFooter}</p>
            {/* Desktop: horizontal */}
            <div className="hidden md:flex items-start justify-between gap-4 max-w-[900px] mx-auto">
              {lc.howSteps.map((step, i) => (
                <div key={i} className="stagger-child flex flex-col items-center text-center flex-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-primary-foreground mb-4" style={{
                    background: "linear-gradient(135deg, #534AB7, #6C63FF)",
                    boxShadow: "0 8px 24px rgba(83,74,183,0.25)",
                  }}>{i + 1}</div>
                  <p className="font-bold text-foreground text-[14px] mb-1">{step.title}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[160px]">{step.description}</p>
                  {i < lc.howSteps.length - 1 && (
                    <div className="absolute" style={{ display: "none" }} /> // connector handled by flex gap
                  )}
                </div>
              ))}
            </div>
            {/* Connector arrows (desktop) */}
            <div className="hidden md:flex items-center justify-between max-w-[900px] mx-auto -mt-[72px] px-16 pointer-events-none">
              {lc.howSteps.slice(0, -1).map((_, i) => (
                <div key={i} className="flex-1 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 relative">
                    <ChevronRight className="absolute right-0 -top-2 w-4 h-4 text-primary/40" />
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile: vertical */}
            <div className="md:hidden flex flex-col gap-0">
              {lc.howSteps.map((step, i) => (
                <div key={i} className="stagger-child flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-primary-foreground" style={{
                      background: "linear-gradient(135deg, #534AB7, #6C63FF)",
                      boxShadow: "0 6px 16px rgba(83,74,183,0.25)",
                    }}>{i + 1}</div>
                    {i < lc.howSteps.length - 1 && <div className="w-px flex-1 bg-primary/15 my-1.5" />}
                  </div>
                  <div className="pb-8">
                    <p className="font-bold text-foreground text-[14px]">{step.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 6. WHO THIS IS FOR — DUAL PATH ═══════ */}
      {lc.showWhoThisIsFor && (
        <Reveal className="section-tinted py-20 md:py-28">
          <div className="landing-container px-6 md:px-10">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-2 text-center">{lc.whoTitle}</h2>
            <p className="text-[14px] text-muted-foreground text-center mb-10 max-w-[500px] mx-auto">{lc.whoIntro}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
              {[lc.whoB2b, lc.whoB2c].map((col, ci) => (
                <div key={ci} className="stagger-child card-float overflow-hidden">
                  <div className={`px-6 py-4 ${ci === 0 ? "bg-primary/5 border-b border-primary/8" : "bg-accent/5 border-b border-accent/8"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ci === 0 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                        {ci === 0 ? <BarChart3 className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <p className={`font-bold text-base ${ci === 0 ? "text-primary" : "text-accent"}`}>{col.title}</p>
                    </div>
                  </div>
                  <ul className="p-6 space-y-3">
                    {col.items.map((item, ii) => (
                      <li key={ii} className="text-[13px] text-muted-foreground flex gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ci === 0 ? "text-primary" : "text-accent"}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-8">{lc.whoFooter}</p>
            <div className="flex justify-center mt-6">
              <Cta text={lc.whoCtaText} section="whothisisfor" full={false} />
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 7. SOCIAL PROOF — ACTIVITY WALL ═══════ */}
      {lc.showSocialProof && (
        <Reveal className="py-20 md:py-28">
          <div className="landing-container px-6 md:px-10">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-2 text-center">{lc.socialProofTitle}</h2>
            <p className="text-[14px] text-muted-foreground text-center mb-8">Real activity from the builder community</p>
            <div className="max-w-[480px] mx-auto">
              <ActivityFeed />
            </div>
            {lc.socialProofMetric && (
              <p className="text-xs text-muted-foreground text-center mt-4">{lc.socialProofMetric}</p>
            )}
          </div>
        </Reveal>
      )}

      {/* ═══════ 8. EXAMPLES — VISUAL GRID ═══════ */}
      {lc.showExamples && (
        <Reveal className="section-tinted py-20 md:py-28">
          <div className="landing-container px-6 md:px-10">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-2 text-center">{lc.examplesTitle}</h2>
            <p className="text-[14px] text-muted-foreground text-center mb-10">See what others are building</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[800px] mx-auto">
              {lc.exampleCards.map((ex, i) => (
                <div key={i} className="stagger-child card-float p-5">
                  {/* Mini mockup thumbnail */}
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-3 mb-4">
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-success/50" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-primary/15 rounded w-3/4" />
                      <div className="h-1.5 bg-primary/10 rounded w-1/2" />
                      <div className="h-1.5 bg-primary/8 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-2.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      ex.audienceBadge === "B2B" ? "bg-primary/8 text-primary" : "bg-accent/8 text-accent"
                    }`}>{ex.audienceBadge}</span>
                    <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">{ex.styleBadge}</span>
                  </div>
                  <p className="font-bold text-foreground text-[13px]">{ex.challenge}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Quiz: <span className="italic">"{ex.quiz}"</span></p>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground text-center mt-6">{lc.examplesFooter}</p>
            <div className="flex justify-center mt-6">
              <Cta text={lc.examplesCtaText} section="examples" full={false} />
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 9. GROWTH ENGINE DIAGRAM ═══════ */}
      <Reveal className="py-20 md:py-28">
        <div className="landing-container px-6 md:px-10">
          <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-2 text-center">How your challenge grows</h2>
          <p className="text-[14px] text-muted-foreground text-center mb-10 max-w-[500px] mx-auto">Your audience participates, gets results, and invites others — creating a self-sustaining growth loop.</p>
          <GrowthLoopDiagram />
        </div>
      </Reveal>

      {/* ═══════ 10. URGENCY ═══════ */}
      {lc.showUrgency && (
        <Reveal>
          <div className="landing-container px-6 md:px-10 py-20 md:py-28">
            <div className="max-w-[800px] mx-auto rounded-3xl overflow-hidden relative" style={{
              background: "linear-gradient(135deg, hsl(60 4% 16.5%), hsl(248 39% 20%))",
            }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 60% 60% at 80% 20%, rgba(83,74,183,0.2), transparent 50%)"
              }} />
              <div className="relative p-8 md:p-12 flex flex-col gap-6">
                <p className="font-bold text-white text-xl md:text-2xl leading-snug">
                  {lc.urgencyText}{" "}
                  <span className="text-accent">{target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                </p>
                <p className="text-sm text-white/60 leading-relaxed max-w-[480px]">{lc.urgencyBody}</p>
                {lc.showCountdown && (
                  <div className="grid grid-cols-4 gap-3 max-w-[360px]">
                    {[
                      { label: "Days", value: d },
                      { label: "Hours", value: h },
                      { label: "Mins", value: m },
                      { label: "Secs", value: s },
                    ].map(u => (
                      <div key={u.label} className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl py-4 border border-white/5">
                        <span className="text-2xl font-extrabold text-white tabular-nums">{String(u.value).padStart(2, "0")}</span>
                        <span className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">{u.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/40">{lc.urgencyBonus}</p>
                <div className="max-w-[320px]">
                  <Cta text={lc.urgencyCtaText} section="urgency" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ═══════ 11. FAQ ═══════ */}
      {lc.showFaq && (
        <Reveal className="section-tinted py-20 md:py-28">
          <div className="landing-container px-6 md:px-10 max-w-[720px] mx-auto">
            <h2 className="text-[1.5rem] md:text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-8 text-center">{lc.faqTitle}</h2>
            <Accordion type="single" collapsible className="w-full">
              {lc.faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-none mb-3">
                  <div className="card-float">
                    <AccordionTrigger className="text-[14px] text-left font-medium hover:no-underline px-5 py-4"
                      onClick={() => trackEvent("landing_faq_expanded", { index: i })}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed px-5 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      )}

      {/* ═══════ 12. FINAL CTA ═══════ */}
      <section className="relative px-6 md:px-10 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-foreground" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(83,74,183,0.2), transparent 55%)"
        }} />
        <div className="relative landing-container flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 max-w-[480px]">
            <h2 className="text-2xl md:text-3xl font-extrabold text-background leading-tight mb-4">{lc.finalCtaTitle}</h2>
            <p className="text-[14px] text-background/50 leading-relaxed mb-8">{lc.finalCtaBody}</p>
            <div className="max-w-[340px]">
              <Button asChild size="lg" className="cta-premium w-full rounded-[14px] text-base font-semibold h-14 text-primary-foreground"
                onClick={() => trackEvent("landing_cta_clicked", { section: "final" })}>
                <Link to="/assess">{lc.finalCtaButtonText}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
            <p className="text-xs text-background/30 mt-4">{lc.finalCtaBelowText}</p>
          </div>
          {/* Right: subtle product visual */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="opacity-35">
              <MockupBrowser title="challengeos.app/your-challenge">
                <div className="space-y-2 py-4">
                  <div className="h-2 bg-background/20 rounded w-3/4" />
                  <div className="h-2 bg-background/15 rounded w-1/2" />
                  <div className="h-8 bg-primary/20 rounded-lg mt-3" />
                </div>
              </MockupBrowser>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
