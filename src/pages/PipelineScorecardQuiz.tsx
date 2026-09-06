import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

interface ScorecardQuestion {
  category: string;
  title: string;
  text: string;
  options: { value: "A" | "B" | "C"; label: string }[];
}

const QUESTIONS: ScorecardQuestion[] = [
  {
    category: "System Strategy",
    title: "Pipeline Automation",
    text: "Do you have an automated pipeline that brings in high-quality prospects without relying on your daily manual hustle?",
    options: [
      { value: "A", label: "Yes, I have a fully automated system that consistently generates and qualifies high-value leads on autopilot." },
      { value: "B", label: "I have some basic automations in place, but my system still requires constant manual oversight and daily intervention." },
      { value: "C", label: "No, I am trapped in the manual grind, chasing down every single lead through direct outreach and cold messaging." },
    ],
  },
  {
    category: "System Strategy",
    title: "Asset-Based Scaling",
    text: "Do you own evergreen assets that consistently generate new inquiries month after month without your direct daily oversight?",
    options: [
      { value: "A", label: "Yes, my business is built on high-converting, evergreen digital assets that work for me 24/7." },
      { value: "B", label: "I have a few passive assets (like blogs or videos), but they aren't actively systemized to drive new leads." },
      { value: "C", label: "No, my lead generation stops entirely the moment I step away from my laptop or take a day off." },
    ],
  },
  {
    category: "System Strategy",
    title: "Time-Independence",
    text: "Does your client acquisition completely freeze up unless you are personally putting in the hours to manage it?",
    options: [
      { value: "A", label: "No, my acquisition engine is fully systemized and runs independently of my personal calendar." },
      { value: "B", label: "I have some software or team support, but it still requires my active daily hours to prevent it from stalling." },
      { value: "C", label: "Yes, my entire lead generation process is tied directly to my personal hours and physical presence." },
    ],
  },
  {
    category: "Audience Trust",
    title: "Organic Platform Dependence",
    text: "If you stopped posting content or sending direct messages today, would your pipeline completely dry up?",
    options: [
      { value: "A", label: "No, my lead flow is insulated from algorithm shifts because I own my distribution assets (like an email list)." },
      { value: "B", label: "It would slow down heavily, though a few old referrals or legacy assets would keep a slow trickle alive." },
      { value: "C", label: "Yes, my lead pipeline would dry up instantly. I am 100% dependent on daily organic platform activity." },
    ],
  },
  {
    category: "Audience Trust",
    title: "Pre-Sold Credibility",
    text: "Do your prospects arrive already convinced of your expertise and ready to buy before you even hop on a call?",
    options: [
      { value: "A", label: "Yes, my authority assets do the pre-selling for me, so prospects arrive highly motivated and ready to sign up." },
      { value: "B", label: "They have some basic trust, but I still have to spend massive energetic effort handling objections on sales calls." },
      { value: "C", label: "No, I have to work incredibly hard to prove my credibility and build trust from scratch on every single call." },
    ],
  },
  {
    category: "Audience Trust",
    title: "Traffic Relevance & Segmentation",
    text: "Do you present the exact same generic free resource or opt-in to every single website visitor, regardless of their specific bottleneck?",
    options: [
      { value: "A", label: "No, my systems dynamically diagnose each visitor's specific bottleneck and deliver a highly customized solution." },
      { value: "B", label: "I have a few different free resources, but I manually guess which one to send to different prospects." },
      { value: "C", label: "Yes, everyone gets the exact same generic offer (like a standard PDF, newsletter, or 'book a call' pitch)." },
    ],
  },
  {
    category: "Conversion Rhythm",
    title: "Attribution & Data Clarity",
    text: "Can you trace exactly which marketing campaign, post, or asset is responsible for your best high-value clients?",
    options: [
      { value: "A", label: "Yes, I have total data clarity and can track the exact pathway and cost of acquiring our best clients." },
      { value: "B", label: "I have a vague, general idea of where they come from, but I cannot back it up with clean tracking data." },
      { value: "C", label: "No, I have no attribution tracking at all; my marketing strategy is built purely on gut feeling and guesswork." },
    ],
  },
  {
    category: "Conversion Rhythm",
    title: "The Automated Conversion Bridge",
    text: "The moment a prospect raises their hand, is there a clear, automated path that guides them directly to your high-ticket offer?",
    options: [
      { value: "A", label: "Yes, they enter an immediate, high-converting automated pathway that nurtures and moves them to our core offer." },
      { value: "B", label: "There is a loose follow-up process, but it requires heavy manual chasing and leads frequently go cold." },
      { value: "C", label: "No, once they download my freebie, they are left to cold-stall because I have no structured follow-up path." },
    ],
  },
  {
    category: "Conversion Rhythm",
    title: "Built-In Referral Virality",
    text: "Does your infrastructure have a built-in referral loop that automatically turns existing leads and buyers into new prospects?",
    options: [
      { value: "A", label: "Yes, our onboarding and results delivery automatically incentivize and track referrals on autopilot." },
      { value: "B", label: "I get occasional word-of-mouth referrals, but it is completely passive and un-systemized." },
      { value: "C", label: "No, I have to hunt down and secure every single new prospect through manual labor." },
    ],
  },
];

