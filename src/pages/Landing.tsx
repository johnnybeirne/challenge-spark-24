import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, Link2, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";

/* ── Viewport reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.unobserve(el); } },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Countdown ── */
function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

/* ── Scroll depth ── */
function useScrollDepth() {
  const fired = useRef(new Set<number>());
  useEffect(() => {
    const h = () => {
      const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
      for (const t of [25, 50, 75, 100]) {
        if (pct >= t && !fired.current.has(t)) { fired.current.add(t); trackEvent("landing_scroll_depth", { depth: t }); }
      }
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
}

/* ── Icon map ── */
const ICONS = [
  <Target className="w-5 h-5" />,
  <Zap className="w-5 h-5" />,
  <Link2 className="w-5 h-5" />,
  <Mail className="w-5 h-5" />,
];

/* ── Premium CTA button ── */
const Cta = ({ text, section, to = "/assess" }: { text: string; section: string; to?: string }) => (
  <Button
    asChild
    size="lg"
    className="cta-premium w-full rounded-[14px] text-base font-semibold h-14 text-primary-foreground"
    onClick={() => trackEvent("landing_cta_clicked", { section })}
  >
    <Link to={to}>{text}<ArrowRight className="ml-2 h-5 w-5" /></Link>
  </Button>
);

/* ── RevealSection ── */
const Reveal = ({ children, className = "", tinted = false }: { children: React.ReactNode; className?: string; tinted?: boolean }) => {
  const ref = useReveal();
  return (
    <section ref={ref} className={`reveal-section ${tinted ? "section-tinted -mx-6 px-6 py-16 rounded-none" : ""} ${className}`}>
      {children}
    </section>
  );
};

/* ── Heading with supporting line ── */
const SectionHead = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-6">
    <h2 className="text-[1.4rem] leading-[1.15] font-extrabold tracking-tight text-foreground">{title}</h2>
    {sub && <p className="text-[15px] text-muted-foreground leading-relaxed mt-2">{sub}</p>}
  </div>
);

/* ══════════ LANDING ══════════ */
const Landing = () => {
  const { config } = useSiteConfig();
  const lc = config.landing;

  useEffect(() => { trackEvent("landing_viewed"); }, []);
  useScrollDepth();

  const nextMonday = getNextMonday();
  const target = lc.countdownTarget ? new Date(lc.countdownTarget) : nextMonday;
  const { d, h, m, s } = useCountdown(target);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* ── Global radial tints ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 90% 70% at 50% -5%, rgba(83,74,183,0.06), transparent 55%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(220,100,50,0.03), transparent 50%)",
      }} />

      {/* ══════ HERO ══════ */}
      <section className="relative px-6 pt-24 pb-20 overflow-hidden">
        <div className="hero-glow-orb" />

        <div className="relative flex flex-col items-center text-center max-w-[420px] mx-auto">
          <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight text-foreground mb-5">
            {lc.heroHeadline}
          </h1>
          <p className="text-[15px] text-muted-foreground leading-[1.65] mb-3 max-w-[380px]">
            {lc.heroSubheadline}
          </p>
          <p className="text-sm text-foreground/45 italic mb-10">
            {lc.heroSupportingLine}
          </p>
          <div className="w-full max-w-[340px]">
            <Cta text={lc.primaryCtaText} section="hero" />
          </div>
          <p className="text-xs text-muted-foreground mt-4 tracking-wide">
            {lc.heroBelowCtaText}
          </p>
          <p className="text-xs font-bold text-primary mt-1.5">{lc.heroMicroProof}</p>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div className="border-y border-border/30 bg-card/40 backdrop-blur-sm py-5 px-6">
        <p className="text-[11px] text-muted-foreground text-center uppercase tracking-[0.18em] font-medium">
          {lc.socialProofMetric}
        </p>
      </div>

      {/* ── Main content column ── */}
      <div className="px-6 flex flex-col gap-0 max-w-[480px] mx-auto w-full">

        {/* ── FEATURES ── */}
        {lc.showFeatures && (
          <Reveal className="flex flex-col pt-18 pb-2" tinted>
            <SectionHead title={lc.featuresTitle} />
            <div className="flex flex-col gap-4 stagger-wrap">
              {lc.featureCards.map((card, i) => (
                <div key={i} className="stagger-child card-float p-5 flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/8 text-primary flex items-center justify-center">
                    {ICONS[i] || <span className="text-lg">{card.icon}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[15px] mb-1">{card.title}</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-5 bg-primary/5 rounded-2xl p-4 border border-primary/8">
              {lc.featuresFooter}
            </p>
            <div className="mt-5">
              <Cta text={lc.featuresCtaText} section="features" />
            </div>
          </Reveal>
        )}

        {/* ── WHY THIS WORKS ── */}
        {lc.showWhyThisWorks && (
          <Reveal className="flex flex-col py-18">
            <SectionHead title={lc.whyTitle} />
            <div className="space-y-4 stagger-wrap">
              {lc.whyBody.split("\n\n").map((para, i) => {
                const bold = para.startsWith("Instead") || para.startsWith("That turns");
                return (
                  <p key={i} className={`stagger-child text-[15px] leading-[1.75] ${bold ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {para}
                  </p>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* ── HOW IT WORKS ── */}
        {lc.showHowItWorks && (
          <Reveal className="flex flex-col py-18" tinted>
            <SectionHead title={lc.howTitle} />
            <div className="flex flex-col gap-0 stagger-wrap">
              {lc.howSteps.map((step, i) => (
                <div key={i} className="stagger-child flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-primary-foreground" style={{
                      background: "linear-gradient(135deg, #534AB7, #6C63FF)",
                      boxShadow: "0 6px 20px rgba(83, 74, 183, 0.3)",
                    }}>
                      {i + 1}
                    </div>
                    {i < lc.howSteps.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent my-2" />
                    )}
                  </div>
                  <div className="pb-10">
                    <p className="font-bold text-foreground text-[15px]">{step.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed italic">{lc.howFooter}</p>
          </Reveal>
        )}

        {/* ── STATS ── */}
        <Reveal className="py-18">
          <div className="grid grid-cols-3 gap-3.5 stagger-wrap">
            {[
              { value: "3", label: "days to build" },
              { value: "4", label: "growth engines" },
              { value: "∞", label: "lead potential" },
            ].map((stat) => (
              <div key={stat.label} className="stagger-child card-float p-5 text-center">
                <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── WHO THIS IS FOR ── */}
        {lc.showWhoThisIsFor && (
          <Reveal className="flex flex-col py-18" tinted>
            <SectionHead title={lc.whoTitle} sub={lc.whoIntro} />
            <div className="flex flex-col gap-4 stagger-wrap">
              {[lc.whoB2b, lc.whoB2c].map((col, ci) => (
                <div key={ci} className="stagger-child card-float overflow-hidden">
                  <div className={`px-5 py-3.5 ${ci === 0 ? "bg-primary/5 border-b border-primary/8" : "bg-accent/5 border-b border-accent/8"}`}>
                    <p className={`font-bold text-sm ${ci === 0 ? "text-primary" : "text-accent"}`}>{col.title}</p>
                  </div>
                  <ul className="p-5 space-y-3">
                    {col.items.map((item, ii) => (
                      <li key={ii} className="text-[13px] text-muted-foreground flex gap-2.5">
                        <span className={`mt-0.5 ${ci === 0 ? "text-primary" : "text-accent"}`}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground text-center mt-5">{lc.whoFooter}</p>
            <div className="mt-5">
              <Cta text={lc.whoCtaText} section="whothisisfor" />
            </div>
          </Reveal>
        )}

        {/* ── SOCIAL PROOF ── */}
        {lc.showSocialProof && (
          <Reveal className="flex flex-col py-18">
            <SectionHead title={lc.socialProofTitle} />
            <ActivityFeed />
            {lc.socialProofMetric && (
              <p className="text-xs text-muted-foreground text-center mt-3">{lc.socialProofMetric}</p>
            )}
          </Reveal>
        )}

        {/* ── EXAMPLES ── */}
        {lc.showExamples && (
          <Reveal className="flex flex-col py-18" tinted>
            <SectionHead title={lc.examplesTitle} />
            <div className="grid grid-cols-1 gap-4 stagger-wrap">
              {lc.exampleCards.map((ex, i) => (
                <div key={i} className="stagger-child card-float p-5">
                  <div className="flex gap-2 mb-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      ex.audienceBadge === "B2B" ? "bg-primary/8 text-primary" : "bg-accent/8 text-accent"
                    }`}>{ex.audienceBadge}</span>
                    <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">{ex.styleBadge}</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{ex.challenge}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Entry quiz: <span className="italic">"{ex.quiz}"</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground text-center mt-5">{lc.examplesFooter}</p>
            <div className="mt-5">
              <Cta text={lc.examplesCtaText} section="examples" />
            </div>
          </Reveal>
        )}

        {/* ── URGENCY ── */}
        {lc.showUrgency && (
          <Reveal className="py-18">
            <div className="card-float overflow-hidden">
              <div className="bg-gradient-to-br from-accent/8 to-accent/3 p-6 flex flex-col gap-5">
                <p className="font-bold text-foreground text-lg leading-snug">
                  {lc.urgencyText}{" "}
                  <span className="text-accent">
                    {target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{lc.urgencyBody}</p>
                {lc.showCountdown && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { label: "Days", value: d },
                      { label: "Hours", value: h },
                      { label: "Mins", value: m },
                      { label: "Secs", value: s },
                    ].map((u) => (
                      <div key={u.label} className="flex flex-col items-center bg-background/80 backdrop-blur-sm rounded-xl py-4 border border-border/20">
                        <span className="text-2xl font-extrabold text-accent tabular-nums">
                          {String(u.value).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{u.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{lc.urgencyBonus}</p>
                <Cta text={lc.urgencyCtaText} section="urgency" />
              </div>
            </div>
          </Reveal>
        )}

        {/* ── FAQ ── */}
        {lc.showFaq && (
          <Reveal className="flex flex-col py-18" tinted>
            <SectionHead title={lc.faqTitle} />
            <Accordion type="single" collapsible className="w-full">
              {lc.faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/30">
                  <AccordionTrigger
                    className="text-[14px] text-left font-medium hover:no-underline py-5"
                    onClick={() => trackEvent("landing_faq_expanded", { index: i })}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        )}
      </div>

      {/* ══════ FINAL CTA ══════ */}
      <section className="relative px-6 py-20 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-foreground" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(83,74,183,0.18), transparent 55%)",
        }} />

        <div className="relative max-w-[380px]">
          <h2 className="text-xl font-extrabold text-background leading-tight mb-4">{lc.finalCtaTitle}</h2>
          <p className="text-[14px] text-background/55 leading-relaxed mb-10">{lc.finalCtaBody}</p>
          <Button
            asChild
            size="lg"
            className="cta-premium w-full rounded-[14px] text-base font-semibold h-14 text-primary-foreground"
            onClick={() => trackEvent("landing_cta_clicked", { section: "final" })}
          >
            <Link to="/assess">
              {lc.finalCtaButtonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-background/35 mt-5">{lc.finalCtaBelowText}</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
