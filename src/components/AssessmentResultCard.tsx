import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Crown, RotateCcw, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";
import type { AssessmentResult } from "@/lib/assessmentData";
import type { EntryIntent } from "@/lib/entryIntent";

type SavedAssessment = AssessmentResult & { mode?: EntryIntent };

const MODE_CONFIG: Record<EntryIntent, { label: string; cta: string; href: string; nextStep: string; retakeHref: string; Icon: typeof Target }> = {
  challenge: {
    label: "3-Day Challenge",
    cta: "Continue 3-Day Challenge",
    href: "/day/1",
    nextStep: "Build your AI-powered challenge in 3 days.",
    retakeHref: "/assessment",
    Icon: Target,
  },
  free_training: {
    label: "Free Training",
    cta: "Continue Free Training",
    href: "/blueprint/dashboard",
    nextStep: "Continue your Challenge Growth Blueprint course.",
    retakeHref: "/free-assessment",
    Icon: BookOpen,
  },
  premium_course: {
    label: "Premium Growth Accelerator",
    cta: "Continue Premium Course",
    href: "/premium",
    nextStep: "Pick up the Premium Growth Accelerator where you left off.",
    retakeHref: "/premium-assessment",
    Icon: Crown,
  },
};

const TIER_LABEL: Record<NonNullable<AssessmentResult["diagnosticLevel"]>, string> = {
  low: "Starter Stage",
  mid: "Builder Stage",
  high: "Operator Stage",
};

const AssessmentResultCard = () => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const assessment = state.assessment as SavedAssessment | null;
  if (!assessment || !("challengeType" in assessment)) return null;

  const mode: EntryIntent = (assessment.mode as EntryIntent) ?? "challenge";
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.challenge;
  const score = assessment.diagnosticScore ?? 0;
  const percent = Math.round((score / 9) * 100);
  const stage = assessment.diagnosticLevel ? TIER_LABEL[assessment.diagnosticLevel] : "Diagnosis";
  const completedAt = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  const title = assessment.diagnosticTitle || assessment.recommendedChallenge?.title || "Your Diagnosis";
  const message = assessment.diagnosticMessage || assessment.growthInsight || cfg.nextStep;
  const Icon = cfg.Icon;

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Your Assessment
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3 w-3" /> {cfg.label}
            </span>
            {completedAt && (
              <span className="text-[11px] font-medium text-muted-foreground">Completed {completedAt}</span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-black text-foreground sm:text-2xl">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground line-clamp-3">{message}</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-primary/20 bg-background/80 p-4 text-center sm:w-44">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Readiness</div>
          <div className="mt-1 text-4xl font-black text-primary">{percent}%</div>
          <div className="mt-1 text-[11px] font-bold text-foreground">{stage}</div>
          <Progress value={percent} className="mt-2 h-1.5" />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background/60 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary">Recommended next step</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{cfg.nextStep}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={() => navigate(cfg.href)} className="h-11 gap-2 px-5 text-sm font-black uppercase">
          {cfg.cta} <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate("/results")} className="h-11 gap-2 px-5 text-sm font-bold">
          View full result
        </Button>
        <Button variant="ghost" onClick={() => navigate(cfg.retakeHref)} className="h-11 gap-2 px-5 text-sm font-bold">
          <RotateCcw className="h-4 w-4" /> Retake assessment
        </Button>
      </div>
    </section>
  );
};

export default AssessmentResultCard;
