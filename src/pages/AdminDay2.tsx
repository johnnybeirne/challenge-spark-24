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
 * Day 2 — one full editor.
 *
 * Sections follow the order the participant sees them:
 * Header, Card content, Screen text, Buttons, AI card-body prompt.
 *
 * Sources are unchanged:
 *  - copy   -> site_content rows on page "day2" (sections header / cards / hint / ui / buttons)
 *  - prompt -> day2_ai_config.cards_prompt, read at runtime by day2-thread
 */

const PAGE = "day2";
const PREVIEW_URL = "/challenge/day/2";

type Field = {
  section: string;
  key: string;
  label: string;
  helper: string;
  fallback: string;
  multiline?: boolean;
  rows?: number;
};

const HEADER_FIELDS: Field[] = [
  { section: "header", key: "title", label: "Page title", helper: "Big heading at the top of the Day 2 screen.", fallback: "Build your quiz" },
  {
    section: "header",
    key: "subtitle",
    label: "Page subtitle",
    helper: "Line under the title.",
    fallback: "Your quiz starts the conversation. Your challenge builds the trust that converts.",
    multiline: true,
    rows: 2,
  },
  { section: "ui", key: "intro", label: "Italic context line", helper: "Italic line under the subtitle. Use {audience} for the participant's audience.", fallback: "You're building this for {audience}." },
];

const CARD_FIELDS: Field[][] = [1, 2, 3].map((n) => [
  {
    section: "cards",
    key: `${n}.title`,
    label: `Card ${n} title`,
    helper: `The heading on reveal card ${n} in the teaching section.`,
    fallback: "",
  },
  {
    section: "cards",
    key: `${n}.body_fallback`,
    label: `Card ${n} body fallback`,
    helper:
      "Used when the AI cannot generate a body. Keep one sentence per paragraph with a blank line between sentences. Tokens: {firstName} {audience} {superpower} {problem} {outcome} {promise}.",
    fallback: "",
    multiline: true,
    rows: 8,
  },
]);

const SCREEN_FIELDS: Field[] = [
  { section: "cards", key: "mark_read", label: "Mark as read button", helper: "Button at the bottom of an open card.", fallback: "Mark as read to continue" },
  { section: "cards", key: "marked_read", label: "Marked as read confirmation", helper: "Shown after a card has been marked as read.", fallback: "Marked as read" },
  { section: "cards", key: "sender_name", label: "Card message sender name", helper: "Name shown beside the avatar inside each card.", fallback: "Johnny B AI" },
  { section: "cards", key: "sender_status_thinking", label: "Sender status while writing", helper: "Small label while the card body is streaming.", fallback: "Thinking…" },
  { section: "cards", key: "sender_status_done", label: "Sender status when finished", helper: "Small label after the card body has finished.", fallback: "Message" },
  { section: "hint", key: "locked", label: "Locked hint bubble", helper: "Pops up when the participant taps the locked generate button.", fallback: 'Read each section above and tap "Mark as read" on 1, 2 and 3 to unlock.' },
  { section: "hint", key: "locked_tooltip", label: "Locked button tooltip", helper: "Hover tooltip on the locked generate button.", fallback: "Mark all three sections as read to unlock" },
  { section: "ui", key: "assets_note_title", label: "Downloads note title", helper: "Title of the note under the unlocked generate button.", fallback: "Your quiz downloads will land in Your Assets" },
  { section: "ui", key: "assets_note_body", label: "Downloads note body", helper: "Body of that same note.", fallback: "Opens in a new tab. When your quiz is ready, your Word doc and Google Doc will be waiting on your dashboard.", multiline: true, rows: 3 },
  { section: "ui", key: "assets_link", label: "Your Assets link text", helper: "Link text at the end of the download notes.", fallback: "Go to Your Assets" },
  { section: "ui", key: "quiz_ready_title", label: "Quiz ready title", helper: "Shown once the quiz assets exist.", fallback: "Your quiz assets are ready" },
  { section: "ui", key: "quiz_ready_body", label: "Quiz ready body", helper: "Body of the quiz ready panel.", fallback: "Download your quiz right here, or grab it any time from Your Assets on your dashboard.", multiline: true, rows: 3 },
  { section: "ui", key: "upsell_title", label: "Upsell card heading", helper: "Heading above the membership button.", fallback: "Want to go deeper on quiz funnel strategy?" },
];

