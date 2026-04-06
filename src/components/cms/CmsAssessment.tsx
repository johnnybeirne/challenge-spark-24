import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type AssessmentConfig } from "@/context/SiteConfigContext";

const CmsAssessment = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<AssessmentConfig>({ ...config.assessment });

  const update = <K extends keyof AssessmentConfig>(key: K, value: AssessmentConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
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
        <p className="text-sm text-muted-foreground">Edit assessment intro, identity types, and results copy.</p>
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
        <p className="text-xs text-muted-foreground">Questions: 8 (fixed for MVP)</p>
      </section>

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
