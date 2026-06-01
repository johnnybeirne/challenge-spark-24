import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  DAY1_EXAMPLE_VALUES,
  DAY1_TAG_KEYS,
  Day1StepMessage,
  defaultDay1Steps,
  loadDay1Steps,
  renderDay1Preview,
  saveDay1Steps,
} from "@/lib/day1StepMessages";

const AdminDay1Steps = () => {
  const [steps, setSteps] = useState<Day1StepMessage[]>(() => loadDay1Steps());

  useEffect(() => {
    trackEvent("admin_training_viewed", { surface: "day1_step_editor" });
  }, []);

  // Save immediately on every keystroke — synchronous and unconditional so
  // there is zero chance an edit fails to reach the live /day/1 flow.
  const updateStep = (id: string, message: string) =>
    setSteps((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, message } : s));
      saveDay1Steps(next);
      return next;
    });

  const handleSave = () => {
    saveDay1Steps(steps);
    trackEvent("admin_training_updated", { surface: "day1_step_editor" });
    toast.success("Day 1 step messages updated");
  };

  const handleResetAll = () => {
    setSteps(defaultDay1Steps);
    toast.message("Reverted to defaults.");
  };

  const handleResetOne = (id: string) => {
    const def = defaultDay1Steps.find((s) => s.id === id);
    if (!def) return;
    updateStep(id, def.message);
  };


  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Day 1 Step Editor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit each step's message. The live preview substitutes example values for every bracket tag,
            so you can see exactly how the message will appear to a real user.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetAll} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset all
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Available bracket tags
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY1_TAG_KEYS.map((key) => (
              <Badge key={key} variant="secondary" className="font-mono text-xs">
                [{key}] → {DAY1_EXAMPLE_VALUES[key]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {steps.map((step) => (
          <StepEditorCard
            key={step.id}
            step={step}
            onChange={(msg) => updateStep(step.id, msg)}
            onReset={() => handleResetOne(step.id)}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save all changes
        </Button>
      </div>
    </div>
  );
};

const StepEditorCard = ({
  step,
  onChange,
  onReset,
}: {
  step: Day1StepMessage;
  onChange: (msg: string) => void;
  onReset: () => void;
}) => {
  const preview = useMemo(() => renderDay1Preview(step.message), [step.message]);
  const id = `day1-step-${step.id}`;
  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={id} className="text-sm font-semibold">
            {step.label}
          </Label>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 h-7">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Message
          </Label>
          <Textarea
            id={id}
            rows={3}
            value={step.message}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. So [first_name], you work with [audience]. What's your superpower?"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm md:text-base leading-relaxed text-foreground/90">
            {preview.trim().length > 0 ? preview : (
              <span className="text-muted-foreground italic">Preview appears here as you type.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDay1Steps;
