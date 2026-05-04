import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSiteConfig, type AssessmentConfig } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
  FieldLabel,
} from "./cms-ui";

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
    <div className="space-y-6">
      <CmsPageHeader
        title="Assessment"
        description="Edit the assessment landing page, intro, results, and share copy."
      />

      <EditorCard title="Assessment Landing Page" description="The page visitors see before starting the quiz.">
        <EditableField
          label="Eyebrow text"
          helper="Small line shown above the headline."
          value={draft.landingEyebrow}
          onChange={(v) => update("landingEyebrow", v)}
        />
        <EditableField
          label="Headline"
          helper="Main heading at the top of the page."
          value={draft.landingHeadline}
          onChange={(v) => update("landingHeadline", v)}
        />
        <EditableField
          label="Subheadline"
          helper="Sits directly below the headline."
          value={draft.landingSubheadline}
          onChange={(v) => update("landingSubheadline", v)}
          multiline
        />
        <EditableField
          label="Call-to-action button"
          helper="Label on the main start-the-quiz button."
          value={draft.landingPrimaryCta}
          onChange={(v) => update("landingPrimaryCta", v)}
        />
        <EditableField
          label="Supporting text"
          helper="Short reassurance line under the button."
          value={draft.landingSupportingText}
          onChange={(v) => update("landingSupportingText", v)}
        />
        <EditableField
          label="Trust line"
          helper="Tiny credibility line (e.g. 'Used by 500+ founders')."
          value={draft.landingTrustLine}
          onChange={(v) => update("landingTrustLine", v)}
        />

        <div className="space-y-2">
          <FieldLabel label="Benefit points" helper="Bullet list of what visitors will get." />
          {(draft.landingPoints ?? []).map((point, i) => (
            <Input
              key={i}
              value={point}
              className="h-11 text-base"
              onChange={(e) => {
                const points = [...(draft.landingPoints ?? [])];
                points[i] = e.target.value;
                update("landingPoints", points);
              }}
            />
          ))}
        </div>

        <EditableField
          label="Result preview title"
          helper="Heading above the example result preview."
          value={draft.landingPreviewTitle}
          onChange={(v) => update("landingPreviewTitle", v)}
        />
        <div className="space-y-2">
          <FieldLabel label="Result preview items" helper="Things shown in the preview card." />
          {(draft.landingPreviewItems ?? []).map((item, i) => (
            <Input
              key={i}
              value={item}
              className="h-11 text-base"
              onChange={(e) => {
                const items = [...(draft.landingPreviewItems ?? [])];
                items[i] = e.target.value;
                update("landingPreviewItems", items);
              }}
            />
          ))}
        </div>

        <EditableField
          label="What's inside title"
          value={draft.landingInsideTitle}
          onChange={(v) => update("landingInsideTitle", v)}
        />
        <EditableField
          label="Explanation title"
          value={draft.landingExplanationTitle}
          onChange={(v) => update("landingExplanationTitle", v)}
        />
        <EditableField
          label="Explanation body"
          value={draft.landingExplanationBody}
          onChange={(v) => update("landingExplanationBody", v)}
          multiline
          rows={4}
        />
        <EditableField
          label="FAQ title"
          value={draft.landingFaqTitle}
          onChange={(v) => update("landingFaqTitle", v)}
        />

        <div className="space-y-3">
          <FieldLabel label="FAQ items" helper="Common questions shown in the accordion." />
          {(draft.landingFaqItems ?? []).map((item, i) => (
            <div key={i} className="rounded-lg border bg-background/40 p-3 space-y-3">
              <EditableField
                label="Question"
                value={item.question}
                onChange={(v) => {
                  const items = [...(draft.landingFaqItems ?? [])];
                  items[i] = { ...items[i], question: v };
                  update("landingFaqItems", items);
                }}
              />
              <EditableField
                label="Answer"
                multiline
                rows={2}
                value={item.answer}
                onChange={(v) => {
                  const items = [...(draft.landingFaqItems ?? [])];
                  items[i] = { ...items[i], answer: v };
                  update("landingFaqItems", items);
                }}
              />
            </div>
          ))}
        </div>
      </EditorCard>

      <EditorCard title="Assessment Intro" description="Fallback intro shown right before the first question.">
        <EditableField label="Title" value={draft.introTitle} onChange={(v) => update("introTitle", v)} />
        <EditableField
          label="Body text"
          value={draft.introText}
          onChange={(v) => update("introText", v)}
          multiline
        />
        <EditableField
          label="Time estimate"
          helper="e.g. 'Takes about 2 minutes'."
          value={draft.timeEstimate}
          onChange={(v) => update("timeEstimate", v)}
        />
      </EditorCard>

      <EditorCard
        title="Audience Split Question"
        description="The first question that splits visitors into B2B or B2C tracks."
      >
        <EditableField
          label="Question text"
          value={draft.splitQuestionText}
          onChange={(v) => update("splitQuestionText", v)}
        />
        <div className="space-y-2">
          <FieldLabel label="Answer options" helper="Visitors pick one to choose their track." />
          {draft.splitOptions.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={opt.label}
                className="h-11 text-base flex-1"
                onChange={(e) => {
                  const opts = [...draft.splitOptions];
                  opts[i] = { ...opts[i], label: e.target.value };
                  update("splitOptions", opts);
                }}
              />
              <span className="text-xs text-muted-foreground font-mono w-12 text-right">{opt.value}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Questions 2–9 are defined per track in code. CMS override coming soon.
          </p>
        </div>
      </EditorCard>

      <EditorCard title="Results — Tension Text" description="The narrative shown on the results page for each audience.">
        <EditableField
          label="B2B audience"
          helper="Tension copy shown to B2B respondents."
          value={draft.b2bTensionText}
          onChange={(v) => update("b2bTensionText", v)}
          multiline
          rows={3}
        />
        <EditableField
          label="B2C audience"
          helper="Tension copy shown to B2C respondents."
          value={draft.b2cTensionText}
          onChange={(v) => update("b2cTensionText", v)}
          multiline
          rows={3}
        />
      </EditorCard>

      <EditorCard title="Results — Share Copy" description="Pre-written messages used when people share their result.">
        <EditableField
          label="B2B share text"
          helper="Use [style] as a placeholder for the dynamic style name."
          value={draft.b2bShareText}
          onChange={(v) => update("b2bShareText", v)}
        />
        <EditableField
          label="B2C share text"
          helper="Use [style] as a placeholder for the dynamic style name."
          value={draft.b2cShareText}
          onChange={(v) => update("b2cShareText", v)}
        />
      </EditorCard>

      <EditorCard title="Results CTA" description="Button shown at the bottom of the results page.">
        <EditableField
          label="CTA button text"
          value={draft.ctaText}
          onChange={(v) => update("ctaText", v)}
        />
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save assessment" />
    </div>
  );
};

export default CmsAssessment;
