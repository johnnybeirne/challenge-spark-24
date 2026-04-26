import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, Circle, Edit3, Users } from "lucide-react";
import { getSetup } from "@/components/Day1Setup";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";
import { trackEvent } from "@/lib/analytics";
import { audienceLabel as memoryAudienceLabel, challengeTypeLabel, mergeMemory } from "@/lib/personalisation";
import AddToCalendar from "@/components/AddToCalendar";

const dayTasks: Record<number, { label: string }[]> = {
  1: [
    { label: "Define your challenge" },
    { label: "Map your pages" },
    { label: "Create structure" },
  ],
  2: [
    { label: "Build core feature" },
    { label: "Connect flow" },
    { label: "Test mobile" },
  ],
  3: [
    { label: "Finalize" },
    { label: "Add sharing" },
    { label: "Launch" },
  ],
};

const Dashboard = () => {
  const { state, setState, authUser, signOut } = useAppState();
  const navigate = useNavigate();
  const currentDay = state.challenge.currentDay || 1;
  const tasks = dayTasks[currentDay] || dayTasks[1];
  const setup = getSetup();
  const referralCount = state.network.direct;
  const firstName = state.user?.name?.split(" ")[0] || "there";
  const memory = state.memory;
  const [editingMemory, setEditingMemory] = useState(false);
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDwellElapsed(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  const toggleTask = (taskKey: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: { ...prev.challenge.tasks, [taskKey]: !prev.challenge.tasks[taskKey] },
      },
    }));
  };

  const completedCount = tasks.filter((_, i) => state.challenge.tasks[`day${currentDay}_task${i}`]).length;
  const progressValue = (completedCount / tasks.length) * 100;
  const updateMemory = (updates: Partial<typeof memory>) => {
    setState((prev) => ({ ...prev, memory: mergeMemory(prev.memory, updates) }));
    trackEvent("memory_updated", { source: "dashboard" });
  };

  return (
    <main className="app-page-container min-h-screen py-5 pb-24 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back, {firstName}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">Challenge dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddToCalendar variant="secondary" className="h-10" />
          {(authUser || sessionStorage.getItem(DEMO_USER_KEY) === "1") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={async () => {
                sessionStorage.removeItem(DEMO_USER_KEY);
                await signOut();
                window.location.href = "/";
              }}
            >
              {authUser ? "Sign out" : "Exit user view"}
            </Button>
          )}
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-border bg-muted/40 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">Day {currentDay} of 3</p>
                    <h2 className="mt-1 text-2xl font-bold text-foreground">Today’s module</h2>
                  </div>
                  <Button onClick={() => navigate(`/day/${currentDay}`)} className="gap-2 sm:w-auto">
                    Open module
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>{completedCount} of {tasks.length} complete</span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              </div>

              <div className="divide-y divide-border">
                {tasks.map((task, i) => {
                  const key = `day${currentDay}_task${i}`;
                  const checked = !!state.challenge.tasks[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleTask(key)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <Checkbox checked={checked} className="pointer-events-none h-5 w-5" />
                      <span className={`flex-1 font-semibold ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.label}
                      </span>
                      {checked ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Challenge workspace</p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    {setup ? memory.challengeName || "Your challenge" : "Set up your challenge"}
                  </h2>
                </div>
                {setup && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditingMemory((v) => !v)}>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {setup ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Format</p>
                      <p className="mt-1 font-semibold text-foreground">{challengeTypeLabel(memory.challengeType || setup.challengeType)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Audience</p>
                      <p className="mt-1 font-semibold text-foreground">{memoryAudienceLabel(memory.audienceType || setup.audienceType)}</p>
                    </div>
                  </div>

                  {(memory.desiredOutcome || setup.topicHint) && (
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm font-medium text-muted-foreground">Outcome</p>
                      <p className="mt-1 font-semibold text-foreground">{memory.desiredOutcome || setup.topicHint}</p>
                    </div>
                  )}

                  {editingMemory && (
                    <div className="grid gap-3 border-t border-border pt-4">
                      <Input placeholder="Challenge name" value={memory.challengeName} onChange={(e) => updateMemory({ challengeName: e.target.value })} />
                      <Input placeholder="Topic" value={memory.topic} onChange={(e) => updateMemory({ topic: e.target.value })} />
                      <Textarea placeholder="Desired outcome" value={memory.desiredOutcome} onChange={(e) => updateMemory({ desiredOutcome: e.target.value })} rows={3} />
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={() => navigate("/day/1")} className="w-full gap-2 font-semibold">
                  Start setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          {(completedCount >= 1 || dwellElapsed) && (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Builder invites</p>
                    <p className="text-sm text-muted-foreground">{Math.min(referralCount, 3)} of 3 invited</p>
                  </div>
                </div>
                <Progress value={(Math.min(referralCount, 3) / 3) * 100} className="mt-4 h-2" />
                <Button variant="secondary" onClick={() => navigate("/referrals")} className="mt-4 w-full gap-2">
                  Invite builders
                  <Users className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

        </aside>
      </section>
    </main>
  );
};

export default Dashboard;
