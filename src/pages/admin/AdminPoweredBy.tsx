import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";
import { POWERED_BY_PAGE, POWERED_BY_DEFAULTS } from "@/lib/poweredByContent";

type Field = { key: string; label: string; textarea?: boolean; image?: boolean };

const GROUPS: { section: string; title: string; description: string; fields: Field[] }[] = [
  {
    section: "hero",
    title: "Top of the page",
    description: "The first thing people see.",
    fields: [
      { key: "logo_url", label: "Logo at the top of the page", image: true },
      { key: "eyebrow", label: "Small line above the headline" },
      { key: "title", label: "Headline" },
      { key: "title_highlight", label: "Headline (highlighted part)" },
      { key: "subtitle", label: "Paragraph under the headline", textarea: true },
    ],
  },
  {
    section: "growth",
    title: "Growth section",
    description: "The four cards explaining how a challenge grows.",
    fields: [
      { key: "eyebrow", label: "Small line above the heading" },
      { key: "heading", label: "Heading" },
    ],
  },
  {
    section: "steps",
    title: "How it works",
    description: "The three numbered steps.",
    fields: [{ key: "heading", label: "Heading" }],
  },
  {
    section: "why",
    title: "Why it works",
    description: "The section beside the network graphic.",
    fields: [
      { key: "eyebrow", label: "Small line above the heading" },
      { key: "heading", label: "Heading" },
      { key: "body", label: "Paragraph", textarea: true },
    ],
  },
  {
    section: "audience",
    title: "Who it is for",
    description: "The four benefit cards.",
    fields: [{ key: "heading", label: "Heading" }],
  },
  {
    section: "points",
    title: "Points and progression",
    description: "The tier ladder section.",
    fields: [
      { key: "eyebrow", label: "Small line above the heading" },
      { key: "heading", label: "Heading" },
      { key: "body", label: "Paragraph", textarea: true },
    ],
  },
  {
    section: "cta",
    title: "Call to action",
    description: "The purple block at the bottom.",
    fields: [
      { key: "heading", label: "Heading" },
      { key: "body", label: "Paragraph", textarea: true },
      { key: "primary_label", label: "Main button label" },
      { key: "secondary_label", label: "Second button label" },
    ],
  },
  {
    section: "footer",
    title: "Footer on every page",
    description: 'The "Powered by" line shown at the bottom of the whole site.',
    fields: [
      { key: "rights_text", label: "Copyright line (the year is added for you)" },
      { key: "powered_prefix", label: "Text before the brand name" },
      { key: "brand_label", label: "Brand name" },
      { key: "brand_url", label: "Link the brand name opens" },
    ],
  },
];

const AdminPoweredBy = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("section,key,value")
      .eq("page", POWERED_BY_PAGE)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load this page's text");
          return;
        }
        const v: Record<string, string> = { ...POWERED_BY_DEFAULTS };
        for (const r of data ?? []) v[`${r.section}.${r.key}`] = r.value;
        setValues(v);
      });
  }, []);

  const save = async () => {
    if (!values) return;
    setSaving(true);
    const rows = GROUPS.flatMap((g, gi) =>
      g.fields.map((f, i) => ({
        page: POWERED_BY_PAGE,
        section: g.section,
        key: f.key,
        value: values[`${g.section}.${f.key}`] ?? "",
        value_type: "text",
        label: f.label,
        sort_order: gi * 100 + i,
      })),
    );
    const filled = rows.filter((r) => r.value.trim() !== "");
    const emptied = rows.filter((r) => r.value.trim() === "");

    for (const r of emptied) {
      await supabase
        .from("site_content")
        .delete()
        .eq("page", POWERED_BY_PAGE)
        .eq("section", r.section)
        .eq("key", r.key);
    }

    const { error } = await supabase
      .from("site_content")
      .upsert(filled, { onConflict: "page,section,key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    invalidatePage(POWERED_BY_PAGE);
    toast.success("Saved");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">LeadTree page</h1>
          <p className="text-sm text-muted-foreground">
            Every piece of text on the public LeadTree page, plus the footer shown across the site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/powered-by" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View page
            </a>
          </Button>
          <Button onClick={save} disabled={saving || !values}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      {!values ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        GROUPS.map((g) => (
          <Card key={g.section}>
            <CardHeader>
              <CardTitle className="text-lg">{g.title}</CardTitle>
              <CardDescription>{g.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {g.fields.map((f) => {
                const k = `${g.section}.${f.key}`;
                return (
                  <div key={k} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    {f.image ? (
                      <div className="space-y-2">
                        <img
                          src={values[k] || defaultLogo.url}
                          alt="Logo"
                          className="h-20 w-auto rounded-md border bg-white p-2"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs"
                            disabled={uploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              setUploading(true);
                              try {
                                const ext = file.name.split(".").pop()?.toLowerCase() || "png";
                                const path = `powered-by/${Date.now()}-${Math.random()
                                  .toString(36)
                                  .slice(2, 8)}.${ext}`;
                                const { error: upErr } = await supabase.storage
                                  .from("site-images")
                                  .upload(path, file, { cacheControl: "3600", contentType: file.type });
                                if (upErr) throw upErr;
                                const { data } = supabase.storage.from("site-images").getPublicUrl(path);
                                setValues((prev) => ({ ...(prev ?? {}), [k]: data.publicUrl }));
                                toast.success("Logo uploaded. Press Save to publish it.");
                              } catch {
                                toast.error("Upload failed. Try again.");
                              } finally {
                                setUploading(false);
                              }
                            }}
                          />
                          {values[k] ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setValues({ ...values, [k]: "" })}
                            >
                              Use the default logo
                            </Button>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG with a transparent background works best.
                        </p>
                      </div>
                    ) : f.textarea ? (
                      <Textarea
                        rows={3}
                        value={values[k] ?? ""}
                        onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                      />
                    ) : (
                      <Input
                        value={values[k] ?? ""}
                        onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default AdminPoweredBy;
