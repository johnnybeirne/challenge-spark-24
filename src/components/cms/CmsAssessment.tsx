import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type AssessmentConfig } from "@/context/SiteConfigContext";

const CmsAssessment = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<AssessmentConfig>(JSON.parse(JSON.stringify(config.assessment)));

  const update = <K extends keyof AssessmentConfig>(key: K, value: AssessmentConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    updateSection("assessment", draft);
    toast.success("Assessment settings updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Assessment</h2>
        <p className="text-sm text-muted-foreground">Edit the assessment landing page, question intro, result text, and CTA copy.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Assessment Landing Page</h3>
        <div className="space-y-2">
          <Label>Eyebrow</Label>
          <Input value={draft.landingEyebrow} onChange={(e) => update("landingEyebrow", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input value={draft.landingHeadline} onChange={(e) => update("landingHeadline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Subheadline</Label>
          <Textarea value={draft.landingSubheadline} onChange={(e) => update("landingSubheadline", e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>CTA Button</Label>
          <Input value={draft.landingPrimaryCta} onChange={(e) => update("landingPrimaryCta", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Supporting Text</Label>
          <Input value={draft.landingSupportingText} onChange={(e) => update("landingSupportingText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Trust Line</Label>
          <Input value={draft.landingTrustLine} onChange={(e) => update("landingTrustLine", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Benefit Points</Label>
          {(draft.landingPoints ?? []).map((point, i) => (
            <Input
              key={i}
              value={point}
              onChange={(e) => {
                const points = [...(draft.landingPoints ?? [])];
                points[i] = e.target.value;
                update("landingPoints", points);
              }}
            />
          ))}
        </div>
        <div className="space-y-2">
          <Label>Result Preview Title</Label>
          <Input value={draft.landingPreviewTitle} onChange={(e) => update("landingPreviewTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Result Preview Items</Label>
          {(draft.landingPreviewItems ?? []).map((item, i) => (
            <Input
              key={i}
              value={item}
              onChange={(e) => {
                const items = [...(draft.landingPreviewItems ?? [])];
                items[i] = e.target.value;
                update("landingPreviewItems", items);
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Assessment Intro Fallback</h3>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={draft.introTitle} onChange={(e) => update("introTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Body Text</Label>
          <Textarea value={draft.introText} onChange={(e) => update("introText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Time Estimate</Label>
          <Input value={draft.timeEstimate} onChange={(e) => update("timeEstimate", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Split Question (Q1)</h3>
        <div className="space-y-2">
          <Label>Question Text</Label>
          <Input value={draft.splitQuestionText} onChange={(e) => update("splitQuestionText", e.target.value)} />
        </div>
        {draft.splitOptions.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={opt.label}
              onChange={(e) => {
                const opts = [...draft.splitOptions];
                opts[i] = { ...opts[i], label: e.target.value };
                update("splitOptions", opts);
              }}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground font-mono w-10">{opt.value}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Questions 2-9 are defined in code per track (B2B / B2C). Override via CMS coming soon.</p>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Results — Tension Text</h3>
        <div className="space-y-2">
          <Label>B2B Tension Text</Label>
          <Textarea value={draft.b2bTensionText} onChange={(e) => update("b2bTensionText", e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>B2C Tension Text</Label>
          <Textarea value={draft.b2cTensionText} onChange={(e) => update("b2cTensionText", e.target.value)} rows={3} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Results — Share Copy</h3>
        <div className="space-y-2">
          <Label>B2B Share Text ([style] = dynamic)</Label>
          <Input value={draft.b2bShareText} onChange={(e) => update("b2bShareText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>B2C Share Text ([style] = dynamic)</Label>
          <Input value={draft.b2cShareText} onChange={(e) => update("b2cShareText", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">CTA</h3>
        <div className="space-y-2">
          <Label>CTA Button Text</Label>
          <Input value={draft.ctaText} onChange={(e) => update("ctaText", e.target.value)} />
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Assessment</Button>
    </div>
  );
};

export default CmsAssessment;
