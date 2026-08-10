import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { CmsPageHeader, EditorCard, EditableField } from "@/components/cms/cms-ui";
import {
  useMentorSuggestedPrompts,
  FALLBACK_MENTOR_PROMPTS,
  type MentorPromptContext,
} from "@/hooks/useMentorSuggestedPrompts";

const CARDS: { key: MentorPromptContext; title: string }[] = [
  { key: "default", title: "Default prompts" },
  { key: "day1", title: "Day 1 prompts" },
  { key: "day2", title: "Day 2 prompts" },
  { key: "day3", title: "Day 3 prompts" },
];

const AdminMentorPrompts = () => {
  const { prompts, loading } = useMentorSuggestedPrompts();
  const [draft, setDraft] = useState<Record<MentorPromptContext, string[]>>(
    FALLBACK_MENTOR_PROMPTS,
  );
  const [saving, setSaving] = useState<MentorPromptContext | null>(null);

  useEffect(() => {
    if (!loading) setDraft(prompts);
  }, [loading, prompts]);

  const save = async (key: MentorPromptContext) => {
    setSaving(key);
    try {
      const cleaned = (draft[key] ?? []).map((p) => p.trim()).filter(Boolean);
      const { error } = await supabase
        .from("mentor_suggested_prompts")
        .upsert({ context: key, prompts: cleaned }, { onConflict: "context" });
      if (error) throw error;
      toast.success("Saved");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="AI Coach prompts"
        description="Starter questions shown on the AI Coach page, per context."
      />
      {CARDS.map(({ key, title }) => (
        <EditorCard key={key} title={title}>
          {[0, 1, 2, 3].map((i) => (
            <EditableField
              key={i}
              label={`Prompt ${i + 1}`}
              value={draft[key]?.[i] ?? ""}
              onChange={(v) =>
                setDraft((d) => {
                  const arr = [...(d[key] ?? [])];
                  while (arr.length < 4) arr.push("");
                  arr[i] = v;
                  return { ...d, [key]: arr };
                })
              }
            />
          ))}
          <div className="flex justify-end">
            <Button onClick={() => save(key)} disabled={saving === key}>
              {saving === key ? "Saving..." : "Save"}
            </Button>
          </div>
        </EditorCard>
      ))}
    </div>
  );
};

export default AdminMentorPrompts;
