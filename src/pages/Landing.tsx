import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, Link2, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";

/* ── Intersection Observer for reveal animations ── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Countdown helper ── */
function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

/* ── Scroll depth tracker ── */
function useScrollDepth() {
  const fired = useRef(new Set<number>());
  useEffect(() => {
    const handler = () => {
      const pct = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      for (const t of [25, 50, 75, 100]) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t);
          trackEvent("landing_scroll_depth", { depth: t });
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
}

/* ── Feature icons mapping ── */
const featureIcons = [
  <Target className="w-5 h-5" />,
  <Zap className="w-5 h-5" />,
  <Link2 className="w-5 h-5" />,
  <Mail className="w-5 h-5" />,
];

/* ── Premium CTA ── */
const CtaButton = ({
  text,
  section,
  to = "/assess",
}: {
  text: string;
  section: string;
  to?: string;
}) => (
  <Button
    asChild
    size="lg"
    className="cta-premium w-full rounded-[14px] text-base font-semibold h-14 bg-primary text-primary-foreground transition-all duration-200"
    onClick={() => trackEvent("landing_cta_clicked", { section })}
  >
    <Link to={to}>
      {text}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  </Button>
);

/* ── Section wrapper with reveal animation ── */
const RevealSection = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useReveal();
  return (
    <section ref={ref} className={`reveal-section ${className}`}>
      {children}
    </section>
  );
};

/* ── Highlighted text helper ── */
const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="text-primary font-semibold">{children}</span>
);

