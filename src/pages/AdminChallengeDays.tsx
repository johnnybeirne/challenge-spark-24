import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Save, ExternalLink, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  loadDayContent,
  saveDayContent,
  defaultDayContent,
  type DayContent,
  type DayContentConfig,
  type DayTaskConfig,
} from "@/lib/dayContent";
import { CmsPageHeader } from "@/components/cms/cms-ui";

type DayKey = "day1" | "day2" | "day3";

const DAY_LABELS: Record<DayKey, string> = {
  day1: "Day 1",
  day2: "Day 2",
  day3: "Day 3",
};

const newTask = (i: number): DayTaskConfig => ({
  key: `task_${Date.now()}_${i}`,
  label: "New task",
  hasTextarea: false,
  inputType: "checkbox",
  placeholder: "",
  helper: "",
});

const Editor = ({
  value,
  onChange,
}: {
  value: DayContentConfig;
  onChange: (next: DayContentConfig) => void;
}) => {
  const update = <K extends keyof DayContentConfig>(field: K, v: DayContentConfig[K]) =>
    onChange({ ...value, [field]: v });
  const updateTask = (i: number, patch: Partial<DayTaskConfig>) => {
    const tasks = value.tasks.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ ...value, tasks });
  };
  const addTask = () => onChange({ ...value, tasks: [...value.tasks, newTask(value.tasks.length)] });
  const removeTask = (i: number) =>
    onChange({ ...value, tasks: value.tasks.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Day header</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Day title</Label>
            <Input value={value.title} onChange={(e) => update("title", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">The big H1 at the top of the day page.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Intro line</Label>
            <Textarea rows={2} value={value.intro} onChange={(e) => update("intro", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Short line shown right under the title.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nudge (optional)</Label>
            <Input value={value.nudge} onChange={(e) => update("nudge", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Italic encouragement under the intro. Leave blank to hide.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Training block</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Lesson</Label>
            <Textarea rows={3} value={value.lesson} onChange={(e) => update("lesson", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Main paragraph in the Training card.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reinforcement</Label>
            <Textarea rows={2} value={value.reinforcement} onChange={(e) => update("reinforcement", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Secondary line under the lesson.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Action tasks</h3>
            <Button variant="outline" size="sm" onClick={addTask}>
              <Plus className="h-4 w-4 mr-1.5" /> Add task
            </Button>
          </div>
          {value.tasks.length === 0 && (
            <p className="text-xs text-muted-foreground">No tasks yet. Add one to give people something to do.</p>
          )}
          <div className="space-y-3">
            {value.tasks.map((t, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3 bg-background/40">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px]">Task {i + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTask(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Task label</Label>
                  <Input value={t.label} onChange={(e) => updateTask(i, { label: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Input type</Label>
                    <Select
                      value={t.hasTextarea ? t.inputType : "checkbox"}
                      onValueChange={(v) => {
                        if (v === "checkbox") updateTask(i, { hasTextarea: false, inputType: "checkbox" });
                        else updateTask(i, { hasTextarea: true, inputType: v as DayTaskConfig["inputType"] });
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkbox">Checkbox only</SelectItem>
                        <SelectItem value="input">Short text input</SelectItem>
                        <SelectItem value="textarea">Long text (textarea)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Field key</Label>
                    <Input
                      value={t.key}
                      onChange={(e) => updateTask(i, { key: e.target.value })}
                      className="font-mono text-xs h-9"
                    />
                  </div>
                </div>
                {t.hasTextarea && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Placeholder</Label>
                      <Input value={t.placeholder} onChange={(e) => updateTask(i, { placeholder: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Helper text (optional)</Label>
                      <Textarea
                        rows={2}
                        value={t.helper}
                        onChange={(e) => updateTask(i, { helper: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Completion</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Completion message</Label>
            <Textarea rows={2} value={value.completion} onChange={(e) => update("completion", e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Shown when all tasks are done. The user's first name replaces the first period.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Preview = ({ day, dayNum }: { day: DayContentConfig; dayNum: number }) => {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Day {dayNum} of 3
        </p>
        <h1 className="text-2xl font-bold text-foreground">{day.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{day.intro}</p>
        {day.nudge && <p className="mt-2 text-sm text-primary font-medium italic">{day.nudge}</p>}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <PlayCircle className="h-4 w-4" />
            <p className="text-xs font-mono uppercase tracking-wider">Training</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{day.lesson}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{day.reinforcement}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Action tasks</p>
        {day.tasks.map((t, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <label className="flex items-center gap-3 mb-2">
                <Checkbox checked={false} className="pointer-events-none" />
                <span className="text-sm font-medium text-foreground">
                  {i + 1}. {t.label}
                </span>
              </label>
              {t.hasTextarea && (
                <>
                  {t.inputType === "input" ? (
                    <Input placeholder={t.placeholder} disabled />
                  ) : (
                    <Textarea placeholder={t.placeholder} rows={4} disabled />
                  )}
                  {t.helper && <p className="text-xs text-muted-foreground mt-2">{t.helper}</p>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground">{day.completion}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminChallengeDays = () => {
  const [draft, setDraft] = useState<DayContent>(() => loadDayContent());
  const [tab, setTab] = useState<DayKey>("day1");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(JSON.stringify(draft) !== JSON.stringify(loadDayContent()));
  }, [draft]);

  const setDay = (key: DayKey, next: DayContentConfig) =>
    setDraft((prev) => ({ ...prev, [key]: next }));

  const save = () => {
    saveDayContent(draft);
    setDirty(false);
    toast.success("Challenge days saved");
  };

  const reset = () => {
    if (!confirm("Reset all 3 days to defaults? This clears your edits.")) return;
    setDraft(defaultDayContent);
  };

  const dayNum = useMemo(() => (tab === "day1" ? 1 : tab === "day2" ? 2 : 3), [tab]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 pb-24 space-y-5">
      <CmsPageHeader
        title="Challenge Days"
        description="Edit the title, intro, training, tasks, and completion message for Day 1, 2, and 3. The preview on the right matches the live page."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/day/${dayNum}`} target="_blank">
            <ExternalLink className="h-4 w-4 mr-1.5" /> Open live Day {dayNum}
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={reset}>Reset to defaults</Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DayKey)}>
        <TabsList>
          <TabsTrigger value="day1">{DAY_LABELS.day1}</TabsTrigger>
          <TabsTrigger value="day2">{DAY_LABELS.day2}</TabsTrigger>
          <TabsTrigger value="day3">{DAY_LABELS.day3}</TabsTrigger>
        </TabsList>

        {(["day1", "day2", "day3"] as DayKey[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Editor</p>
                <Editor value={draft[key]} onChange={(next) => setDay(key, next)} />
              </div>
              <div className="xl:sticky xl:top-4 xl:self-start">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live preview</p>
                <Preview day={draft[key]} dayNum={key === "day1" ? 1 : key === "day2" ? 2 : 3} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <div className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes." : "All changes saved."}
          </div>
          <Button onClick={save} disabled={!dirty} className="h-10 px-5">
            <Save className="h-4 w-4 mr-1.5" /> Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminChallengeDays;
