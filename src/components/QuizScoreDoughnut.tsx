import { Trophy } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { questions } from "@/lib/assessmentData";

const TIER: Record<string, { label: string; tone: string; stroke: string; description: string }> = {
  low: {
    label: "Pioneer",
    tone: "text-amber-500",
    stroke: "stroke-amber-500",
    description:
      "You are just beginning to hear the call for change. The clarity you need is closer than you think.",
  },
  mid: {
    label: "Architect",
    tone: "text-primary",
    stroke: "stroke-primary",
    description:
      "You know what you want but something keeps getting in the way. You are ready to break through.",
  },
  high: {
    label: "Authority",
    tone: "text-emerald-500",
    stroke: "stroke-emerald-500",
    description:
      "You have done the inner work. Now it is time to back yourself and take the leap.",
  },
};

const SIZE = 140;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const QuizScoreDoughnut = () => {
  const { state } = useAppState();
  const assessment = state.assessment as any;
  if (!assessment || typeof assessment.diagnosticScore !== "number") return null;

  const score: number = assessment.diagnosticScore;
  const total = questions.length;
  const percent = Math.max(0, Math.min(100, Math.round((score / total) * 100)));
  const tier =
    TIER[assessment.diagnosticLevel as string] ?? {
      label: "Your Archetype",
      tone: "text-primary",
      stroke: "stroke-primary",
      description: "",
    };
  const dash = (percent / 100) * CIRC;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            role="img"
            aria-label={`Quiz score ${score} of ${total}, ${percent} percent`}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              className="stroke-muted"
              fill="none"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              className={tier.stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              fill="none"
              style={{ transition: "stroke-dasharray 700ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[var(--h1-size)] font-black leading-none ${tier.tone}`}>{percent}%</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {score}/{total}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            <Trophy className="h-3 w-3" /> Quiz Score
          </div>
          <h2 className="mt-2 text-[var(--h2-size)] font-black text-foreground sm:text-[var(--h1-size)]">
            <span className={tier.tone}>{tier.label}</span>
          </h2>
          {tier.description && (
            <p className="mt-1 text-[var(--body-size)] leading-snug text-muted-foreground">
              {tier.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuizScoreDoughnut;
