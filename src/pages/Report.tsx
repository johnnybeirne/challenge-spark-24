import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import ScoreRingCombined from "@/components/ScoreRingCombined";
import ReportVerifyBanner from "@/components/ReportVerifyBanner";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useReportPreview } from "@/lib/reportPreview";
import { formatFirstNameSurnameInitial, getInitials } from "@/lib/formatName";
import { supabase } from "@/integrations/supabase/client";
import {
  getDiagnosticResult,
  calculateCategoryScores,
  categoryQuestions,
  type AssessmentResult,
} from "@/lib/assessmentData";

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

// Same fallback advice as the results page breakdown; owner-editable via the
// Results Page Editor (site_content results/breakdown).
const breakdownDefaults: Record<string, Record<"low" | "mid" | "high", string>> = {
  system: {
    low: "Your lead flow depends on your own effort. Build a simple repeatable system and growth stops stalling when you do.",
    mid: "You have pieces of a system, but they do not connect. Tighten the steps and the results get more predictable.",
    high: "Your system is producing. The next step is structure that lets it scale without more of your time.",
  },
  audience: {
    low: "You are not reaching enough of the right people. Get clear on exactly who you help and where they already are.",
    mid: "Some of the right people are finding you. Sharpen the message so more of them recognise themselves in it.",
    high: "Your audience knows who you are. Keep showing up with a message that speaks to their exact problem.",
  },
  conversion: {
    low: "People show interest but do not take the next step. Give them one clear, low-pressure way to say yes.",
    mid: "Some leads convert, but too many stall. A structured follow-up turns maybes into paying clients.",
    high: "Your conversion works. A challenge-style experience can multiply it by letting results sell for you.",
  },
};

/**
 * Standalone report page for people who asked for their report by email
 * instead of joining the challenge. Shows their own quiz result (score ring,
 * category breakdown, diagnosis) from the assessment saved on their device,
 * plus the verify-code banner until they confirm the code from their email.
 */
