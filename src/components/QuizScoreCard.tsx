import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { questions } from "@/lib/assessmentData";

const REVERSE = new Set(["q2", "q6", "q9"]);

const TIER: Record<string, { label: string; tone: string }> = {
  low: { label: "Starter Stage", tone: "text-amber-500" },
  mid: { label: "Builder Stage", tone: "text-primary" },
  high: { label: "Operator Stage", tone: "text-emerald-500" },
};

const QuizScoreCard = () => {
  const { state } = useAppState();
  const assessment = state.assessment as any;
  if (!assessment || typeof assessment.diagnosticScore !== "number" || !assessment.answers) return null;

  const score: number = assessment.diagnosticScore;
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const tier = TIER[assessment.diagnosticLevel as string] ?? { label: "Diagnosis", tone: "text-primary" };
  const answers: Record<string, string> = assessment.answers;

  const breakdown = questions.map((q) => {
    const ans = answers[q.id];
    const reversed = REVERSE.has(q.id);
    const correct = reversed ? ans === "no" : ans === "yes";
    return { id: q.id, text: q.text, ans, correct };
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            <Trophy className="h-3 w-3" /> Quiz Score
          </div>
          <h2 className="mt-3 text-xl font-black text-foreground sm:text-2xl">
            {score} / {total} <span className={`text-base font-bold ${tier.tone}`}>· {tier.label}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You answered {score} of {total} growth signals in the strong direction.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
          <div className="text-2xl font-black text-primary">{percent}%</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Strength</div>
        </div>
      </div>

      <Progress value={percent} className="mt-4 h-2" />

      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Answer breakdown
        </p>
        <ul className="space-y-2">
          {breakdown.map((b, i) => (
            <li
              key={b.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              {b.correct ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">
                  <span className="font-bold text-muted-foreground">Q{i + 1}.</span> {b.text}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Your answer:{" "}
                  <span className={b.correct ? "text-emerald-600" : "text-destructive"}>
                    {b.ans === "yes" ? "Yes" : b.ans === "no" ? "Not really" : "—"}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default QuizScoreCard;
