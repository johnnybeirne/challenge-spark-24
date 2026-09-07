import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import ScorecardAdvisorTeaser from "@/components/ScorecardAdvisorTeaser";


type Letter = "A" | "B" | "C";

interface ScorecardRow {
  id: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  q6: string | null;
  q7: string | null;
  q8: string | null;
  q9: string | null;
}

interface CategoryDef {
  key: "system" | "audience" | "conversion";
  label: string;
  questions: (keyof ScorecardRow)[];
}

const CATEGORIES: CategoryDef[] = [
  { key: "system", label: "System Strategy", questions: ["q1", "q2", "q3"] },
  { key: "audience", label: "Audience Trust", questions: ["q4", "q5", "q6"] },
  { key: "conversion", label: "Conversion Rhythm", questions: ["q7", "q8", "q9"] },
];

const POINTS: Record<Letter, number> = { A: 5, B: 3, C: 1 };

interface Tier {
  name: string;
  subtitle: string;
  description: string;
}

const TIERS: Record<CategoryDef["key"], Record<string, Tier>> = {
  system: {
    low: {
      name: "System Explorer",
      subtitle: "The Manual Operator",
      description:
        "Your business is heavily reliant on your physical daily hours. You are currently trapped in the \"time-for-money\" bottleneck. Your priority is to establish a basic evergreen asset to free up your calendar.",
    },
    mid: {
      name: "System Builder",
      subtitle: "The Semi-Systemized Owner",
      description:
        "You have successfully integrated some basic software tools, but they operate in isolation. You have automated tasks but not a unified pipeline, leading to constant operational leaks.",
    },
    high: {
      name: "System Achiever",
      subtitle: "The Leveraged Director",
      description:
        "You have achieved excellent time-leverage. Your pipeline is an independent business asset that operates beautifully without needing your daily manual hustle.",
    },
  },
  audience: {
    low: {
      name: "Audience Explorer",
      subtitle: "The Unseen Expert",
      description:
        "You are heavily dependent on rent-seeking social media algorithms. Because you present a generic offer to everyone, your authority is diluted. You must establish a personalized assessment mechanism.",
    },
    mid: {
      name: "Audience Builder",
      subtitle: "The Local Authority",
      description:
        "You have built a solid baseline of respect, but you are still forced to work incredibly hard to educate and pre-sell prospects on 1-on-1 calls. You lack scalable pre-selling content assets.",
    },
    high: {
      name: "Audience Achiever",
      subtitle: "The Trusted Category Leader",
      description:
        "Your audience views you as the definitive authority. Your prospects arrive fully pre-sold on your unique mechanism, completely eliminating the need to hard-sell on calls.",
    },
  },
  conversion: {
    low: {
      name: "Conversion Explorer",
      subtitle: "The Leaky Bucket",
      description:
        "You are flying blind. With no attribution tracking and no clear follow-up path, valuable prospects are dropping out of your world daily. You are spending time and money guessing what works.",
    },
    mid: {
      name: "Conversion Builder",
      subtitle: "The Passive Engine",
      description:
        "You have a functional sales path, but it is entirely passive. You lack the proactive automated conversion bridges and incentivized referral loops required to turn one customer into three.",
    },
    high: {
      name: "Conversion Achiever",
      subtitle: "The High-Velocity Funnel",
      description:
        "Your conversion metrics are world-class. You can trace every single dollar spent back to the exact client-acquisition source, and your built-in referral loops generate zero-cost viral growth.",
    },
  },
};

const tierFor = (score: number): "low" | "mid" | "high" => {
  if (score <= 5) return "low";
  if (score <= 11) return "mid";
  return "high";
};

const ACCENT: Record<"low" | "mid" | "high", { text: string; bar: string; ring: string }> = {
  low: {
    text: "text-rose-500 dark:text-rose-400",
    bar: "bg-rose-500",
    ring: "ring-rose-500/20",
  },
  mid: {
    text: "text-amber-500 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "ring-amber-500/20",
  },
  high: {
    text: "text-emerald-500 dark:text-emerald-400",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500/20",
  },
};

