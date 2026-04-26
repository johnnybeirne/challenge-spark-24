import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Circle, CircleDot } from "lucide-react";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";

const challengeSteps = [
  { day: 1, title: "Define Your Challenge" },
  { day: 2, title: "Build Your Lead Magnet Quiz" },
  { day: 3, title: "Build Your AI-Powered Challenge" },
];

const Dashboard = () => {
  const { state, authUser, signOut } = useAppState();
  const navigate = useNavigate();
  const currentDay = Math.min(state.challenge.currentDay || 1, 3);
  const isComplete = state.challenge.completed || state.challenge.currentDay > 3;
  const hasProgress =
    isComplete ||
    state.challenge.currentDay > 1 ||
    Object.keys(state.challenge.tasks).length > 0 ||
    Object.keys(state.challenge.aiOutputs).some((key) => state.challenge.aiOutputs[key]);
  const completedDays = isComplete ? 3 : Math.max(0, currentDay - 1);
  const progressValue = (completedDays / 3) * 100;
  const ctaLabel = isComplete ? "Review Your Challenge" : hasProgress ? `Continue Day ${currentDay}` : "Start Day 1";
  const ctaDay = isComplete ? 3 : currentDay;
  const challengeIdea = [
    state.challenge.aiOutputs.day1_define_app,
    state.challenge.aiOutputs.day1_problem,
    state.challenge.aiOutputs.day1_result,
    state.challenge.aiOutputs.day1_share_reason,
  ].filter(Boolean);
  const quizDraft = state.challenge.aiOutputs.day2_quiz_questions;

  const getStepStatus = (day: number) => {
    if (isComplete || currentDay > day) return "Complete";
    if (currentDay === day && hasProgress) return "In progress";
    return "Not started";
  };

  const getStepIcon = (day: number) => {
    const status = getStepStatus(day);
    if (status === "Complete") return <CheckCircle2 className="h-5 w-5 text-primary" />;
    if (status === "In progress") return <CircleDot className="h-5 w-5 text-primary" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <main className="app-page-container min-h-screen py-5 pb-24 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Challenge Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">Your next step is clear</h1>
        </div>
        {(authUser || sessionStorage.getItem(DEMO_USER_KEY) === "1") && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground"
            onClick={async () => {
              sessionStorage.removeItem(DEMO_USER_KEY);
              await signOut();
              window.location.href = "/";
            }}
          >
            {authUser ? "Sign out" : "Exit user view"}
          </Button>
        )}
      </header>

      <section className="mx-auto max-w-3xl space-y-6">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
              <span className="text-sm font-medium text-muted-foreground">{completedDays} of 3 complete</span>
            </div>
            <Progress value={progressValue} className="mb-5 h-2" />
            <div className="space-y-3">
              {challengeSteps.map((step) => (
                <div key={step.day} className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4">
                  {getStepIcon(step.day)}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Day {step.day} — {step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{getStepStatus(step.day)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center shadow-sm sm:p-8">
          <Button size="lg" className="h-14 w-full max-w-md gap-2 text-base font-bold sm:text-lg" onClick={() => navigate(`/day/${ctaDay}`)}>
            {ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Takes 10–15 minutes</p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-foreground">What You’re Building</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>A simple challenge for your audience</li>
                <li>A quiz that brings people in</li>
                <li>A system that encourages sharing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-foreground">By the End of This</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>You’ll have a working version of your challenge</li>
                <li>You’ll understand how it grows</li>
                <li>You’ll be able to share it</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-foreground">Your Progress So Far</h2>
            {challengeIdea.length || quizDraft ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">Challenge idea</p>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {challengeIdea.length ? challengeIdea.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>Not added yet.</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">Quiz draft</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{quizDraft || "Not added yet."}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Your inputs will appear here as you progress.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Dashboard;
