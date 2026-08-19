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

/**
 * Day 2 Buttons editor.
 *
 * Single source of truth: the `site_content` rows on page "day2", section
 * "buttons" — exactly what the Challenger's Day 2 screen reads through
 * useSiteContent("day2"). No second store, no localStorage mirror.
 */

const PAGE = "day2";
const SECTION = "buttons";
const PREVIEW_URL = "/challenge/day/2";

const FIELDS: { key: string; label: string; helper: string; fallback: string }[] = [
  {
    key: "retake_quiz",
    label: "Retake quiz button",
    helper: "Green button under the teaching cards. Opens the quiz in a new tab.",
    fallback: "Take the quiz for this challenge again",
  },
  {
    key: "generate_locked",
    label: "Generate quiz — locked state",
    helper: "Greyed-out button shown before all three sections are marked as read.",
    fallback: "Mark 1, 2 & 3 as read to generate your quiz",
  },
  {
    key: "generate_unlocked",
    label: "Generate quiz — unlocked state",
    helper: "The live button that opens the quiz builder in a new tab.",
    fallback: "Generate your quiz now",
  },
  {
    key: "generate_busy",
    label: "Generating (busy) label",
    helper: "Shown on the same button while the quiz is being generated.",
    fallback: "Generating your quiz...",
  },
  {
    key: "upsell",
    label: "Premium upsell button",
    helper: "Bottom card button. Opens the training / membership page.",
    fallback: "Check Out Premium Membership",
  },
];

const AdminDay2ButtonCopy = () => {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchPageContent(PAGE);
        if (cancelled) return;
        const mine = all.filter((r) => r.section === SECTION);
        setRows(mine);
        const next: Record<string, string> = {};
        FIELDS.forEach((f) => {
          const row = mine.find((r) => r.key === f.key);
          next[f.key] = row?.value ?? f.fallback;
        });
        setValues(next);
      } catch {
        const next: Record<string, string> = {};
        FIELDS.forEach((f) => { next[f.key] = f.fallback; });
        setValues(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rowByKey = useMemo(
    () => new Map(rows.map((r) => [r.key, r] as const)),
    [rows],
  );

  const save = async () => {
    setSaving(true);
    try {
      for (const [idx, field] of FIELDS.entries()) {
        const value = values[field.key] ?? field.fallback;
        const existing = rowByKey.get(field.key);
        if (existing) {
          const { error } = await supabase
            .from("site_content")
            .update({ value, label: field.label })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_content").insert({
            page: PAGE,
            section: SECTION,
            key: field.key,
            value,
            value_type: "text",
            label: field.label,
            sort_order: idx + 1,
          });
          if (error) throw error;
        }
      }
      const refreshed = await fetchPageContent(PAGE);
      setRows(refreshed.filter((r) => r.section === SECTION));
      invalidatePage(PAGE);
      toast.success("Day 2 button labels saved");
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <CmsPageHeader
        title="Day 2 Buttons"
        description="The buttons a participant sees on the Day 2 build-your-quiz page. Editing a field here changes that exact button straight away."
      />

      <div className="mt-6 space-y-6">
        <EditorCard
          title="Button labels"
          description="Each field names the button it controls."
          action={
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Preview Day 2
              </a>
            </Button>
          }
        >
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            FIELDS.map((f) => (
              <EditableField
                key={f.key}
                label={f.label}
                helper={f.helper}
                value={values[f.key] ?? ""}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                placeholder={f.fallback}
              />
            ))
          )}
        </EditorCard>
      </div>

      <StickyActionBar onSave={save} saving={saving} />
    </div>
  );
};

export default AdminDay2ButtonCopy;
