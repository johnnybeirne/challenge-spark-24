import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Spinner from "@/components/Spinner";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";
import { questions as quizQuestions } from "@/lib/assessmentData";
import { useQaPreview } from "@/hooks/useQaPreview";

/** Where the in-app quiz sends the person when they finish. */
export const QUIZ_GATE_NEXT_KEY = "quiz_gate_next";

/** A result counts only if generateResult() scored a fully answered quiz:
 *  every question answered yes/no, plus a numeric score and a level.
 *  Empty, partial, unscored and blank-answer baseline results do not count. */
export function isRealQuizResult(a: unknown): boolean {
  if (!a || typeof a !== "object") return false;
  const r = a as Record<string, any>;
  if (typeof r.diagnosticScore !== "number" || Number.isNaN(r.diagnosticScore)) return false;
  if (typeof r.diagnosticLevel !== "string" || !r.diagnosticLevel) return false;
  const answers = r.answers;
  if (!answers || typeof answers !== "object") return false;
  return quizQuestions.every((q) => answers[q.id] === "yes" || answers[q.id] === "no");
}

function hasLocalResult(stateAssessment: unknown): boolean {
  if (isRealQuizResult(stateAssessment)) return true;
  try {
    const raw = localStorage.getItem("challengeos_assessment");
    if (raw && raw !== "null" && isRealQuizResult(JSON.parse(raw))) return true;
  } catch {}
  return false;
}

const QuizGate = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user } = useAuth();
  const location = useLocation();
  const qa = useQaPreview();
  const local = hasLocalResult(state.assessment);
  const isDemo = (() => { try { return sessionStorage.getItem(DEMO_USER_KEY) === "1"; } catch { return false; } })();
  const [remote, setRemote] = useState<"unknown" | "yes" | "no">("unknown");

  useEffect(() => {
    if (local || isDemo || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase.from("ai_user_context") as any)
        .select("assessment")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const a = (data as { assessment?: unknown } | null)?.assessment;
      setRemote(isRealQuizResult(a) ? "yes" : "no");
    })();
    return () => { cancelled = true; };
  }, [local, isDemo, user]);

  // Fresh signup preview: ignore the owner's own saved result, gate on the preview state only.
  if (qa.active && qa.persona === "fresh" && user) {
    if (local) return <>{children}</>;
    try { sessionStorage.setItem(QUIZ_GATE_NEXT_KEY, location.pathname + location.search); } catch {}
    return <Navigate to="/challenge/quiz" replace />;
  }
  if (local || isDemo || !user) return <>{children}</>;
  if (remote === "unknown") return <Spinner />;
  if (remote === "no") {
    try { sessionStorage.setItem(QUIZ_GATE_NEXT_KEY, location.pathname + location.search); } catch {}
    return <Navigate to="/challenge/quiz" replace />;
  }
  return <>{children}</>;
};

export default QuizGate;
