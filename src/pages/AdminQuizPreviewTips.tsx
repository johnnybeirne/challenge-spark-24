import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";

type Tips = { hero_headline: string; subheading: string };

const DEFAULTS: Tips = { hero_headline: "", subheading: "" };

const AdminQuizPreviewTips = () => {
  const [tips, setTips] = useState<Tips>(DEFAULTS);
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
        const next: Tips = { ...DEFAULTS };
        for (const row of data as Array<{ key: string; tip: string }>) {
          if (row.key === "hero_headline" || row.key === "subheading") {
            next[row.key] = row.tip ?? "";
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
    const rows = [
      { key: "hero_headline", tip: tips.hero_headline },
      { key: "subheading", tip: tips.subheading },
    ];
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
        description="Edit the little (?) hover advice that appears next to sections of the quiz preview. Leave a field blank to hide its icon."
      />

      <EditorCard
        title="Hero headline tip"
        description='Appears next to the "Frustrated with…" headline at the top of the quiz.'
      >
        <EditableField
          label="Advice shown on hover"
          helper="Keep it short — 1–3 sentences. Plain text only."
          value={loading ? "" : tips.hero_headline}
          onChange={(v) => setTips((p) => ({ ...p, hero_headline: v }))}
          multiline
          rows={4}
          placeholder="e.g. This headline calls out the exact frustration your audience feels…"
        />
      </EditorCard>

      <EditorCard
        title="Subheading tip"
        description='Appears next to the "Take the two-minute quiz…" line under the headline.'
      >
        <EditableField
          label="Advice shown on hover"
          helper="Keep it short — 1–3 sentences. Plain text only."
          value={loading ? "" : tips.subheading}
          onChange={(v) => setTips((p) => ({ ...p, subheading: v }))}
          multiline
          rows={4}
          placeholder="e.g. This line sets expectations: a quick quiz with a personalised result."
        />
      </EditorCard>

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminQuizPreviewTips;
