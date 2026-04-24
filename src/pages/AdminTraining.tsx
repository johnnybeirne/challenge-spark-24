import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Lock, PlayCircle, Rocket, Sparkles } from "lucide-react";

const trainingDays = [
  {
    title: "Pre-challenge training",
    subtitle: "How this challenge works",
    lesson: "Before the user builds, they learn the system and see the full 3-day path.",
    aiPrompt: "Sets expectation before Day 1 starts.",
  },
  {
    title: "Day 1: Shape Your Challenge",
    subtitle: "Define who it is for and what result it creates.",
    lesson: "Training explains the strategic decision before action tasks begin.",
    aiPrompt: "Let’s define your challenge clearly.",
  },
  {
    title: "Day 2: Build the Experience",
    subtitle: "Turn the idea into something people can use.",
    lesson: "Training keeps users focused on the simplest usable version first.",
    aiPrompt: "Let’s map your challenge flow.",
  },
  {
    title: "Day 3: Launch and Grow",
    subtitle: "Make the challenge visible and live.",
    lesson: "Training creates launch momentum and reinforces completion.",
    aiPrompt: "Let’s get your launch ready.",
  },
];

const AdminTraining = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <section className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Badge variant="secondary" className="mb-3">Challenge Training System</Badge>
        <h1 className="text-2xl font-bold text-foreground">Training System</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          This is the guided training layer now built into the user experience. Each stage combines training, AI coaching, action tasks, a bonus placeholder, and a completion moment.
        </p>
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-5">
        {[
          [PlayCircle, "Training"],
          [Brain, "AI coaching"],
          [CheckCircle, "Action tasks"],
          [Lock, "Bonus placeholder"],
          [Rocket, "Completion moment"],
        ].map(([Icon, label]) => (
          <Card key={label as string}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{label as string}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {trainingDays.map((day) => (
          <Card key={day.title} className="border-border">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">Live in app</span>
              </div>
              <CardTitle className="text-lg">{day.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p><span className="font-medium text-foreground">User message:</span> {day.subtitle}</p>
              <p><span className="font-medium text-foreground">Training role:</span> {day.lesson}</p>
              <p><span className="font-medium text-foreground">AI coaching:</span> {day.aiPrompt}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default AdminTraining;