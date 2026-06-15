import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import { QUIZ_TIP_KEYS, QuizPreviewTips, QuizTipKey } from "@/hooks/useQuizPreviewTips";

const FIELDS: Array<{
  key: QuizTipKey;
  title: string;
  description: string;
  label: string;
}> = [
  {
    key: "audience_eyebrow",
    title: "Audience eyebrow",
    description: 'The "Built for [audience]" line above the hero headline.',
    label: "Advice shown on hover",
  },
  {
    key: "hero_headline",
    title: "Hero headline",
    description: 'Next to the "Frustrated with…" headline at the top of the quiz.',
    label: "Advice shown on hover",
  },
  {
    key: "subheading",
    title: "Subheading",
    description: 'Next to the "Take the two-minute quiz…" line under the headline.',
    label: "Advice shown on hover",
  },
  {
    key: "problem_section",
    title: "Problem section heading",
    description: 'Next to "The problem" eyebrow + the big restated problem sentence.',
    label: "Advice shown on hover",
  },
  {
    key: "problem_paragraph",
    title: "Problem supporting paragraph",
    description: 'Next to the "Most [audience] stay stuck here…" line under the problem heading.',
    label: "Advice shown on hover",
  },
  {
    key: "pain_guessing",
    title: "Pain card 1 — Guessing what to fix",
    description: "First of the three pain cards under the problem section.",
    label: "Advice shown on hover",
  },
  {
    key: "pain_generic",
    title: "Pain card 2 — Too much generic advice",
    description: "Second of the three pain cards.",
    label: "Advice shown on hover",
  },
  {
    key: "pain_wasted",
    title: "Pain card 3 — Wasted effort",
    description: "Third of the three pain cards.",
    label: "Advice shown on hover",
  },
  {
    key: "reveals_section",
    title: "What the quiz reveals",
    description: 'Next to the "What the quiz reveals" eyebrow above the four bullets.',
    label: "Advice shown on hover",
  },
];

const DEFAULTS: QuizPreviewTips = QUIZ_TIP_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: "" }),
  {} as QuizPreviewTips,
);

const AdminQuizPreviewTips = () => {
  const [tips, setTips] = useState<QuizPreviewTips>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("quiz_preview_tips")
        .select("key,tip");
      if (cancelled) return;
      if (!error && data) {
        const next: QuizPreviewTips = { ...DEFAULTS };
        for (const row of data as Array<{ key: string; tip: string }>) {
          if ((QUIZ_TIP_KEYS as readonly string[]).includes(row.key)) {
            next[row.key as QuizTipKey] = row.tip ?? "";
          }
        }
        setTips(next);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const rows = QUIZ_TIP_KEYS.map((key) => ({ key, tip: tips[key] }));
    const { error } = await supabase
      .from("quiz_preview_tips")
      .upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save tips: " + error.message);
      return;
    }
    toast.success("Tips saved");
  };

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Quiz preview tips"
        description="Edit the little (?) hover advice shown next to sections of the quiz preview. Leave a field blank to hide its icon."
      />

      {FIELDS.map((f) => (
        <EditorCard key={f.key} title={f.title} description={f.description}>
          <EditableField
            label={f.label}
            helper="Keep it short — 1–3 sentences. Plain text only."
            value={loading ? "" : tips[f.key]}
            onChange={(v) => setTips((p) => ({ ...p, [f.key]: v }))}
            multiline
            rows={3}
            placeholder="Tip text…"
          />
        </EditorCard>
      ))}

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminQuizPreviewTips;
