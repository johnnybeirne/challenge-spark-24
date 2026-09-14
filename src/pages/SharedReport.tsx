import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import ReportContent from "@/components/ReportContent";
import { supabase } from "@/integrations/supabase/client";
import { getInitials, formatFirstNameSurnameInitial } from "@/lib/formatName";
import { useSiteContent } from "@/hooks/useSiteContent";
import { generateResult, buildPreviewAnswers, type AssessmentResult } from "@/lib/assessmentData";
import { Loader2 } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "ok"; name: string; assessment: AssessmentResult }
  | { status: "error"; message: string };

/**
 * Token-based report page for leads who asked for their report but did not
 * join the challenge. Standalone wrapper: no participant navigation, no
 * participant profile chrome. Resolves the report from the URL token alone.
 */
const SharedReport = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    (async () => {
      if (!token) {
        setState({ status: "error", message: "This report link is missing its code." });
        return;
      }
      const { data, error } = await supabase.functions.invoke("quiz-report", {
        body: { action: "get", token },
      });
      if (cancelled) return;
      const payload = data as { name?: string; assessment?: unknown; error?: string } | null;
      if (error || !payload || payload.error || !payload.name) {
        const kind = payload?.error;
        setState({
          status: "error",
          message:
            kind === "expired"
              ? "This report link has expired. Take the quiz again and we will send you a fresh one."
              : "We could not find a report for this link. It may be incomplete or no longer valid.",
        });
        return;
      }
      setState({
        status: "ok",
        name: payload.name,
        assessment: (payload.assessment ?? {}) as AssessmentResult,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <>
        <SEO title="Your Report" description="Your personalised lead generation report." canonical="/r" />
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <SEO title="Report not available" description="Your personalised lead generation report." canonical="/r" />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-[var(--h1-size)] font-semibold text-foreground">Report not available</h1>
          <p className="max-w-md text-[var(--body-size)] text-muted-foreground">{state.message}</p>
          <Button onClick={() => navigate("/assessment")} className="font-semibold">
            Take the quiz
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Your Report" description="Your personalised lead generation report." canonical="/r" />
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {getInitials(state.name)}
        </span>
        <span className="text-[var(--body-size)] font-medium text-foreground">
          {formatFirstNameSurnameInitial(state.name) || state.name}
        </span>
      </div>

      <div className="mx-auto flex min-h-screen w-[50%] max-w-[1400px] flex-col px-6 pb-16 pt-12 sm:px-6 lg:px-8">
        <ReportContent name={state.name} assessment={state.assessment} />
      </div>
    </>
  );
};

export default SharedReport;