/**
 * Standalone, chrome-free 9-question scorecard quiz. One question at a time,
 * full-width answer cards, auto-advance on selection, back button, slim
 * progress indicator. On completion it saves the nine letters to
 * pipeline_scorecard_responses and navigates to the result page.
 */
const PipelineScorecardQuiz = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Pipeline Leverage Scorecard - Quiz";
    return () => {
      document.title = prev;
    };
  }, []);

  const question = QUESTIONS[current];
  const isLast = current === QUESTIONS.length - 1;

  const finish = async (finalAnswers: Record<number, string>) => {
    setSubmitting(true);
    const row = {
      q1: finalAnswers[0],
      q2: finalAnswers[1],
      q3: finalAnswers[2],
      q4: finalAnswers[3],
      q5: finalAnswers[4],
      q6: finalAnswers[5],
      q7: finalAnswers[6],
      q8: finalAnswers[7],
      q9: finalAnswers[8],
    };
    const { data, error } = await supabase
      .from("pipeline_scorecard_responses")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) {
      setSubmitting(false);
      return;
    }
    navigate(`/pipeline-scorecard/result?id=${data.id}`);
  };

  const handleAnswer = (value: string) => {
    if (selected !== null || submitting) return;
    setSelected(value);
    const updated = { ...answers, [current]: value };
    setAnswers(updated);
    window.setTimeout(() => {
      setSelected(null);
      if (isLast) {
        void finish(updated);
      } else {
        setCurrent((c) => c + 1);
      }
    }, 350);
  };

  const handleBack = () => {
    if (current === 0 || submitting) return;
    setSelected(null);
    setCurrent((c) => c - 1);
  };

  return (
    <>
      <SEO
        title="Pipeline Leverage Scorecard - Quiz"
        description="Answer nine quick questions to pinpoint the biggest bottleneck in your client acquisition pipeline."
        canonical="/pipeline-scorecard/quiz"
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8 sm:px-6 md:py-12">
          {/* Slim progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={current === 0 || submitting}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="text-sm font-semibold text-muted-foreground">
                Question {current + 1} of {QUESTIONS.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {submitting ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">Building your scorecard...</p>
            </div>
          ) : (
            <div key={current} className="flex flex-1 flex-col animate-fade-in">
              {/* Question */}
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                  {question.category}
                </p>
                <h1 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">
                  {question.title}
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  {question.text}
                </p>
              </div>

              {/* Full-width answer cards, one per row */}
              <div className="grid w-full grid-cols-1 gap-3">
                {question.options.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(opt.value)}
                      disabled={selected !== null}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left font-semibold transition-all active:scale-[0.99] ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-foreground hover:border-primary hover:bg-background"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PipelineScorecardQuiz;