/* ── Landing Page ── */
const Landing = () => {
  const { config } = useSiteConfig();
  const lc = config.landing;

  useEffect(() => {
    trackEvent("landing_viewed");
  }, []);

  useScrollDepth();

  const nextMonday = getNextMonday();
  const target = lc.countdownTarget ? new Date(lc.countdownTarget) : nextMonday;
  const { d, h, m, s } = useCountdown(target);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* ─── Subtle radial background gradient ─── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(248 39% 50% / 0.04), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, hsl(15 67% 52% / 0.03), transparent 50%)",
        }}
      />

      {/* ─── HERO ─── */}
      <section className="relative px-6 pt-16 pb-14 overflow-hidden">
        {/* Animated glow */}
        <div className="hero-glow" />

        <div className="relative flex flex-col items-center text-center max-w-[480px] mx-auto">
          <h1 className="text-[1.85rem] leading-[1.12] font-extrabold tracking-tight text-foreground mb-5">
            {lc.heroHeadline}
          </h1>
          <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed max-w-[400px]">
            {lc.heroSubheadline}
          </p>
          <p className="text-sm text-foreground/50 italic mb-8">
            {lc.heroSupportingLine}
          </p>
          <div className="w-full max-w-[360px]">
            <CtaButton text={lc.primaryCtaText} section="hero" />
          </div>
          <p className="text-xs text-muted-foreground mt-3.5 tracking-wide">
            {lc.heroBelowCtaText}
          </p>
          <p className="text-xs text-primary font-bold mt-2">{lc.heroMicroProof}</p>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <div className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-5 px-6">
        <p className="text-[11px] text-muted-foreground text-center uppercase tracking-[0.15em] font-medium">
          {lc.socialProofMetric}
        </p>
      </div>

      <div className="px-6 flex flex-col gap-20 py-16 max-w-[480px] mx-auto w-full">
        {/* ─── FEATURES ─── */}
        {lc.showFeatures && (
          <RevealSection className="flex flex-col gap-6">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.featuresTitle}
            </h2>
            <div className="flex flex-col gap-3.5">
              {lc.featureCards.map((card, i) => (
                <div
                  key={i}
                  className="stagger-child card-premium bg-card p-5 flex gap-4"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/8 text-primary flex items-center justify-center">
                    {featureIcons[i] || <span className="text-lg">{card.icon}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[15px] mb-1">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 rounded-2xl p-4 border border-primary/8">
              {lc.featuresFooter}
            </p>
            <CtaButton text={lc.featuresCtaText} section="features" />
          </RevealSection>
        )}

        {/* ─── WHY THIS WORKS ─── */}
        {lc.showWhyThisWorks && (
          <RevealSection className="flex flex-col gap-5">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.whyTitle}
            </h2>
            <div className="space-y-3.5">
              {lc.whyBody.split("\n\n").map((para, i) => {
                const isHighlight = para.startsWith("Instead") || para.startsWith("That turns");
                return (
                  <p
                    key={i}
                    className={`stagger-child text-[15px] leading-[1.7] ${
                      isHighlight
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          </RevealSection>
        )}

        {/* ─── HOW IT WORKS ─── */}
        {lc.showHowItWorks && (
          <RevealSection className="flex flex-col gap-7">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.howTitle}
            </h2>
            <div className="flex flex-col gap-0">
              {lc.howSteps.map((step, i) => (
                <div key={i} className="stagger-child flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                      {i + 1}
                    </div>
                    {i < lc.howSteps.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent my-1.5" />
                    )}
                  </div>
                  <div className="pb-10">
                    <p className="font-bold text-foreground text-[15px]">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{lc.howFooter}</p>
          </RevealSection>
        )}

        {/* ─── STATS BAR ─── */}
        <RevealSection>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "3", label: "days to build" },
              { value: "4", label: "growth engines" },
              { value: "∞", label: "lead potential" },
            ].map((stat, i) => (
              <div key={stat.label} className="stagger-child card-premium bg-card p-5 text-center">
                <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* ─── WHO THIS IS FOR ─── */}
        {lc.showWhoThisIsFor && (
          <RevealSection className="flex flex-col gap-6">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.whoTitle}
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed">{lc.whoIntro}</p>
            <div className="flex flex-col gap-4">
              {[lc.whoB2b, lc.whoB2c].map((col, ci) => (
                <div key={ci} className="stagger-child card-premium bg-card overflow-hidden">
                  <div className={`px-5 py-3 ${ci === 0 ? "bg-primary/5 border-b border-primary/8" : "bg-accent/5 border-b border-accent/8"}`}>
                    <p className={`font-bold text-sm ${ci === 0 ? "text-primary" : "text-accent"}`}>{col.title}</p>
                  </div>
                  <ul className="p-5 space-y-3">
                    {col.items.map((item, ii) => (
                      <li key={ii} className="text-sm text-muted-foreground flex gap-2.5">
                        <span className={`mt-0.5 ${ci === 0 ? "text-primary" : "text-accent"}`}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">{lc.whoFooter}</p>
            <CtaButton text={lc.whoCtaText} section="whothisisfor" />
          </RevealSection>
        )}

        {/* ─── SOCIAL PROOF ─── */}
        {lc.showSocialProof && (
          <RevealSection className="flex flex-col gap-5">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.socialProofTitle}
            </h2>
            <ActivityFeed />
            {lc.socialProofMetric && (
              <p className="text-xs text-muted-foreground text-center">{lc.socialProofMetric}</p>
            )}
          </RevealSection>
        )}

        {/* ─── EXAMPLES ─── */}
        {lc.showExamples && (
          <RevealSection className="flex flex-col gap-6">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.examplesTitle}
            </h2>
            <div className="grid grid-cols-1 gap-3.5">
              {lc.exampleCards.map((ex, i) => (
                <div key={i} className="stagger-child card-premium bg-card p-5">
                  <div className="flex gap-2 mb-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      ex.audienceBadge === "B2B"
                        ? "bg-primary/8 text-primary"
                        : "bg-accent/8 text-accent"
                    }`}>
                      {ex.audienceBadge}
                    </span>
                    <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                      {ex.styleBadge}
                    </span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{ex.challenge}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Entry quiz: <span className="italic">"{ex.quiz}"</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">{lc.examplesFooter}</p>
            <CtaButton text={lc.examplesCtaText} section="examples" />
          </RevealSection>
        )}

        {/* ─── URGENCY ─── */}
        {lc.showUrgency && (
          <RevealSection>
            <div className="card-premium overflow-hidden">
              <div className="bg-gradient-to-br from-accent/8 to-accent/3 p-6 flex flex-col gap-5">
                <p className="font-bold text-foreground text-lg leading-snug">
                  {lc.urgencyText}{" "}
                  <span className="text-accent">
                    {target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{lc.urgencyBody}</p>
                {lc.showCountdown && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { label: "Days", value: d },
                      { label: "Hours", value: h },
                      { label: "Mins", value: m },
                      { label: "Secs", value: s },
                    ].map((u) => (
                      <div key={u.label} className="flex flex-col items-center bg-background/80 backdrop-blur-sm rounded-xl py-3.5 border border-border/30">
                        <span className="text-2xl font-extrabold text-accent tabular-nums">
                          {String(u.value).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{u.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{lc.urgencyBonus}</p>
                <CtaButton text={lc.urgencyCtaText} section="urgency" />
              </div>
            </div>
          </RevealSection>
        )}

        {/* ─── FAQ ─── */}
        {lc.showFaq && (
          <RevealSection className="flex flex-col gap-5">
            <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
              {lc.faqTitle}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {lc.faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
                  <AccordionTrigger
                    className="text-sm text-left font-medium hover:no-underline py-4.5"
                    onClick={() => trackEvent("landing_faq_expanded", { index: i })}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealSection>
        )}
      </div>

      {/* ─── FINAL CTA ─── */}
      <section className="relative px-6 py-16 flex flex-col gap-6 items-center text-center overflow-hidden">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-foreground" />
        {/* Subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 100%, hsl(248 39% 50% / 0.15), transparent 60%)",
          }}
        />

        <div className="relative max-w-[400px]">
          <h2 className="text-xl font-extrabold text-background leading-tight mb-4">{lc.finalCtaTitle}</h2>
          <p className="text-sm text-background/60 leading-relaxed mb-8">{lc.finalCtaBody}</p>
          <Button
            asChild
            size="lg"
            className="cta-premium w-full rounded-[14px] text-base font-semibold h-14 bg-primary text-primary-foreground transition-all duration-200"
            onClick={() => trackEvent("landing_cta_clicked", { section: "final" })}
          >
            <Link to="/assess">
              {lc.finalCtaButtonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-background/40 mt-4">{lc.finalCtaBelowText}</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
