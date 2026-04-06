import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
    className={`w-full rounded-xl text-base font-semibold h-[52px] ${
      variant === "default" ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    }`}
    onClick={() => trackEvent("landing_cta_clicked", { section })}
  >
    <Link to={to}>
      {text}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  </Button>
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
    <div className="flex flex-col min-h-screen px-5 py-10 gap-14">
      {/* ─── HERO ─── */}
      <section className="flex flex-col pt-6">
        <h1 className="text-[1.75rem] leading-tight font-extrabold text-foreground mb-4">
          {lc.heroHeadline}
        </h1>
        <p className="text-base text-muted-foreground mb-3 leading-relaxed">
          {lc.heroSubheadline}
        </p>
        <p className="text-sm text-foreground/70 italic mb-6">
          {lc.heroSupportingLine}
        </p>
        <CtaButton text={lc.primaryCtaText} section="hero" />
        <p className="text-xs text-muted-foreground text-center mt-3">
          {lc.heroBelowCtaText}
        </p>
        <p className="text-sm font-semibold text-primary text-center mt-4">
          {lc.heroMicroProof}
        </p>
      </section>

      {/* ─── FEATURES ─── */}
      {lc.showFeatures && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">{lc.featuresTitle}</h2>
          <div className="flex flex-col gap-3">
            {lc.featureCards.map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex gap-3">
                <span className="text-2xl leading-none mt-0.5">{card.icon}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{card.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{lc.featuresFooter}</p>
          <CtaButton text={lc.featuresCtaText} section="features" />
        </section>
      )}

      {/* ─── WHY THIS WORKS ─── */}
      {lc.showWhyThisWorks && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-foreground">{lc.whyTitle}</h2>
          {lc.whyBody.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {para}
            </p>
          ))}
        </section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      {lc.showHowItWorks && (
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-foreground">{lc.howTitle}</h2>
          <div className="flex flex-col gap-5">
            {lc.howSteps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{lc.howFooter}</p>
        </section>
      )}

      {/* ─── WHO THIS IS FOR ─── */}
      {lc.showWhoThisIsFor && (
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-foreground">{lc.whoTitle}</h2>
          <p className="text-sm text-muted-foreground">{lc.whoIntro}</p>
          <div className="flex flex-col gap-4">
            {[lc.whoB2b, lc.whoB2c].map((col, ci) => (
              <div key={ci} className="bg-card border border-border rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.items.map((item, ii) => (
                    <li key={ii} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{lc.whoFooter}</p>
          <CtaButton text={lc.whoCtaText} section="whothisisfor" />
        </section>
      )}

      {/* ─── SOCIAL PROOF ─── */}
      {lc.showSocialProof && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">{lc.socialProofTitle}</h2>
          <SocialProofTicker items={lc.socialProofItems} speed={lc.socialProofRotateSpeed} />
          <p className="text-sm font-semibold text-primary text-center">{lc.socialProofMetric}</p>
        </section>
      )}

      {/* ─── EXAMPLES ─── */}
      {lc.showExamples && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">{lc.examplesTitle}</h2>
          <div className="flex flex-col gap-3">
            {lc.exampleCards.map((ex, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {ex.audienceBadge}
                  </span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    {ex.styleBadge}
                  </span>
                </div>
                <p className="font-semibold text-foreground text-sm">{ex.challenge}</p>
                <p className="text-sm text-muted-foreground mt-1">Quiz: "{ex.quiz}"</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{lc.examplesFooter}</p>
          <CtaButton text={lc.examplesCtaText} section="examples" />
        </section>
      )}

      {/* ─── URGENCY ─── */}
      {lc.showUrgency && (
        <section className="bg-accent/5 border border-accent/20 rounded-xl p-5 flex flex-col gap-4">
          <p className="font-semibold text-foreground">
            {lc.urgencyText}{" "}
            <span className="text-accent">
              {target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{lc.urgencyBody}</p>
          {lc.showCountdown && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Days", value: d },
                { label: "Hours", value: h },
                { label: "Mins", value: m },
                { label: "Secs", value: s },
              ].map((u) => (
                <div key={u.label} className="flex flex-col items-center bg-background rounded-lg py-3">
                  <span className="text-2xl font-bold text-accent tabular-nums">
                    {String(u.value).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">{u.label}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground italic">{lc.urgencyBonus}</p>
          <CtaButton text={lc.urgencyCtaText} section="urgency" />
        </section>
      )}

      {/* ─── FAQ ─── */}
      {lc.showFaq && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">{lc.faqTitle}</h2>
          <Accordion type="single" collapsible className="w-full">
            {lc.faqItems.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger
                  className="text-sm text-left"
                  onClick={() => trackEvent("landing_faq_expanded", { index: i })}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* ─── FINAL CTA ─── */}
      <section className="bg-primary rounded-xl p-6 flex flex-col gap-4 text-primary-foreground">
        <h2 className="text-lg font-bold">{lc.finalCtaTitle}</h2>
        <p className="text-sm opacity-90">{lc.finalCtaBody}</p>
        <Button
          asChild
          size="lg"
          className="w-full rounded-xl text-base font-semibold h-[52px] bg-background text-foreground hover:bg-background/90"
          onClick={() => trackEvent("landing_cta_clicked", { section: "final" })}
        >
          <Link to="/assess">
            {lc.finalCtaButtonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="text-xs text-center opacity-80">{lc.finalCtaBelowText}</p>
      </section>

      <div className="h-4" />
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
    <div className="bg-card border border-border rounded-xl p-4 min-h-[56px] flex items-center">
      <p
        className={`text-sm text-foreground transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-semibold">{item.name}</span>{" "}
        <span className="text-muted-foreground">{item.action}</span>
      </p>
    </div>
  );
}

export default Landing;