const BUTTON_FIELDS: Field[] = [
  { section: "buttons", key: "retake_quiz", label: "Retake quiz button", helper: "Green button under the teaching cards. Opens the quiz in a new tab.", fallback: "Take the quiz for this challenge again" },
  { section: "buttons", key: "generate_locked", label: "Generate quiz — locked state", helper: "Greyed-out button shown before all three sections are marked as read.", fallback: "Mark 1, 2 & 3 as read to generate your quiz" },
  { section: "buttons", key: "generate_unlocked", label: "Generate quiz — unlocked state", helper: "The live button that opens the quiz builder in a new tab.", fallback: "Generate your quiz now" },
  { section: "buttons", key: "generate_busy", label: "Generating (busy) label", helper: "Shown on the same button while the quiz is being generated.", fallback: "Generating your quiz..." },
  { section: "buttons", key: "upsell", label: "Premium upsell button", helper: "Bottom card button. Opens the training / membership page.", fallback: "Check Out Premium Membership" },
];

const ALL_FIELDS: Field[] = [
  ...HEADER_FIELDS,
  ...CARD_FIELDS.flat(),
  ...SCREEN_FIELDS,
  ...BUTTON_FIELDS,
];

const fieldId = (f: Field): string => `${f.section}.${f.key}`;

const AdminDay2 = () => {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchPageContent(PAGE);
        if (cancelled) return;
        setRows(all);
        const next: Record<string, string> = {};
        ALL_FIELDS.forEach((f) => {
          const row = all.find((r) => r.section === f.section && r.key === f.key);
          next[fieldId(f)] = row?.value ?? f.fallback;
        });
        setValues(next);
      } catch {
        const next: Record<string, string> = {};
        ALL_FIELDS.forEach((f) => { next[fieldId(f)] = f.fallback; });
        setValues(next);
      }

      const { data } = await (supabase.from("day2_ai_config") as any)
        .select("id,cards_prompt")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPromptId(data.id ?? null);
        setPrompt(data.cards_prompt ?? "");
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
      for (const [idx, field] of ALL_FIELDS.entries()) {
        const value = values[fieldId(field)] ?? field.fallback;
        const existing = rowIndex.get(fieldId(field));
        if (existing) {
          const { error } = await supabase
            .from("site_content")
            .update({ value, label: field.label })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_content").insert({
            page: PAGE,
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

      const table = supabase.from("day2_ai_config") as any;
      if (promptId) {
        const { error } = await table
          .update({ cards_prompt: prompt, updated_at: new Date().toISOString() })
          .eq("id", promptId);
        if (error) throw error;
      } else {
        const { data, error } = await table
          .insert({ cards_prompt: prompt })
          .select()
          .single();
        if (error) throw error;
        if (data?.id) setPromptId(data.id);
      }

      const refreshed = await fetchPageContent(PAGE);
      setRows(refreshed);
      invalidatePage(PAGE);
      toast.success("Day 2 saved");
    } catch {
      toast.error("Could not save. Admin access required.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: Field) => (
    <EditableField
      key={fieldId(f)}
      label={f.label}
      helper={f.helper}
      value={values[fieldId(f)] ?? ""}
      onChange={(v) => setValues((prev) => ({ ...prev, [fieldId(f)]: v }))}
      placeholder={f.fallback}
      multiline={f.multiline}
      rows={f.rows}
    />
  );

  const previewAction = (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" /> Preview Day 2
      </a>
    </Button>
  );

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <CmsPageHeader
        title="Day 2"
        description="Everything a participant reads on the Day 2 build-your-quiz screen, in the order they see it: header, cards, screen text, buttons, and the prompt that writes the card bodies."
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <EditorCard
            title="Header"
            description="Title, subtitle and the italic context line at the top of the screen."
            action={previewAction}
          >
            {HEADER_FIELDS.map(renderField)}
          </EditorCard>

          {CARD_FIELDS.map((group, i) => (
            <EditorCard
              key={i}
              title={`Card content — card ${i + 1}`}
              description="Title and the body used if the AI cannot write one."
            >
              {group.map(renderField)}
            </EditorCard>
          ))}

          <EditorCard
            title="Screen text"
            description="Mark-as-read labels, hints, notes and other on-screen strings."
          >
            {SCREEN_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Buttons"
            description="Each field names the button it controls."
          >
            {BUTTON_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="AI card-body prompt"
            description="Controls how the three card bodies are written. Keep the rule of one sentence per paragraph with a blank line between every sentence."
          >
            <EditableField
              label="Card bodies prompt"
              helper="Tokens available: {firstName} {audience} {superpower} {problem} {outcome} {promise} {nameRule}. Leave this empty and the card body fallbacks above are used instead."
              value={prompt}
              onChange={setPrompt}
              multiline
              rows={18}
            />
          </EditorCard>
        </div>
      )}

      <StickyActionBar onSave={save} saving={saving} />
    </div>
  );
};

export default AdminDay2;
