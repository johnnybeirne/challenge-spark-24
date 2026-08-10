import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/Spinner";
import { CmsPageHeader, EditorCard } from "@/components/cms/cms-ui";
import {
  useCopilotSettings,
  COPILOT_SETTINGS_FALLBACK,
  type CopilotSettings,
} from "@/hooks/useCopilotSettings";

type CardKey = "copy" | "prompt" | "tokens" | "fallback";

const AdminAiCoachSettings = () => {
  const { settings, loading } = useCopilotSettings();
  const [draft, setDraft] = useState<CopilotSettings>(COPILOT_SETTINGS_FALLBACK);
  const [saving, setSaving] = useState<CardKey | null>(null);

  useEffect(() => {
    if (!loading) setDraft(settings);
  }, [loading, settings]);

  const save = async (key: CardKey, payload: Record<string, unknown>) => {
    setSaving(key);
    try {
      const table = supabase.from("copilot_config") as any;
      if (draft.id) {
        const { error } = await table.update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { data, error } = await table.insert(payload).select().single();
        if (error) throw error;
        if (data?.id) setDraft((d) => ({ ...d, id: data.id }));
      }
      toast.success("Saved");
    } catch {
      toast.error("Could not save. Admin access required.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      <CmsPageHeader
        title="AI Coach settings"
        description="Page copy, system prompt, response length, and fallback message for the AI Coach."
      />

      <EditorCard title="Page copy">
        <div className="space-y-2">
          <Label htmlFor="page-heading">Page heading</Label>
          <Input
            id="page-heading"
            value={draft.page_heading}
            onChange={(e) => setDraft((d) => ({ ...d, page_heading: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-subheading">Page subheading</Label>
          <Textarea
            id="page-subheading"
            rows={3}
            value={draft.page_subheading}
            onChange={(e) => setDraft((d) => ({ ...d, page_subheading: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save("copy", {
                page_heading: draft.page_heading.trim(),
                page_subheading: draft.page_subheading.trim(),
              })
            }
            disabled={saving === "copy"}
          >
            {saving === "copy" ? "Saving..." : "Save"}
          </Button>
        </div>
      </EditorCard>

      <EditorCard title="System prompt">
        <div className="space-y-2">
          <Label htmlFor="system-prompt">System prompt</Label>
          <Textarea
            id="system-prompt"
            rows={12}
            value={draft.system_prompt}
            onChange={(e) => setDraft((d) => ({ ...d, system_prompt: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            This is the instruction sent to the AI before every conversation. Be specific and concise.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => save("prompt", { system_prompt: draft.system_prompt.trim() })}
            disabled={saving === "prompt"}
          >
            {saving === "prompt" ? "Saving..." : "Save"}
          </Button>
        </div>
      </EditorCard>

      <EditorCard title="Response length">
        <div className="space-y-2">
          <Label htmlFor="max-tokens">Max response tokens</Label>
          <Input
            id="max-tokens"
            type="number"
            min={50}
            max={4000}
            value={draft.max_tokens}
            onChange={(e) =>
              setDraft((d) => ({ ...d, max_tokens: Number(e.target.value) }))
            }
          />
          <p className="text-xs text-muted-foreground">
            200 tokens is roughly 150 words. Lower = shorter answers.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save("tokens", { max_tokens: Math.max(50, Number(draft.max_tokens) || 200) })
            }
            disabled={saving === "tokens"}
          >
            {saving === "tokens" ? "Saving..." : "Save"}
          </Button>
        </div>
      </EditorCard>

      <EditorCard title="Fallback message">
        <div className="space-y-2">
          <Label htmlFor="fallback">Fallback message</Label>
          <Textarea
            id="fallback"
            rows={4}
            value={draft.fallback_message}
            onChange={(e) => setDraft((d) => ({ ...d, fallback_message: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Shown when no answer can be produced.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save("fallback", { fallback_message: draft.fallback_message.trim() })
            }
            disabled={saving === "fallback"}
          >
            {saving === "fallback" ? "Saving..." : "Save"}
          </Button>
        </div>
      </EditorCard>
    </div>
  );
};

export default AdminAiCoachSettings;
