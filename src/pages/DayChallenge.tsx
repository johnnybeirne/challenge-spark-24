import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const dayConfig: Record<number, { title: string; nudge?: string; tasks: { key: string; label: string; hasTextarea: boolean; placeholder?: string }[] }> = {
  1: {
    title: "Foundation",
    tasks: [
      { key: "define_app", label: "Define your app", hasTextarea: true, placeholder: "Describe your app idea in 2-3 sentences…" },
      { key: "map_pages", label: "Map your pages", hasTextarea: true, placeholder: "List the pages your app needs…" },
      { key: "create_structure", label: "Create structure", hasTextarea: true, placeholder: "Outline the structure and navigation…" },
    ],
  },
  2: {
    title: "Build",
    tasks: [
      { key: "build_core", label: "Build core feature", hasTextarea: false },
      { key: "connect_flow", label: "Connect flow", hasTextarea: false },
      { key: "test_mobile", label: "Test mobile", hasTextarea: false },
    ],
  },
  3: {
    title: "Launch",
    tasks: [
      { key: "finalize", label: "Finalize", hasTextarea: false },
      { key: "add_sharing", label: "Add sharing", hasTextarea: false },
      { key: "launch", label: "Launch", hasTextarea: false },
    ],
  },
};

const DayChallenge = () => {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const dayNum = Number(day) || 1;
  const config = dayConfig[dayNum] || dayConfig[1];

  const taskKey = (key: string) => `day${dayNum}_${key}`;
  const isChecked = (key: string) => !!state.challenge.tasks[taskKey(key)];
  const getOutput = (key: string) => state.challenge.aiOutputs[taskKey(key)] || "";

  const allDone = config.tasks.every((t) => isChecked(t.key));

  const toggleTask = (key: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: { ...prev.challenge.tasks, [taskKey(key)]: !prev.challenge.tasks[taskKey(key)] },
      },
    }));
  };

  const setOutput = (key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, [taskKey(key)]: value },
      },
    }));
  };

  const completeDay = () => {
    if (dayNum < 3) {
      setState((prev) => ({
        ...prev,
        challenge: { ...prev.challenge, currentDay: dayNum + 1 },
      }));
      toast({ title: `Day ${dayNum} complete!`, description: `Day ${dayNum + 1} is now unlocked.` });
      navigate("/dashboard");
    } else {
      toast({ title: "Challenge complete! 🎉", description: "You've finished all 3 days." });
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Day {dayNum} of 3
        </p>
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
      </div>

      <div className="space-y-4">
        {config.tasks.map((task, i) => (
          <Card key={task.key}>
            <CardContent className="p-5">
              <label
                className="flex items-center gap-3 cursor-pointer group mb-3"
                onClick={() => toggleTask(task.key)}
              >
                <Checkbox checked={isChecked(task.key)} className="pointer-events-none" />
                <span
                  className={`text-sm font-medium transition-colors ${
                    isChecked(task.key)
                      ? "line-through text-muted-foreground"
                      : "text-foreground group-hover:text-primary"
                  }`}
                >
                  {i + 1}. {task.label}
                </span>
              </label>
              {task.hasTextarea && (
                <Textarea
                  placeholder={task.placeholder}
                  value={getOutput(task.key)}
                  onChange={(e) => setOutput(task.key, e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {allDone && (
        <Button className="mt-6 w-full gap-2" size="lg" onClick={completeDay}>
          <CheckCircle className="w-4 h-4" />
          {dayNum < 3 ? `Complete Day ${dayNum} → Unlock Day ${dayNum + 1}` : "Finish Challenge 🎉"}
        </Button>
      )}
    </div>
  );
};

export default DayChallenge;
