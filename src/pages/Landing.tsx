import { useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, HelpCircle, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { setEntryIntent, type EntryIntent } from "@/lib/entryIntent";
import { useSiteContent, type SiteContentMap } from "@/hooks/useSiteContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import frustratedEntrepreneurLeads from "@/assets/frustrated-entrepreneur-leads.jpg";


export type LandingVariant = "default" | "free_training";

interface LandingProps {
  variant?: LandingVariant;
  /** Optional override for the start CTA. When provided, used instead of navigating to /assess. */
  onStart?: (section: string) => void;
}

const PageSection = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const SectionHeader = ({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) => (
  <div className="mx-auto max-w-3xl text-center">
    {eyebrow && <p className="text-sm font-black text-primary">{eyebrow}</p>}
    <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">{title}</h2>
    {body && <p className="mt-5 text-lg leading-8 text-muted-foreground">{body}</p>}
  </div>
);

/** Collect ordered values for keys matching `section.item_N` (sorted by N). */
function collectItems(map: SiteContentMap, section: string): string[] {
  const prefix = `${section}.item_`;
  const found: Array<{ n: number; v: string }> = [];
  for (const k of Object.keys(map)) {
    if (!k.startsWith(prefix)) continue;
    const n = Number(k.slice(prefix.length));
    if (!Number.isFinite(n)) continue;
    const v = map[k];
    if (typeof v === "string" && v.trim()) found.push({ n, v });
  }
  return found.sort((a, b) => a.n - b.n).map((x) => x.v);
}

const Landing = ({ variant = "default", onStart }: LandingProps) => {
  const navigate = useNavigate();
  const { t, map } = useSiteContent("landing");
  const entryIntent: EntryIntent | null = variant === "free_training" ? "free_training" : null;
  const funnel = variant === "free_training" ? "free_training" : "default";

  useEffect(() => {
    if (entryIntent) setEntryIntent(entryIntent);
    trackEvent("landing_viewed", { funnel, variant });
  }, [entryIntent, funnel, variant]);

  const startQuiz = (section: string) => {
    if (entryIntent) setEntryIntent(entryIntent);
    trackEvent("landing_cta_clicked", { section, funnel, variant, entryIntent });
    if (variant === "free_training") {
      trackEvent("assessment_started" as any, { entry: "free_training", section });
    }
    if (onStart) {
      onStart(section);
      return;
    }
    navigate("/assessment");
  };

  return (
    <>
      <SEO title="AI Challenge for More Leads" description="Answer 9 quick questions and get a personalised lead flow diagnosis with a recommended next step." canonical="/" />
      <main className="min-h-screen bg-background pb-24 text-foreground">
        <div id="hero" style={{ scrollMarginTop: 24 }}><HeroSection t={t} onStart={() => startQuiz("hero")} /></div>
        <div id="problem" style={{ scrollMarginTop: 24 }}><ProblemSection t={t} map={map} /></div>
        <div id="reveal" style={{ scrollMarginTop: 24 }}><RevealSection t={t} map={map} /></div>
        <div id="score" style={{ scrollMarginTop: 24 }}><ScorePreview t={t} map={map} /></div>
        <div id="benefits" style={{ scrollMarginTop: 24 }}><BenefitsSection t={t} map={map} /></div>
        <div id="authority" style={{ scrollMarginTop: 24 }}><AuthoritySection t={t} /></div>
        <div id="faq" style={{ scrollMarginTop: 24 }}><FaqSection t={t} map={map} /></div>
        <div id="cta" style={{ scrollMarginTop: 24 }}><CTASection t={t} onStart={() => startQuiz("bottom")} /></div>
        <StickyQuizButton t={t} onStart={() => startQuiz("sticky")} />
      </main>
    </>

  );
};

type T = (sectionDotKey: string, fallback?: string) => string;

const StickyQuizButton = ({ t, onStart }: { t: T; onStart: () => void }) => (
  <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-5 py-3 shadow-[0_-10px_30px_hsl(var(--foreground)/0.06)] backdrop-blur sm:px-6">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
      <p className="text-center text-sm font-semibold text-muted-foreground sm:text-left">
        {t("sticky.tagline", "Ready to find the gap in your lead flow?")}
      </p>
      <Button className="h-12 w-full max-w-xs gap-2 rounded-xl px-7 text-sm font-black shadow-lg shadow-primary/20 sm:w-auto sm:shrink-0" onClick={onStart}>
        {t("sticky.button", "Start the quiz")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const HeroSection = ({ t, onStart }: { t: T; onStart: () => void }) => (
  <section className="px-5 py-8 sm:px-6 md:py-12 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
      <div className="text-center lg:text-left">
        <p className="mx-auto max-w-2xl text-base font-black leading-6 text-primary lg:mx-0">
          {t("hero.eyebrow", "Built for coaches, consultants, and authors who want more leads")}
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
          {t("hero.headline", "Find out why your leads are inconsistent")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
          {t("hero.subhead", "Answer nine quick questions and get a recommended strategy based on your answers. Instantly")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Button className="h-14 w-full max-w-sm gap-2 rounded-xl px-8 text-base font-black shadow-lg shadow-primary/20 sm:w-auto" onClick={onStart}>
            {t("hero.cta_label", "Start the quiz")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium text-muted-foreground">{t("hero.cta_note", "No signup required to get your diagnosis.")}</p>
        </div>
      </div>

      <div className="relative">
        <img
          src={frustratedEntrepreneurLeads}
          alt="Frustrated entrepreneur trying to understand where leads are coming from"
          width={1280}
          height={960}
          fetchPriority="high"
          className="aspect-[4/3] w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-foreground/10 lg:aspect-[5/6]"
        />
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <p className="text-xs font-black text-primary">{t("hero.image_overlay_eyebrow", "The real question")}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{t("hero.image_overlay_text", "Is your lead flow inconsistent because of attention, trust, conversion, or follow-up?")}</p>
        </div>
      </div>
    </div>
  </section>
);

const ProblemSection = ({ t, map }: { t: T; map: SiteContentMap }) => {
  const items = collectItems(map, "problem");
  return (
    <PageSection className="border-y border-border bg-card/55">
      <SectionHeader
        eyebrow={t("problem.eyebrow", "The problem")}
        title={t("problem.title", "Lead flow should not feel like guesswork")}
        body={t("problem.body", "When leads are inconsistent, most people try to do more. The better move is to diagnose what is actually missing.")}
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((problem) => (
          <div key={problem} className="rounded-xl border border-border bg-background p-6 shadow-sm transition-transform hover:-translate-y-1">
            <HelpCircle className="h-6 w-6 text-primary" />
            <p className="mt-5 font-semibold leading-7 text-foreground">{problem}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
};

const RevealSection = ({ t, map }: { t: T; map: SiteContentMap }) => {
  const items = collectItems(map, "reveal");
  return (
    <PageSection>
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-black text-primary">{t("reveal.eyebrow", "What the quiz reveals")}</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">{t("reveal.title", "Your inconsistency usually has one primary cause")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
              <Search className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <p className="font-semibold leading-7 text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </PageSection>
  );
};

const ScorePreview = ({ t, map }: { t: T; map: SiteContentMap }) => {
  const items = collectItems(map, "score");
  const pctRaw = t("score.percent", "76").replace(/[^0-9]/g, "");
  const pct = Math.max(0, Math.min(100, Number(pctRaw) || 76));
  return (
    <PageSection className="border-y border-border bg-card/55">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div
          className="mx-auto flex size-64 items-center justify-center rounded-full p-6 [animation:donut-fill_1.4s_ease-out_both] lg:mx-0"
          style={{ background: `conic-gradient(hsl(var(--success)) 0 ${pct}%, hsl(var(--muted)) ${pct}% 100%)` }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
            <span className="text-5xl font-black leading-none text-foreground">{pct}%</span>
            <span className="mt-3 max-w-[10rem] text-sm font-black leading-5 text-muted-foreground">{t("score.percent_label", "System readiness")}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-primary">{t("score.eyebrow", "Your result")}</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">{t("score.title", "Get a clear diagnosis, then a recommended strategy")}</h2>
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                <p className="font-semibold leading-7 text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  );
};

const BenefitsSection = ({ t, map }: { t: T; map: SiteContentMap }) => {
  const items = collectItems(map, "benefits");
  return (
    <PageSection className="border-y border-border bg-card/55">
      <SectionHeader
        eyebrow={t("benefits.eyebrow", "Why take it")}
        title={t("benefits.title", "Know what to fix before you spend more effort")}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((benefit) => (
          <div key={benefit} className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="mt-4 font-semibold leading-7 text-foreground">{benefit}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
};

const AuthoritySection = ({ t }: { t: T }) => (
  <PageSection>
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-7 text-center shadow-sm md:p-10">
      <Eye className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-5 text-2xl font-black leading-tight text-foreground sm:text-3xl">{t("authority.title", "Built for people who need leads, not another theory")}</h2>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{t("authority.body", "The quiz is designed for founders, creators, consultants, and experts who want to understand what is making their lead flow unpredictable.")}</p>
    </div>
  </PageSection>
);

const CTASection = ({ t, onStart }: { t: T; onStart: () => void }) => (
  <PageSection className="border-t border-border">
    <div className="mx-auto max-w-3xl text-center">
      <TrendingUp className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">{t("cta.title", "Find the gap in your lead flow")}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{t("cta.body", "Start with the quiz, get your diagnosis, then move into the next step with clarity.")}</p>
      <Button className="mt-8 h-14 gap-2 rounded-xl px-8 text-base font-black shadow-lg shadow-primary/20" onClick={onStart}>
        {t("cta.button", "Start the quiz")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </PageSection>
);

const FaqSection = ({ t, map }: { t: T; map: SiteContentMap }) => {
  const items = useMemo(() => {
    const indices = new Set<string>();
    for (const k of Object.keys(map)) {
      const m = k.match(/^faq\.item_(\d+)_[qa]$/);
      if (m) indices.add(m[1]);
    }
    return Array.from(indices)
      .sort((a, b) => Number(a) - Number(b))
      .map((i) => ({
        i,
        q: t(`faq.item_${i}_q`),
        a: t(`faq.item_${i}_a`),
      }))
      .filter((x) => x.q.trim() || x.a.trim());
  }, [map, t]);

  if (items.length === 0) return null;

  return (
    <PageSection className="border-t border-border bg-card/55">
      <SectionHeader eyebrow="FAQ" title={t("faq.title", "Frequently asked questions")} />
      <div className="mx-auto mt-10 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item) => (
            <AccordionItem
              key={item.i}
              value={item.i}
              className="rounded-xl border border-border bg-background px-5 shadow-sm"
            >
              <AccordionTrigger className="py-5 text-left text-base font-black text-foreground hover:no-underline sm:text-lg">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-7 text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PageSection>
  );
};

export default Landing;
