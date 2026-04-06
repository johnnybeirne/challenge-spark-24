import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, Link2, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { trackEvent } from "@/lib/analytics";

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

/* ── CTA helper ── */
const CtaButton = ({
  text,
  section,
  to = "/assess",
  variant = "default",
}: {
  text: string;
  section: string;
  to?: string;
  variant?: "default" | "outline";
}) => (
  <Button
    asChild
    size="lg"
    variant={variant}
    className={`w-full rounded-xl text-base font-semibold h-[52px] transition-all duration-200 ${
      variant === "default"
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01]"
        : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    }`}
    onClick={() => trackEvent("landing_cta_clicked", { section })}
  >
    <Link to={to}>
      {text}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  </Button>
);

/* ── Section heading ── */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[1.35rem] leading-tight font-extrabold tracking-tight text-foreground">
    {children}
  </h2>
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
    <div className="flex flex-col min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative px-5 pt-12 pb-10 overflow-hidden">
        {/* Gradient background inspired by Semrush hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="relative flex flex-col">
          <h1 className="text-[1.85rem] leading-[1.15] font-extrabold tracking-tight text-foreground mb-4">
            {lc.heroHeadline}
          </h1>
          <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed">
            {lc.heroSubheadline}
          </p>
          <p className="text-sm text-foreground/60 italic mb-6">
            {lc.heroSupportingLine}
          </p>
          <CtaButton text={lc.primaryCtaText} section="hero" />
          <p className="text-xs text-muted-foreground text-center mt-3">
            {lc.heroBelowCtaText}
          </p>
        </div>
      </section>

      {/* ─── TRUST BAR (Semrush-style logo strip) ─── */}
      <section className="border-y border-border bg-card/50 py-4 px-5">
        <p className="text-[11px] text-muted-foreground text-center mb-3 uppercase tracking-widest font-medium">
          {lc.socialProofMetric}
        </p>
        <p className="text-xs text-center text-primary font-bold">{lc.heroMicroProof}</p>
      </section>

      <div className="px-5 flex flex-col gap-16 py-12">
        {/* ─── FEATURES ─── */}
        {lc.showFeatures && (
          <section className="flex flex-col gap-5">
            <SectionHeading>{lc.featuresTitle}</SectionHeading>
            <div className="flex flex-col gap-3">
              {lc.featureCards.map((card, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 flex gap-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {featureIcons[i] || <span className="text-lg">{card.icon}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[15px] mb-1">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 rounded-lg p-4 border border-primary/10">
              {lc.featuresFooter}
            </p>
            <CtaButton text={lc.featuresCtaText} section="features" />
          </section>
        )}

        {/* ─── WHY THIS WORKS ─── */}
        {lc.showWhyThisWorks && (
          <section className="flex flex-col gap-4">
            <SectionHeading>{lc.whyTitle}</SectionHeading>
            <div className="space-y-3">
              {lc.whyBody.split("\n\n").map((para, i) => {
                // Bold the key lines that start "Instead" or "That turns"
                const isHighlight = para.startsWith("Instead") || para.startsWith("That turns");
                return (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
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
          </section>
        )}

        {/* ─── HOW IT WORKS ─── */}
        {lc.showHowItWorks && (
          <section className="flex flex-col gap-6">
            <SectionHeading>{lc.howTitle}</SectionHeading>
            <div className="flex flex-col gap-0">
              {lc.howSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  {/* Vertical connector line */}
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20">
                      {i + 1}
                    </div>
                    {i < lc.howSteps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-primary/20 my-1" />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className="font-bold text-foreground text-[15px]">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{lc.howFooter}</p>
          </section>
        )}

        {/* ─── STATS BAR (Semrush-inspired) ─── */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { value: "3", label: "days to build" },
            { value: "4", label: "growth engines" },
            { value: "∞", label: "lead potential" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* ─── WHO THIS IS FOR ─── */}
        {lc.showWhoThisIsFor && (
          <section className="flex flex-col gap-5">
            <SectionHeading>{lc.whoTitle}</SectionHeading>
            <p className="text-sm text-muted-foreground leading-relaxed">{lc.whoIntro}</p>
            <div className="flex flex-col gap-4">
              {[lc.whoB2b, lc.whoB2c].map((col, ci) => (
                <div key={ci} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className={`px-4 py-2.5 ${ci === 0 ? "bg-primary/5 border-b border-primary/10" : "bg-accent/5 border-b border-accent/10"}`}>
                    <p className={`font-bold text-sm ${ci === 0 ? "text-primary" : "text-accent"}`}>{col.title}</p>
                  </div>
                  <ul className="p-4 space-y-2.5">
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
          </section>
        )}

        {/* ─── SOCIAL PROOF ─── */}
        {lc.showSocialProof && (
          <section className="flex flex-col gap-4">
            <SectionHeading>{lc.socialProofTitle}</SectionHeading>
            <SocialProofTicker items={lc.socialProofItems} speed={lc.socialProofRotateSpeed} />
          </section>
        )}

        {/* ─── EXAMPLES ─── */}
        {lc.showExamples && (
          <section className="flex flex-col gap-5">
            <SectionHeading>{lc.examplesTitle}</SectionHeading>
            <div className="grid grid-cols-1 gap-3">
              {lc.exampleCards.map((ex, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex gap-2 mb-2.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      ex.audienceBadge === "B2B"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}>
                      {ex.audienceBadge}
                    </span>
                    <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                      {ex.styleBadge}
                    </span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{ex.challenge}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Entry quiz: <span className="italic">"{ex.quiz}"</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">{lc.examplesFooter}</p>
            <CtaButton text={lc.examplesCtaText} section="examples" />
          </section>
        )}

        {/* ─── URGENCY ─── */}
        {lc.showUrgency && (
          <section className="rounded-xl overflow-hidden border border-accent/20">
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-5 flex flex-col gap-4">
              <p className="font-bold text-foreground text-lg">
                {lc.urgencyText}{" "}
                <span className="text-accent">
                  {target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{lc.urgencyBody}</p>
              {lc.showCountdown && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Days", value: d },
                    { label: "Hours", value: h },
                    { label: "Mins", value: m },
                    { label: "Secs", value: s },
                  ].map((u) => (
                    <div key={u.label} className="flex flex-col items-center bg-background/80 backdrop-blur rounded-lg py-3 border border-border/50">
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
          </section>
        )}

        {/* ─── FAQ ─── */}
        {lc.showFaq && (
          <section className="flex flex-col gap-4">
            <SectionHeading>{lc.faqTitle}</SectionHeading>
            <Accordion type="single" collapsible className="w-full">
              {lc.faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger
                    className="text-sm text-left font-medium hover:no-underline py-4"
                    onClick={() => trackEvent("landing_faq_expanded", { index: i })}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </div>

      {/* ─── FINAL CTA (Semrush-style dark block) ─── */}
      <section className="bg-foreground px-5 py-10 flex flex-col gap-5 items-center text-center">
        <h2 className="text-xl font-extrabold text-background leading-tight">{lc.finalCtaTitle}</h2>
        <p className="text-sm text-background/70 leading-relaxed max-w-sm">{lc.finalCtaBody}</p>
        <Button
          asChild
          size="lg"
          className="w-full max-w-sm rounded-xl text-base font-semibold h-[52px] bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.01] transition-all"
          onClick={() => trackEvent("landing_cta_clicked", { section: "final" })}
        >
          <Link to="/assess">
            {lc.finalCtaButtonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="text-xs text-background/50">{lc.finalCtaBelowText}</p>
      </section>
    </div>
  );
};

/* ── Social proof ticker ── */
function SocialProofTicker({ items, speed }: { items: { name: string; action: string }[]; speed: number }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 300);
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [items.length, speed]);

  if (items.length === 0) return null;
  const item = items[idx];

  return (
    <div className="bg-card border border-border rounded-xl p-4 min-h-[60px] flex items-center">
      <div className="flex items-center gap-3 w-full">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <p
          className={`text-sm text-foreground transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="font-bold">{item.name}</span>{" "}
          <span className="text-muted-foreground">{item.action}</span>
        </p>
      </div>
    </div>
  );
}

export default Landing;
