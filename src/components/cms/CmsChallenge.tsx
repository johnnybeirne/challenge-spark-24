import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type ChallengeConfig, type ChallengeTask } from "@/context/SiteConfigContext";
import { Plus, Trash2 } from "lucide-react";

const CmsChallenge = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<ChallengeConfig>(JSON.parse(JSON.stringify(config.challenge)));

  const updateTask = (dayIdx: number, taskIdx: number, field: keyof ChallengeTask, value: string) => {
    const days = [...draft.days];
    const tasks = [...days[dayIdx].tasks];
    tasks[taskIdx] = { ...tasks[taskIdx], [field]: value };
    days[dayIdx] = { ...days[dayIdx], tasks };
    setDraft((prev) => ({ ...prev, days }));
  };

  const addTask = (dayIdx: number) => {
    if (draft.days[dayIdx].tasks.length >= 5) return;
    const days = [...draft.days];
    days[dayIdx] = { ...days[dayIdx], tasks: [...days[dayIdx].tasks, { title: "", description: "", type: "textarea" }] };
    setDraft((prev) => ({ ...prev, days }));
  };

  const removeTask = (dayIdx: number, taskIdx: number) => {
    const days = [...draft.days];
    days[dayIdx] = { ...days[dayIdx], tasks: days[dayIdx].tasks.filter((_, i) => i !== taskIdx) };
    setDraft((prev) => ({ ...prev, days }));
  };

  const updateDay = (dayIdx: number, field: string, value: any) => {
    const days = [...draft.days];
    days[dayIdx] = { ...days[dayIdx], [field]: value };
    setDraft((prev) => ({ ...prev, days }));
  };

  const save = () => {
    updateSection("challenge", draft);
    toast.success("Challenge content updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Challenge Content</h2>
        <p className="text-sm text-muted-foreground">Edit challenge days, tasks, and messages.</p>
      </div>

      <div className="space-y-2">
        <Label>Challenge Title</Label>
        <Input value={draft.challengeTitle} onChange={(e) => setDraft((prev) => ({ ...prev, challengeTitle: e.target.value }))} />
      </div>

      <p className="text-xs text-muted-foreground">Days: 3 (fixed for MVP)</p>

      {draft.days.map((day, dayIdx) => (
        <section key={dayIdx} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Day {dayIdx + 1}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={day.title} onChange={(e) => updateDay(dayIdx, "title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Subtitle</Label>
              <Input value={day.subtitle} onChange={(e) => updateDay(dayIdx, "subtitle", e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tasks</Label>
            {day.tasks.map((task, taskIdx) => (
              <div key={taskIdx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input placeholder="Task title" value={task.title} onChange={(e) => updateTask(dayIdx, taskIdx, "title", e.target.value)} />
                  <div className="flex gap-2">
                    <Select value={task.type} onValueChange={(v) => updateTask(dayIdx, taskIdx, "type", v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="text_input">Text Input</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="url_input">URL Input</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeTask(dayIdx, taskIdx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addTask(dayIdx)}><Plus className="h-4 w-4 mr-1" /> Add task</Button>
          </div>

          {day.nudgeText !== undefined && (
            <div className="space-y-1">
              <Label>Nudge Text</Label>
              <Textarea value={day.nudgeText || ""} onChange={(e) => updateDay(dayIdx, "nudgeText", e.target.value)} rows={2} />
            </div>
          )}

          {dayIdx === 2 && (
            <>
              <div className="flex items-center gap-3">
                <Switch checked={day.requireUrl ?? true} onCheckedChange={(v) => updateDay(dayIdx, "requireUrl", v)} />
                <Label>Require URL submission</Label>
              </div>
              <div className="space-y-1">
                <Label>Completion Message</Label>
                <Textarea value={day.completionMessage || ""} onChange={(e) => updateDay(dayIdx, "completionMessage", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Post-completion Tension Text</Label>
                <Textarea value={day.postCompletionTension || ""} onChange={(e) => updateDay(dayIdx, "postCompletionTension", e.target.value)} rows={2} />
              </div>
            </>
          )}
        </section>
      ))}

      <Button onClick={save} className="w-full">Save Challenge Content</Button>
    </div>
  );
};

export default CmsChallenge;
