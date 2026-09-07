import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  SCORECARD_LANDING_PAGE,
  SCORECARD_RESULT_PAGE,
  LANDING_FIELDS,
  RESULT_FIELDS,
  SCORECARD_FIELDS,
  scorecardFieldId,
  type ScorecardField,
} from "@/lib/pipelineScorecardContent";

/**
 * Pipeline Scorecard — one editor for the scorecard's public copy.
 *
 * Landing section edits site_content("pipeline_scorecard_landing"); the bridge
 * section edits site_content("pipeline_scorecard_result"). Same form pattern,
 * save behaviour, and admin-only access as the other owner-console editors.
 */

const PREVIEW_URL = "/pipeline-scorecard";

const AdminPipelineScorecard = () => {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pages = [SCORECARD_LANDING_PAGE, SCORECARD_RESULT_PAGE];
        const all = (await Promise.all(pages.map(fetchPageContent))).flat();
        if (cancelled) return;
        setRows(all);
        const next: Record<string, string> = {};
        SCORECARD_FIELDS.forEach((f) => {
          const row = all.find(
            (r) => r.page === f.page && r.section === f.section && r.key === f.key,
          );
          next[scorecardFieldId(f)] = row?.value ?? f.fallback;
        });
        setValues(next);
      } catch {
        const next: Record<string, string> = {};
        SCORECARD_FIELDS.forEach((f) => { next[scorecardFieldId(f)] = f.fallback; });
        if (!cancelled) setValues(next);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const rowIndex = useMemo(
    () =>
      new Map<string, SiteContentRow>(
        rows.map((r) => [`${r.page}.${r.section}.${r.key}`, r]),
      ),
    [rows],
  );

  const save = async () => {
    setSaving(true);
    try {
      for (const [idx, field] of SCORECARD_FIELDS.entries()) {
        const value = values[scorecardFieldId(field)] ?? field.fallback;
        const existing = rowIndex.get(`${field.page}.${field.section}.${field.key}`);
        if (existing) {
          const { error } = await supabase
            .from("site_content")
            .update({ value, label: field.label })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_content").insert({
            page: field.page,
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

      const pages = [SCORECARD_LANDING_PAGE, SCORECARD_RESULT_PAGE];
      const refreshed = (await Promise.all(pages.map(fetchPageContent))).flat();
      setRows(refreshed);
      pages.forEach(invalidatePage);
      toast.success("Pipeline Scorecard saved");
    } catch {
      toast.error("Could not save. Admin access required.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: ScorecardField) => (
    <EditableField
      key={`${f.page}.${scorecardFieldId(f)}`}
      label={f.label}
      helper={f.helper}
      value={values[scorecardFieldId(f)] ?? ""}
      onChange={(v) => setValues((prev) => ({ ...prev, [scorecardFieldId(f)]: v }))}
      placeholder={f.fallback}
      multiline={f.multiline}
      rows={f.rows}
    />
  );

  const previewAction = (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" /> Preview landing page
      </a>
    </Button>
  );

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <CmsPageHeader
        title="Pipeline Scorecard"
        description="The public copy for the scorecard funnel: the standalone landing page, and the bridge that sends visitors to the challenge after they see their results."
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <EditorCard
            title="Landing page"
            description="Everything a visitor reads at /pipeline-scorecard."
            action={previewAction}
          >
            {LANDING_FIELDS.map(renderField)}
          </EditorCard>

          <EditorCard
            title="Result page bridge"
            description="The handover shown under the three category scores at /pipeline-scorecard/result."
          >
            {RESULT_FIELDS.map(renderField)}
          </EditorCard>
        </div>
      )}

      <StickyActionBar onSave={save} saving={saving} />
    </div>
  );
};

export default AdminPipelineScorecard;