/**
 * requestAnimationFrame count-up from 0 to `target`, easing out (cubic).
 * Matches the pattern already used by src/pages/Results.tsx.
 */
const useCountUp = (
  target: number,
  play: boolean,
  duration: number,
  onDone: (() => void) | undefined,
): number => {
  const [val, setVal] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!play) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVal(target);
      onDoneRef.current?.();
      return;
    }
    const start = performance.now();
    let frameId = 0;
    let done = false;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        onDoneRef.current?.();
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [play, target, duration]);

  return val;
};

interface CategoryCardProps {
  cat: {
    key: CategoryDef["key"];
    label: string;
    score: number;
    tier: "low" | "mid" | "high";
    tierData: Tier;
  };
  index: number;
  isLast: boolean;
  onLastCountDone: () => void;
}

const FADE_MS = 400;
const COUNT_MS = 800;

/**
 * Reveals on scroll: each card stays hidden until it scrolls into view, then
 * fades in and runs its 0-to-final count-up. The first card is in view on load
 * so it plays immediately; the rest appear one at a time as the user scrolls.
 */
const CategoryCard = ({ cat, isLast, onLastCountDone }: CategoryCardProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [play, setPlay] = useState(false);
  const accent = ACCENT[cat.tier];
  const pct = Math.round((cat.score / 15) * 100);
  const animated = useCountUp(pct, play, COUNT_MS, isLast ? onLastCountDone : undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      setPlay(true);
      return;
    }
    // Reveal a card only when it scrolls into the upper half of the viewport,
    // so the three results unlock one at a time as the user scrolls down.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          window.setTimeout(() => setPlay(true), FADE_MS);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ${accent.ring} transition-all duration-[400ms] ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {cat.label}
          </p>
          <h2 className={`mt-1 text-2xl font-black tracking-tight ${accent.text}`}>
            {cat.tierData.name}
          </h2>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {cat.tierData.subtitle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`text-3xl font-black leading-none ${accent.text}`}>
            {animated}%
          </span>
        </div>
      </div>

      {/* Score bar — width driven by the count-up value */}
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-foreground/5 ring-1 ring-foreground/10"
        role="meter"
        aria-valuenow={play || !visible ? animated : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${cat.label} score`}
      >
        <div
          className={`h-full rounded-full ${accent.bar}`}
          style={{ width: `${animated}%` }}
        />
      </div>

      <p className="mt-4 text-[var(--body-size)] leading-7 text-muted-foreground">
        {cat.tierData.description}
      </p>
    </section>
  );
};

/**
 * Standalone, chrome-free result page for the Pipeline Leverage Scorecard.
 * Reads the `id` query param, fetches the matching row from
 * pipeline_scorecard_responses, computes three category scores, and shows
 * the tier name, subtitle, and description for each. A single CTA points to
 * the existing 3-Day Challenge signup route (/challenge/join) — the same route
 * the existing quiz's result page uses.
 *
 * Reveal sequence: each card stays hidden until it scrolls into view, then
 * fades in and runs its 0-to-final count-up of its percentage and progress
 * bar. The first card is in view on load so it plays immediately; the rest
 * appear one at a time as the user scrolls. The bridge section fades in
 * after the AI advisor teaser (shown after the final card's count-up) ends.
 */
const PipelineScorecardResult = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const { t } = useSiteContent("pipeline_scorecard_result");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ScorecardRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Scroll-based reveal: each card reveals itself when it scrolls into view.
  // The advisor teaser appears after the final card's count-up finishes.
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showBridge, setShowBridge] = useState(false);


  useEffect(() => {
    const prev = document.title;
    document.title = "Your Pipeline Leverage Scorecard Results";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("pipeline_scorecard_responses")
        .select("id, q1, q2, q3, q4, q5, q6, q7, q8, q9")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setRow(data as ScorecardRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const categoryResults = CATEGORIES.map((cat) => {
    const letters = cat.questions.map((q) => (row?.[q] ?? "C") as Letter);
    const score = letters.reduce((sum, l) => sum + (POINTS[l] ?? 0), 0);
    const tier = tierFor(score);
    return { ...cat, score, tier, tierData: TIERS[cat.key][tier] };
  });





  return (
    <>
      <SEO
        title="Your Pipeline Leverage Scorecard Results"
        description="Your personalised pipeline scorecard results across System Strategy, Audience Trust, and Conversion Rhythm."
        canonical="/pipeline-scorecard/result"
        noIndex
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10 sm:px-6 md:py-14">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">Loading your scorecard...</p>
            </div>
          ) : notFound || !row ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                Scorecard not found
              </p>
              <h1 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">
                We could not find your scorecard
              </h1>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                The link may be missing or invalid. Take the scorecard again to see your results.
              </p>
              <Button
                className="mt-2 h-12 gap-2 rounded-xl px-6 text-base font-black"
                onClick={() => navigate("/pipeline-scorecard")}
              >
                Start the scorecard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <section className="mb-10 animate-fade-in">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                  Your Pipeline Leverage Scorecard
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
                  Here is where your pipeline stands today
                </h1>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  Three categories, three quick reads. Each shows where you are right now and the
                  single biggest lever to pull next.
                </p>
              </section>

              {/* Category cards — revealed one at a time as the user scrolls.
                  A card only reveals once it scrolls into the upper half of the
                  viewport, so they unlock one-by-one without forced spacing. */}
              <div className="flex flex-col gap-6">
                {categoryResults.map((cat, index) => (
                  <CategoryCard
                    key={cat.key}
                    cat={cat}
                    index={index}
                    isLast={index === CATEGORIES.length - 1}
                    onLastCountDone={() => setShowAdvisor(true)}
                  />
                ))}
              </div>

              {/* AI advisor teaser — same advisor identity and edge function as the main
                  quiz result page. Reveals after the third card's count-up; the bridge
                  below appears only after its streamed response completes. */}
              {showAdvisor && (
                <ScorecardAdvisorTeaser
                  categories={categoryResults.map((c) => ({
                    label: c.label,
                    score: c.score,
                    tier: c.tier,
                    tierName: c.tierData.name,
                    tierSubtitle: c.tierData.subtitle,
                  }))}
                  overallTier={tierFor(
                    Math.round(
                      categoryResults.reduce((s, c) => s + c.score, 0) / categoryResults.length,
                    ),
                  )}
                  onStreamComplete={() => setShowBridge(true)}
                />
              )}


              {/* Bridge CTA — fades in after the final card's count-up.
                  Copy is owner-editable via site_content("pipeline_scorecard_result");
                  default destination is the same signup route the existing quiz result page uses. */}
              <section
                className={`mt-10 transition-all duration-[600ms] ease-out ${
                  showBridge ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px] pointer-events-none"
                }`}
              >
                <h2 className="mb-4 text-center text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
                  {t("bridge.headline", "Ready to build the system your scorecard points to?")}
                </h2>
                <Button
                  onClick={() => navigate(t("bridge.cta_route", "/challenge/join"))}
                  className="h-[72px] w-full gap-3 rounded-2xl text-[length:var(--h2-size)] font-black tracking-tight !text-white shadow-xl shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/40"
                >
                  {t("bridge.cta_label", "Join the 3-Day Challenge")}
                  <ArrowRight className="h-6 w-6 text-white" />
                </Button>
                <p className="mt-4 text-center text-[var(--body-size)] font-medium text-muted-foreground">
                  {t(
                    "bridge.body",
                    "The 3-Day Challenge builds the exact evergreen system your scorecard points to.",
                  )}
                </p>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default PipelineScorecardResult;
