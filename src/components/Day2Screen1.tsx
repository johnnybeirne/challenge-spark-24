import { Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: 1, label: "Quiz marketing", title: "Why a 2-minute quiz beats a 3-day pitch" },
  { id: 2, label: "Quiz generation", title: "Generate your quiz" },
  { id: 3, label: "Export", title: "Export your plan" },
];

const Day2Screen1 = () => {
  const { state, authUser } = useAppState();

  const rawName =
    (state.user?.name as string | undefined) ||
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authUser?.user_metadata?.first_name as string | undefined) ||
    "";
  const firstName = rawName.trim().split(/\s+/)[0] || "there";

  const day2 = state.challenge.day2 ?? {
    section1Complete: false,
    section2Complete: false,
    section3Complete: false,
  };

  const completeMap: Record<number, boolean> = {
    1: day2.section1Complete,
    2: day2.section2Complete,
    3: day2.section3Complete,
  };

  // Active = first incomplete section. Later sections are locked.
  const activeId = SECTIONS.find((s) => !completeMap[s.id])?.id ?? SECTIONS.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 pb-24">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
            Day 2: Build your quiz
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Today you build the quiz that drives people into your challenge, {firstName}.
          </p>
        </header>

        {/* Section progress */}
        <ol className="mb-8 flex flex-wrap items-center gap-2">
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isComplete = completeMap[s.id];
            const isLocked = !isActive && !isComplete;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isComplete && !isActive && "border-primary/40 bg-primary/10 text-foreground",
                  isLocked && "border-border bg-muted text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black",
                    isActive && "bg-primary-foreground text-primary",
                    isComplete && !isActive && "bg-primary text-primary-foreground",
                    isLocked && "bg-background text-muted-foreground",
                  )}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : s.id}
                </span>
                <span>{s.label}</span>
              </li>
            );
          })}
        </ol>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isComplete = completeMap[s.id];
            const isLocked = !isActive && !isComplete;

            return (
              <Card
                key={s.id}
                className={cn(
                  "transition-colors",
                  isLocked && "border-dashed bg-muted/40 opacity-70",
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <CardTitle className="text-lg sm:text-xl">{s.title}</CardTitle>
                  {isLocked && <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                </CardHeader>
                {isActive && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Content coming in next step.</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Day2Screen1;
