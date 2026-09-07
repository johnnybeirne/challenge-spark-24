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

const ScorecardImageUploader = ({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp|gif)$/i.test(file.type)) {
      toast.error("Use a JPG, PNG, WEBP or GIF image.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `scorecard/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("site-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded. Save to publish it.");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      {value && (
        <div className="flex flex-col items-start gap-2">
          <img
            src={value}
            alt="Scorecard"
            className="max-h-48 w-full max-w-sm rounded-lg border object-cover"
          />
          <button
            type="button"
            className="text-sm text-red-500/80 underline hover:text-red-500"
            onClick={() => onChange("")}
          >
            Remove image
          </button>
        </div>
      )}
      <label
        className={`flex items-center gap-3 rounded-md border border-dashed px-4 py-4 text-sm ${
          uploading ? "pointer-events-none opacity-60" : "cursor-pointer hover:bg-muted/50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
        <span>{uploading ? "Uploading…" : value ? "Replace image" : "Upload an image"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
};

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
