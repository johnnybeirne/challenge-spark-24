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
import {
  DAY3_PAGE,
  DAY3_FIELDS,
  HEADER_FIELDS,
  TRAINING_FIELDS,
  TASK_FIELDS,
  SCREEN_FIELDS,
  COPILOT_FIELDS,
  BUTTON_FIELDS,
  CELEBRATION_FIELDS,
  TOAST_FIELDS,
  day3FieldId,
  type Day3Field,
} from "@/lib/day3Content";

/**
 * Day 3 — one full editor.
 *
 * Sections follow the order the participant meets them: header, training block,
 * tasks, screen text, assistant framing, buttons, celebration, toasts.
 *
 * One shared source: site_content rows on page "day3". Day 3 has no body
 * generation function of its own, so there is no AI config section here.
 */

const PREVIEW_URL = "/challenge/day/3";

const AdminDay3 = () => {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchPageContent(DAY3_PAGE);
        if (cancelled) return;
        setRows(all);
        const next: Record<string, string> = {};
        DAY3_FIELDS.forEach((f) => {
          const row = all.find((r) => r.section === f.section && r.key === f.key);
          next[day3FieldId(f)] = row?.value ?? f.fallback;
        });
        setValues(next);
      } catch {
        const next: Record<string, string> = {};
        DAY3_FIELDS.forEach((f) => { next[day3FieldId(f)] = f.fallback; });
        if (!cancelled) setValues(next);
      }
      if (!cancelled) setLoading(false);
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
      for (const [idx, field] of DAY3_FIELDS.entries()) {
        const value = values[day3FieldId(field)] ?? field.fallback;
        const existing = rowIndex.get(day3FieldId(field));
        if (existing) {
          const { error } = await supabase
            .from("site_content")
            .update({ value, label: field.label })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_content").insert({
            page: DAY3_PAGE,
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

      const refreshed = await fetchPageContent(DAY3_PAGE);
      setRows(refreshed);
      invalidatePage(DAY3_PAGE);
      toast.success("Day 3 saved");
    } catch {
      toast.error("Could not save. Admin access required.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: Day3Field) => (
    <EditableField
      key={day3FieldId(f)}
      label={f.label}
      helper={f.helper}
      value={values[day3FieldId(f)] ?? ""}
      onChange={(v) => setValues((prev) => ({ ...prev, [day3FieldId(f)]: v }))}
      placeholder={f.fallback}
      multiline={f.multiline}
      rows={f.rows}
    />
  );

  const previewAction = (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" /> Preview Day 3
      </a>
    </Button>
  );

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <CmsPageHeader
        title="Day 3"
        description="Everything a participant reads on Day 3, in the order they see it: header, training block, tasks, screen text, assistant framing, buttons, the launch celebration, and toasts."
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <EditorCard
            title="Header"
            description="The eyebrow, title, subtitle, and the italic context line at the top."
            action={previewAction}
          >
            {HEADER_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Training block"
            description="The briefing pop-up copy and the lesson panel inside the optional briefing."
          >
            {TRAINING_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Tasks"
            description="The five action task labels, in order."
          >
            {TASK_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Screen text"
            description="The completed banner, the task list label, the build note, the live URL labels, and the spotlight heading."
          >
            {SCREEN_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Assistant framing"
            description="How the AI training card introduces itself, and the prompts it suggests."
          >
            {COPILOT_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard title="Buttons" description="Each field names the button it controls.">
            {BUTTON_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Celebration"
            description="The launch screen and the Builder Circle card shown after Day 3 is finished."
          >
            {CELEBRATION_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Toasts"
            description="The small confirmations that appear as answers are saved and invites are sent."
          >
            {TOAST_FIELDS.map(renderField)}
          </EditorCard>
        </div>
      )}

      <StickyActionBar onSave={save} saving={saving} />
    </div>
  );
};

export default AdminDay3;
