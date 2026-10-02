import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { getDiagnosticResult } from "@/lib/assessmentData";
import aiAvatar from "@/assets/ai-avatar.png";
import { QUIZ_GATE_NEXT_KEY } from "@/components/QuizGate";

export function readNext(): { to: string; label: string } {
  let to = "/challenge/day-1";
  try {
    const v = sessionStorage.getItem(QUIZ_GATE_NEXT_KEY);
    if (v && v.startsWith("/") && !v.startsWith("//")) to = v;
  } catch {}
  const path = to.split("?")[0];
  const day = path.match(/^\/(?:challenge\/)?day[/-](\d)$/);
  if (day) return { to, label: `Continue to Day ${day[1]}` };
  if (/dashboard/.test(path)) return { to, label: "Continue to your dashboard" };
  return { to, label: "Continue to Day 1" };
}

/** Result screen for logged-in users who took the quiz inside the app.
 *  One action only: continue to the page they were trying to open. */
const InAppQuizResult = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const next = readNext();
  const a = state.assessment as Record<string, any> | null;
  if (!a) return <Navigate to="/challenge/quiz" replace />;

  const fallback = getDiagnosticResult(Number(a.diagnosticScore ?? 0));
  const title = a.diagnosticTitle || fallback.title;
  const message = a.diagnosticMessage || fallback.message;

  return (
    <>
      <SEO title="Your quiz result" description="Your lead flow result." canonical="/challenge/quiz/result" />
      <div className="min-h-screen flex items-start md:items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-8 md:p-14 text-center animate-fade-in">
          <img src={aiAvatar} alt="Johnny B AI" width={80} height={80} className="mx-auto h-20 w-20 rounded-full object-cover mb-4" />
          <p className="text-[11px] tracking-[0.25em] font-bold text-primary uppercase mb-6">Your result</p>
          <h1 className="font-montserrat font-semibold text-[var(--h2-size)] md:text-[var(--h1-size)] leading-[1.25] text-foreground mb-4">
            {title}
          </h1>
          <p className="text-[var(--body-size)] text-muted-foreground mb-10">{message}</p>
          <Button
            size="lg"
            className="h-auto min-h-14 w-full max-w-full whitespace-normal px-6 py-4 leading-snug sm:w-auto sm:px-8"
            onClick={() => {
              try { sessionStorage.removeItem(QUIZ_GATE_NEXT_KEY); } catch {}
              navigate(next.to, { replace: true });
            }}
          >
            {next.label} <ArrowRight className="ml-2 h-5 w-5 inline" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default InAppQuizResult;
