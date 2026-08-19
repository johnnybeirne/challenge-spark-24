import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPageContent,
  invalidatePage,
  type SiteContentRow,
} from "@/hooks/useSiteContent";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import Step5ExamplesMatrix from "@/components/admin/Step5ExamplesMatrix";
import {
  DAY1_PAGE,
  DAY1_FIELDS,
  HEADER_FIELDS,
  OPTION_FIELDS,
  STEP_FIELD_FIELDS,
  SCREEN_FIELDS,
  BUTTON_FIELDS,
  TOAST_FIELDS,
  VIDEO_FIELDS,
  day1FieldId,
  type Day1Field,
} from "@/lib/day1Content";
import {
  defaultDay1Steps,
  fetchDay1StepsRemote,
  saveDay1StepsRemote,
  type Day1StepMessage,
} from "@/lib/day1StepMessages";

/**
 * Day 1 — one full editor.
 *
 * Sections follow the order the participant meets them:
 * Header, Step messages, Step fields, Options, Screen text, Buttons,
 * Toasts, AI prompt, Video modal.
 *
 * Sources, one shared per string:
 *  - copy         -> site_content rows on page "day1"
 *  - step prompts -> day1_step_messages
 *  - step 5 hints -> day1_step_examples (matrix editor)
 *  - AI prompt    -> day1_ai_config, read at runtime by day1-thread
 */

const PREVIEW_URL = "/challenge/day/1";

const AdminDay1 = () => {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<Day1StepMessage[]>(defaultDay1Steps);
  const [voicePrompt, setVoicePrompt] = useState("");
  const [reactionPrompt, setReactionPrompt] = useState("");
  const [promisePrompt, setPromisePrompt] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchPageContent(DAY1_PAGE);
        if (cancelled) return;
        setRows(all);
        const next: Record<string, string> = {};
        DAY1_FIELDS.forEach((f) => {
          const row = all.find((r) => r.section === f.section && r.key === f.key);
          next[day1FieldId(f)] = row?.value ?? f.fallback;
        });
        setValues(next);
      } catch {
        const next: Record<string, string> = {};
        DAY1_FIELDS.forEach((f) => { next[day1FieldId(f)] = f.fallback; });
        if (!cancelled) setValues(next);
      }

      const remoteSteps = await fetchDay1StepsRemote();
      if (!cancelled && remoteSteps) setSteps(remoteSteps);

      const { data } = await (supabase.from("day1_ai_config") as any)
        .select("id,voice_prompt,reaction_prompt,promise_prompt")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setConfigId(data.id ?? null);
        setVoicePrompt(data.voice_prompt ?? "");
        setReactionPrompt(data.reaction_prompt ?? "");
        setPromisePrompt(data.promise_prompt ?? "");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const rowIndex = useMemo(
    () => new Map<string, SiteContentRow>(rows.map((r) => [`${r.section}.${r.key}`, r])),
    [rows],
  );

  const save = async () => {
    setSaving(true);
    try {
      for (const [idx, field] of DAY1_FIELDS.entries()) {
        const value = values[day1FieldId(field)] ?? field.fallback;
        const existing = rowIndex.get(day1FieldId(field));
        if (existing) {
          const { error } = await supabase
            .from("site_content")
            .update({ value, label: field.label })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_content").insert({
            page: DAY1_PAGE,
            section: field.section,
            key: field.key,
            value,
            value_type: "text",
            label: field.label,
            sort_order: idx + 1,
          });
          if (error) throw error;
        }
      }

      const { error: stepError } = await saveDay1StepsRemote(steps);
      if (stepError) throw stepError;

      const table = supabase.from("day1_ai_config") as any;
      const payload = {
        voice_prompt: voicePrompt,
        reaction_prompt: reactionPrompt,
        promise_prompt: promisePrompt,
      };
      if (configId) {
        const { error } = await table
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await table.insert(payload).select().single();
        if (error) throw error;
        if (data?.id) setConfigId(data.id);
      }

      const refreshed = await fetchPageContent(DAY1_PAGE);
      setRows(refreshed);
      invalidatePage(DAY1_PAGE);
      toast.success("Day 1 saved");
    } catch {
      toast.error("Could not save. Admin access required.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: Day1Field) => (
    <EditableField
      key={day1FieldId(f)}
      label={f.label}
      helper={f.helper}
      value={values[day1FieldId(f)] ?? ""}
      onChange={(v) => setValues((prev) => ({ ...prev, [day1FieldId(f)]: v }))}
      placeholder={f.fallback}
      multiline={f.multiline}
      rows={f.rows}
    />
  );

  const previewAction = (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" /> Preview Day 1
      </a>
    </Button>
  );

  const sectionFields = (fields: Day1Field[], section: string) =>
    fields.filter((f) => f.section === section);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <CmsPageHeader
        title="Day 1"
        description="Everything a participant reads on the Day 1 promise builder, in the order they see it: header, step prompts, field copy, options, screen text, buttons, toasts, the AI prompt, and the video pop-up."
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <EditorCard
            title="Header"
            description="The step counter line and the welcome block at the top of the screen."
            action={previewAction}
          >
            {HEADER_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Step messages"
            description="The coach message shown at each step. Bracket tags such as [audience] are replaced with the participant's own answers."
          >
            {steps.map((s) => (
              <EditableField
                key={s.id}
                label={s.label}
                helper={`Message for ${s.id}.`}
                value={s.message}
                onChange={(v) =>
                  setSteps((prev) => prev.map((p) => (p.id === s.id ? { ...p, message: v } : p)))
                }
                multiline
                rows={4}
              />
            ))}
          </EditorCard>

          <EditorCard
            title="Step fields"
            description="Placeholders and example hints under each input. Put one example per line."
          >
            {STEP_FIELD_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Step 5 example hints"
            description="Contextual examples by audience type and audience role."
          >
            <Step5ExamplesMatrix />
          </EditorCard>

          <EditorCard
            title="Options"
            description="Audience type cards, expert types, and challenge type cards."
          >
            {OPTION_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Screen text"
            description="Recap labels, promise labels, the summary sentences, and notes."
          >
            {sectionFields(SCREEN_FIELDS, "ui").map(renderField)}
          </EditorCard>

          <EditorCard title="Buttons" description="Each field names the button it controls.">
            {BUTTON_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Toasts"
            description="The small confirmations that appear as answers are saved."
          >
            {TOAST_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="AI prompt"
            description="Controls the coach voice and the promise composer. The four part output shape (from, to, so that, and stop) is fixed and cannot be changed here."
          >
            <EditableField
              label="Coach voice"
              helper="Tone and voice rules applied to every Day 1 AI message."
              value={voicePrompt}
              onChange={setVoicePrompt}
              multiline
              rows={12}
            />
            <EditableField
              label="Step reaction prompt"
              helper="How the coach reacts to each answer before the next step."
              value={reactionPrompt}
              onChange={setReactionPrompt}
              multiline
              rows={10}
            />
            <EditableField
              label="Promise composer prompt"
              helper="Instructions for writing the challenge promise. Tokens: {audience} {problem} {process} {outcome} {superpower}."
              value={promisePrompt}
              onChange={setPromisePrompt}
              multiline
              rows={16}
            />
          </EditorCard>

          <EditorCard
            title="Video pop-up"
            description="The Day 1 briefing dialog shown the first time the screen opens."
          >
            {VIDEO_FIELDS.map(renderField)}
          </EditorCard>
        </div>
      )}

      <StickyActionBar onSave={save} saving={saving} />
    </div>
  );
};

export default AdminDay1;
