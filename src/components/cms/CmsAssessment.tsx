import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type AssessmentConfig, type AssessmentQuestion } from "@/context/SiteConfigContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const DIMENSIONS = ["Trust", "Activation", "Ownership", "Clarity"] as const;

const CmsAssessment = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<AssessmentConfig>(JSON.parse(JSON.stringify(config.assessment)));
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const update = <K extends keyof AssessmentConfig>(key: K, value: AssessmentConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuestion = (index: number, field: keyof AssessmentQuestion, value: any) => {
    const questions = [...draft.questions];
    questions[index] = { ...questions[index], [field]: value };
    update("questions", questions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: "label" | "score", value: string | number) => {
    const questions = [...draft.questions];
    const options = [...questions[qIndex].options];
    options[oIndex] = { ...options[oIndex], [field]: value };
    questions[qIndex] = { ...questions[qIndex], options };
    update("questions", questions);
  };

  const updateIdentity = (index: number, field: string, value: string | number) => {
    const types = [...draft.identityTypes];
    types[index] = { ...types[index], [field]: value };
    update("identityTypes", types);
  };

  const save = () => {
    updateSection("assessment", draft);
    toast.success("Assessment settings updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Assessment</h2>
        <p className="text-sm text-muted-foreground">Edit assessment intro, questions, identity types, and results copy.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Settings</h3>
        <div className="space-y-2">
          <Label>Intro Text</Label>
          <Textarea value={draft.introText} onChange={(e) => update("introText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Time Estimate</Label>
          <Input value={draft.timeEstimate} onChange={(e) => update("timeEstimate", e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">Questions: {draft.questions.length} (fixed for MVP)</p>
      </section>

      {draft.questions.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Questions</h3>
          {draft.questions.map((q, qi) => (
            <div key={qi} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 text-left text-sm hover:bg-muted/50"
                onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}
              >
                <span className="font-medium">Q{qi + 1}: {q.text.slice(0, 50)}{q.text.length > 50 ? "…" : ""}</span>
                {expandedQ === qi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedQ === qi && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  <div className="space-y-1">
                    <Label>Question Text</Label>
                    <Textarea value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label>Dimension</Label>
                    <Select value={q.dimension} onValueChange={(v) => updateQuestion(qi, "dimension", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIMENSIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Answer Options</Label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2 items-center">
                        <Input placeholder="Label" value={opt.label} onChange={(e) => updateOption(qi, oi, "label", e.target.value)} className="flex-1" />
                        <Input type="number" value={opt.score} onChange={(e) => updateOption(qi, oi, "score", Number(e.target.value))} className="w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Identity Types</h3>
        {draft.identityTypes.map((type, i) => (
          <div key={type.id} className="border rounded-lg p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-mono">{type.id}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Display Name</Label>
                <Input value={type.displayName} onChange={(e) => updateIdentity(i, "displayName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Icon</Label>
                <Input value={type.icon} onChange={(e) => updateIdentity(i, "icon", e.target.value)} className="w-20" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={type.description} onChange={(e) => updateIdentity(i, "description", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Min Score</Label>
                <Input type="number" value={type.minScore} onChange={(e) => updateIdentity(i, "minScore", Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Max Score</Label>
                <Input type="number" value={type.maxScore} onChange={(e) => updateIdentity(i, "maxScore", Number(e.target.value))} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Results Page</h3>
        <div className="space-y-2">
          <Label>Tension Text</Label>
          <Textarea value={draft.tensionText} onChange={(e) => update("tensionText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Score Label</Label>
          <Input value={draft.scoreLabel} onChange={(e) => update("scoreLabel", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Share Button Text (XX = score)</Label>
          <Input value={draft.shareButtonText} onChange={(e) => update("shareButtonText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input value={draft.ctaText} onChange={(e) => update("ctaText", e.target.value)} />
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Assessment</Button>
    </div>
  );
};

export default CmsAssessment;