const Report = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { user: authedUser } = useAuth();
  const { t: tContent } = useSiteContent("results");
  const reportPreview = useReportPreview();

  const showPreviewIdentity = !!reportPreview && !authedUser;
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);

  const score = assessment?.diagnosticScore ?? 0;
  const percentageScore = Math.max(9, Math.min(92, Math.round((score / 9) * 100)));

  const categoryAnswers = useMemo(
    () => (assessment?.answers as Record<string, string>) ?? {},
    [assessment],
  );
  const categoryScores = useMemo(() => calculateCategoryScores(categoryAnswers), [categoryAnswers]);
  const categoryHasAnswers = useMemo(
    () =>
      categoryScores.map((cs) =>
        categoryQuestions[cs.category].some((id) => categoryAnswers[id] != null),
      ),
    [categoryScores, categoryAnswers],
  );

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setRows([]);
          return;
        }
        setRows(
          data.map((r) => ({
            tier: r.tier,
            min_percent: r.min_percent,
            max_percent: r.max_percent,
            title: r.title,
            messages: Array.isArray(r.messages)
              ? r.messages.filter((m): m is string => typeof m === "string")
              : [],
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tierData = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    return rows.find((r) => percentageScore >= r.min_percent && percentageScore <= r.max_percent) ?? rows[0];
  }, [rows, percentageScore]);

  const paragraphs = useMemo<string[]>(() => {
    if (rows === null) return [];
    if (tierData) {
      return [tierData.title, ...tierData.messages].filter((s): s is string => !!s && s.trim().length > 0);
    }
    if (assessment?.diagnosticTitle) {
      return [assessment.diagnosticTitle, assessment.diagnosticMessage ?? ""].filter(
        (s) => s && s.trim().length > 0,
      );
    }
    const fallback = getDiagnosticResult(score);
    return [fallback.title, fallback.message].filter((s) => s && s.trim().length > 0);
  }, [rows, tierData, assessment, score]);

  const firstName = (reportPreview?.name ?? state.user?.name ?? "").split(" ")[0];

  if (!hasResult) {
    return (
      <>
        <SEO title="Your Report" description="Your personalised lead generation report." canonical="/report" />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-[var(--h1-size)] font-semibold text-foreground">
            {tContent("report_page.empty_title", "No quiz result found")}
          </h1>
          <p className="max-w-md text-[var(--body-size)] text-muted-foreground">
            {tContent(
              "report_page.empty_body",
              "Take the quiz first and your personalised report will appear here.",
            )}
          </p>
          <Button onClick={() => navigate("/assessment")} className="font-semibold">
            {tContent("report_page.empty_cta", "Take the quiz")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Your Report" description="Your personalised lead generation report." canonical="/report" />
      {showPreviewIdentity && (
        <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(reportPreview!.name)}
          </span>
          <span className="text-[var(--body-size)] font-medium text-foreground">
            {formatFirstNameSurnameInitial(reportPreview!.name) || reportPreview!.name}
          </span>
        </div>
      )}

      <div
        className={`mx-auto flex min-h-screen w-[80%] max-w-[1400px] flex-col px-6 pt-12 sm:px-6 lg:px-8 ${
          showPreviewIdentity ? "pb-[190px]" : "pb-[74px]"
        }`}
      >
        {/* Score */}
        <section className="mb-2 rounded-2xl bg-muted/40 p-8 text-center animate-fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            {tContent("score_header.heading", "Your Lead Generation Score")}
          </p>
          {firstName && (
            <p className="mb-7 text-sm font-medium text-muted-foreground sm:text-base">
              {tContent("report_page.prepared_for", "Prepared for {name}").replace("{name}", firstName)}
            </p>
          )}
          <ScoreRingCombined
            animated
            overall={percentageScore}
            segments={[
              { label: categoryScores[0].label, pct: categoryScores[0].percent, color: "#f43f5e" },
              { label: categoryScores[1].label, pct: categoryScores[1].percent, color: "#10b981" },
              { label: categoryScores[2].label, pct: categoryScores[2].percent, color: "#f59e0b" },
            ]}
            pillOffsets={[{}, {}, { dx: -3, dy: 2 }]}
            ariaLabel="Your overall lead generation score"
          />
        </section>

        {/* Three-column breakdown */}
        <section className="mb-2 p-8">
          <div className="grid gap-4 md:grid-cols-3">
            {categoryScores.map((cs, i) => {
              const missing = !categoryHasAnswers[i];
              const band: "low" | "mid" | "high" =
                cs.percent >= 67 ? "high" : cs.percent >= 34 ? "mid" : "low";
              const color = ["#f43f5e", "#10b981", "#f59e0b"][i];
              const advice = tContent(`breakdown.${cs.category}_${band}`, breakdownDefaults[cs.category][band]);
              return (
                <div key={cs.category} className="h-full rounded-xl border border-border bg-background p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color }}>
                    {cs.label}
                  </p>
                  {missing ? (
                    <>
                      <p className="mt-2 text-sm font-semibold leading-snug text-muted-foreground">
                        {tContent("breakdown.empty_state", "Not enough answers yet to score this area.")}
                      </p>
                      <p className="mt-4 text-[var(--body-size)] leading-relaxed text-muted-foreground">{advice}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-black leading-none text-foreground">{cs.percent}%</p>
                      <p className="mt-4 text-[var(--body-size)] leading-relaxed text-muted-foreground">{advice}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Diagnosis */}
        {paragraphs.length > 0 && (
          <section className="mb-2 rounded-2xl bg-muted/40 p-8">
            <div className="space-y-6">
              {paragraphs.map((text, i) => (
                <p
                  key={i}
                  className={`whitespace-pre-line ${
                    i === 0
                      ? "text-[var(--h1-size)] font-semibold leading-[1.25] tracking-tight"
                      : "text-[var(--h2-size)] leading-[1.6]"
                  }`}
                >
                  {text}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Join CTA */}
        <section className="p-8 text-center">
          <h2 className="text-[var(--h2-size)] font-semibold text-foreground">
            {tContent("report_page.cta_heading", "Ready to fix it for good?")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--body-size)] text-muted-foreground">
            {tContent(
              "report_page.cta_body",
              "Join the free 3-day challenge and build the system your report points to, step by step.",
            )}
          </p>
          <Button
            size="lg"
            className="mt-6 font-semibold"
            onClick={() => navigate("/challenge/join")}
          >
            {tContent("report_page.cta_button", "Join the 3-Day Challenge")}
          </Button>
        </section>
      </div>

      {showPreviewIdentity && <ReportVerifyBanner preview={reportPreview!} />}
    </>
  );
};

export default Report;
