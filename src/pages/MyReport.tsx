import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/context/AppContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { getDiagnosticResult, questions } from "@/lib/assessmentData";

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

const MyReport = () => {
  const { user } = useAuth();
  const { state } = useAppState();
  const { map, loaded: copyLoaded } = useSiteContent("my_report");

  const t = (key: string, fallback: string) => map[`report.${key}`] || fallback;

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [rows, setRows] = useState<DiagnosticRow[]>([]);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(
    (state.assessment as unknown as Record<string, unknown>) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    (async () => {
      const [profileRes, progressRes, contextRes, diagnosticRes] = await Promise.all([
        supabase.from("profiles").select("first_name,name").eq("id", user.id).maybeSingle(),
        supabase.from("challenge_progress").select("id").eq("user_id", user.id).maybeSingle(),
        (supabase.from("ai_user_context") as any).select("assessment").eq("user_id", user.id).maybeSingle(),
        supabase.from("diagnostic_responses").select("tier,min_percent,max_percent,title,messages"),
      ]);

      if (cancelled) return;

      const profile = profileRes.data as { first_name: string | null; name: string | null } | null;
      const name = profile?.first_name || profile?.name || state.user?.name || "";
      setFirstName(String(name).split(" ")[0] ?? "");
      setHasJoined(!!progressRes.data);

      const remoteAssessment = (contextRes.data as { assessment?: Record<string, unknown> } | null)?.assessment;
      if (remoteAssessment && typeof remoteAssessment === "object") setAssessment(remoteAssessment);

      const data = diagnosticRes.data ?? [];
      setRows(
        data.map((r) => ({
          tier: r.tier,
          min_percent: r.min_percent,
          max_percent: r.max_percent,
          title: r.title,
          messages: Array.isArray(r.messages) ? r.messages.filter((m): m is string => typeof m === "string") : [],
        })),
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, state.user?.name, state.assessment]);

  const score = Number((assessment as { diagnosticScore?: number } | null)?.diagnosticScore ?? 0);
  const percentageScore = Math.max(9, Math.min(92, Math.round((score / questions.length) * 100)));

  const paragraphs = useMemo<string[]>(() => {
    const match = rows.find((r) => percentageScore >= r.min_percent && percentageScore <= r.max_percent) ?? rows[0];
    if (match) return [match.title, ...match.messages].filter((s) => s && s.trim().length > 0);
    const a = assessment as { diagnosticTitle?: string; diagnosticMessage?: string } | null;
    if (a?.diagnosticTitle) return [a.diagnosticTitle, a.diagnosticMessage ?? ""].filter((s) => s && s.trim().length > 0);
    const fallback = getDiagnosticResult(score);
    return [fallback.title, fallback.message].filter((s) => s && s.trim().length > 0);
  }, [rows, percentageScore, assessment, score]);

  if (loading || !copyLoaded) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const heading = hasJoined
    ? t("joined_heading", "Your full report")
    : t("heading", "Your report");
  const intro = t("intro", "Here is what your answers point to, {name}.").replace(
    "{name}",
    firstName || "there",
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-muted-foreground">{intro}</p>
      </header>

      <div className="relative">
        <Card>
          <CardContent
            className={`space-y-4 p-6 ${hasJoined ? "" : "select-none blur-[5px]"}`}
            aria-hidden={hasJoined ? undefined : true}
          >
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-lg font-semibold" : "text-muted-foreground"}>
                {p}
              </p>
            ))}
          </CardContent>
        </Card>

        {!hasJoined && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 p-6">
            <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg">
              <div className="flex justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {t("locked_heading", "Your full report is waiting")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "locked_body",
                  "Join the 3-Day Challenge to read the whole thing and put it to work.",
                )}
              </p>
              <Button asChild className="w-full">
                <Link to="/challenge/join">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("cta_label", "Join the 3-Day Challenge")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReport;
