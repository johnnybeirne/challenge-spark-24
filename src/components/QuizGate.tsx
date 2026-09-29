import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Spinner from "@/components/Spinner";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";

/** A logged-in user has a quiz result if one is in app state, waiting in
 *  localStorage to sync, or saved in ai_user_context.assessment. */
function hasLocalResult(stateAssessment: unknown): boolean {
  if (stateAssessment && typeof stateAssessment === "object") return true;
  try {
    const raw = localStorage.getItem("challengeos_assessment");
    if (raw && raw !== "null") return true;
  } catch {}
  return false;
}

const QuizGate = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user } = useAuth();
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
      setRemote(a && typeof a === "object" ? "yes" : "no");
    })();
    return () => { cancelled = true; };
  }, [local, isDemo, user]);

  if (local || isDemo || !user) return <>{children}</>;
  if (remote === "unknown") return <Spinner />;
  if (remote === "no") return <Navigate to="/challenge/quiz" replace />;
  return <>{children}</>;
};

export default QuizGate;
