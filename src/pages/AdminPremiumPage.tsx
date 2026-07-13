import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
} from "@/components/cms/cms-ui";
import {
  PREMIUM_PAGE_DEFAULTS,
  PremiumPageCard,
  PremiumPageSettings,
} from "@/hooks/usePremiumPageSettings";

type SectionKey = "hero" | "preview" | "problem" | "build";
type ExtraSectionKey = "modules" | "trainer" | "audience" | "pricing" | "closing";

interface ModuleRow {
  number: string;
  title: string;
  description: string;
}

interface ExtraState {
  modules_eyebrow: string;
  modules_headline: string;
  modules_list: ModuleRow[];
  trainer_eyebrow: string;
  trainer_name: string;
  trainer_title: string;
  trainer_bio: string;
  trainer_stat_1: string;
  trainer_stat_2: string;
  trainer_stat_3: string;
  trainer_image_url: string;
  audience_eyebrow: string;
  audience_tags: string[];
  pricing_eyebrow: string;
  pricing_cta_label: string;
  pricing_cta_url: string;
  pricing_supporting_line: string;
  closing_headline: string;
  closing_subheadline: string;
  closing_cta_label: string;
  closing_cta_url: string;
  closing_partner_cta_label: string;
}

const EXTRA_DEFAULTS: ExtraState = {
  modules_eyebrow: "",
  modules_headline: "",
  modules_list: [],
  trainer_eyebrow: "",
  trainer_name: "",
  trainer_title: "",
  trainer_bio: "",
  trainer_stat_1: "",
  trainer_stat_2: "",
  trainer_stat_3: "",
  trainer_image_url: "",
  audience_eyebrow: "",
  audience_tags: [],
  pricing_eyebrow: "",
  pricing_cta_label: "",
  pricing_cta_url: "",
  pricing_supporting_line: "",
  closing_headline: "",
  closing_subheadline: "",
  closing_cta_label: "",
  closing_cta_url: "",
  closing_partner_cta_label: "",
};

const EXTRA_SECTION_FIELDS: Record<ExtraSectionKey, (keyof ExtraState)[]> = {
  modules: ["modules_eyebrow", "modules_headline", "modules_list"],
  trainer: [
    "trainer_eyebrow",
    "trainer_name",
    "trainer_title",
    "trainer_bio",
    "trainer_stat_1",
    "trainer_stat_2",
    "trainer_stat_3",
    "trainer_image_url",
  ],
  audience: ["audience_eyebrow", "audience_tags"],
  pricing: [
    "pricing_eyebrow",
    "pricing_cta_label",
    "pricing_cta_url",
    "pricing_supporting_line",
  ],
  closing: [
    "closing_headline",
    "closing_subheadline",
    "closing_cta_label",
    "closing_cta_url",
    "closing_partner_cta_label",
  ],
};


const SECTION_FIELDS: Record<SectionKey, (keyof PremiumPageSettings)[]> = {
  hero: [
    "hero_eyebrow",
    "hero_headline",
    "hero_subheadline",
    "hero_cta_label",
    "hero_cta_url",
    "hero_supporting_line",
    "hero_stat_1",
    "hero_stat_2",
    "hero_stat_3",
  ],
  preview: ["preview_title", "preview_badge", "preview_bullets", "price", "coupon_enabled"],
  problem: ["problem_eyebrow", "problem_headline", "problem_cards"],
  build: ["build_eyebrow", "build_headline", "build_subheadline", "build_cards"],
};

const AdminPremiumPage = () => {
  const [row, setRow] = useState<PremiumPageSettings>(PREMIUM_PAGE_DEFAULTS);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("premium_page_settings" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setRow({ ...PREMIUM_PAGE_DEFAULTS, ...(data as any) });
        setRowId((data as any).id);
      } else if (!data) {
        const { data: created } = await supabase
          .from("premium_page_settings" as any)
          .insert(PREMIUM_PAGE_DEFAULTS as any)
          .select("*")
          .maybeSingle();
        if (created) {
          setRow({ ...PREMIUM_PAGE_DEFAULTS, ...(created as any) });
          setRowId((created as any).id);
        }
      }
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof PremiumPageSettings>(
    key: K,
    value: PremiumPageSettings[K],
  ) => setRow((p) => ({ ...p, [key]: value }));

  const updateCard = (
    key: "problem_cards" | "build_cards",
    index: number,
    patch: Partial<PremiumPageCard>,
  ) => {
    setRow((p) => {
      const next = [...(p[key] || [])];
      next[index] = { ...next[index], ...patch };
      return { ...p, [key]: next };
    });
  };

  const addCard = (key: "problem_cards" | "build_cards") =>
    setRow((p) => ({ ...p, [key]: [...(p[key] || []), { title: "", description: "" }] }));

  const removeCard = (key: "problem_cards" | "build_cards", index: number) =>
    setRow((p) => ({ ...p, [key]: (p[key] || []).filter((_, i) => i !== index) }));

  const saveSection = async (section: SectionKey) => {
    setSavingSection(section);
    const payload: Record<string, any> = {};
    for (const f of SECTION_FIELDS[section]) payload[f] = row[f];

    let error: any;
    if (rowId) {
      ({ error } = await supabase
        .from("premium_page_settings" as any)
        .update(payload)
        .eq("id", rowId));
    } else {
      const res = await supabase
        .from("premium_page_settings" as any)
        .insert({ ...PREMIUM_PAGE_DEFAULTS, ...payload } as any)
        .select("id")
        .maybeSingle();
      error = res.error;
      if (res.data) setRowId((res.data as any).id);
    }
    setSavingSection(null);
    if (error) {
      toast.error("Could not save: " + error.message);
      return;
    }
    toast.success("Section saved");
  };

  const [extra, setExtra] = useState<ExtraState>(EXTRA_DEFAULTS);
  const [savingExtra, setSavingExtra] = useState<ExtraSectionKey | null>(null);

  useEffect(() => {
    if (loading) return;
    // hydrate extra state from row on load / refresh
    const anyRow = row as any;
    setExtra((prev) => {
      const next: any = { ...prev };
      for (const k of Object.keys(EXTRA_DEFAULTS) as (keyof ExtraState)[]) {
        if (anyRow[k] !== undefined && anyRow[k] !== null) next[k] = anyRow[k];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const updateExtra = <K extends keyof ExtraState>(key: K, value: ExtraState[K]) =>
    setExtra((p) => ({ ...p, [key]: value }));

  const updateModuleRow = (index: number, patch: Partial<ModuleRow>) =>
    setExtra((p) => {
      const next = [...p.modules_list];
      next[index] = { ...next[index], ...patch };
      return { ...p, modules_list: next };
    });
  const addModuleRow = () =>
    setExtra((p) =>
      p.modules_list.length >= 8
        ? p
        : { ...p, modules_list: [...p.modules_list, { number: "", title: "", description: "" }] },
    );
  const removeModuleRow = (index: number) =>
    setExtra((p) => ({ ...p, modules_list: p.modules_list.filter((_, i) => i !== index) }));

  const updateTag = (index: number, value: string) =>
    setExtra((p) => {
      const next = [...p.audience_tags];
      next[index] = value;
      return { ...p, audience_tags: next };
    });
  const addTag = () =>
    setExtra((p) =>
      p.audience_tags.length >= 10 ? p : { ...p, audience_tags: [...p.audience_tags, ""] },
    );
  const removeTag = (index: number) =>
    setExtra((p) => ({ ...p, audience_tags: p.audience_tags.filter((_, i) => i !== index) }));

  const saveExtraSection = async (section: ExtraSectionKey) => {
    setSavingExtra(section);
    const payload: Record<string, any> = {};
    for (const f of EXTRA_SECTION_FIELDS[section]) payload[f] = extra[f];

    let error: any;
    if (rowId) {
      ({ error } = await supabase
        .from("premium_page_settings" as any)
        .update(payload)
        .eq("id", rowId));
    } else {
      const res = await supabase
        .from("premium_page_settings" as any)
        .insert({ ...PREMIUM_PAGE_DEFAULTS, ...payload } as any)
        .select("id")
        .maybeSingle();
      error = res.error;
      if (res.data) setRowId((res.data as any).id);
    }
    setSavingExtra(null);
    if (error) {
      toast.error("Could not save. Try again.");
      return;
    }
    toast.success("Saved");
  };

  const SectionSaveButton = ({ section }: { section: SectionKey }) => (
    <div className="pt-2">
      <Button
        onClick={() => saveSection(section)}
        disabled={loading || savingSection !== null}
      >
        {savingSection === section ? "Saving…" : "Save section"}
      </Button>
    </div>
  );

  const ExtraSaveButton = ({ section }: { section: ExtraSectionKey }) => (
    <div className="pt-2">
      <Button
        onClick={() => saveExtraSection(section)}
        disabled={loading || savingExtra !== null}
      >
        {savingExtra === section ? "Saving…" : "Save section"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 px-6 py-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <CmsPageHeader
          title="Premium Page"
          description="Edit the content shown on the /premium sales page. Each section saves independently."
        />
        <Button variant="outline" size="sm" asChild>
          <a href="/premium" target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </a>
        </Button>
      </div>

      {/* HERO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Hero</h2>
        <EditorCard title="Hero copy">
          <EditableField label="Eyebrow" value={row.hero_eyebrow} onChange={(v) => update("hero_eyebrow", v)} />
          <EditableField label="Headline" value={row.hero_headline} onChange={(v) => update("hero_headline", v)} />
          <EditableField
            label="Subheadline"
            multiline
            rows={3}
            value={row.hero_subheadline}
            onChange={(v) => update("hero_subheadline", v)}
          />
          <EditableField label="CTA label" value={row.hero_cta_label} onChange={(v) => update("hero_cta_label", v)} />
          <EditableField
            label="CTA URL"
            value={row.hero_cta_url}
            onChange={(v) => update("hero_cta_url", v)}
            placeholder="/checkout or https://…"
          />
          <EditableField
            label="Supporting line"
            value={row.hero_supporting_line}
            onChange={(v) => update("hero_supporting_line", v)}
          />
        </EditorCard>
        <EditorCard title="Hero stats">
          <EditableField label="Stat 1" value={row.hero_stat_1} onChange={(v) => update("hero_stat_1", v)} />
          <EditableField label="Stat 2" value={row.hero_stat_2} onChange={(v) => update("hero_stat_2", v)} />
          <EditableField label="Stat 3" value={row.hero_stat_3} onChange={(v) => update("hero_stat_3", v)} />
        </EditorCard>
        <SectionSaveButton section="hero" />
      </section>

      {/* PREVIEW CARD */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Preview card</h2>
        <EditorCard title="Preview card">
          <EditableField label="Title" value={row.preview_title} onChange={(v) => update("preview_title", v)} />
          <EditableField label="Badge" value={row.preview_badge} onChange={(v) => update("preview_badge", v)} />
          <EditableField
            label="Bullets (one per line)"
            multiline
            rows={6}
            value={(row.preview_bullets || []).join("\n")}
            onChange={(v) =>
              update(
                "preview_bullets",
                v.split("\n").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
          <EditableField
            label="Price (USD)"
            type="number"
            value={String(row.price)}
            onChange={(v) => update("price", Number(v) || 0)}
          />
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="coupon_enabled"
              checked={!!row.coupon_enabled}
              onCheckedChange={(v) => update("coupon_enabled", v)}
            />
            <Label htmlFor="coupon_enabled">Coupon enabled</Label>
          </div>
        </EditorCard>
        <SectionSaveButton section="preview" />
      </section>

      {/* PROBLEM */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Problem section</h2>
        <EditorCard title="Problem headings">
          <EditableField label="Eyebrow" value={row.problem_eyebrow} onChange={(v) => update("problem_eyebrow", v)} />
          <EditableField label="Headline" value={row.problem_headline} onChange={(v) => update("problem_headline", v)} />
        </EditorCard>
        <EditorCard title="Problem cards">
          <div className="space-y-4">
            {(row.problem_cards || []).map((card, i) => (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Card {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeCard("problem_cards", i)}>
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Title"
                  value={card.title}
                  onChange={(e) => updateCard("problem_cards", i, { title: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={card.description}
                  onChange={(e) => updateCard("problem_cards", i, { description: e.target.value })}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addCard("problem_cards")}>
              Add card
            </Button>
          </div>
        </EditorCard>
        <SectionSaveButton section="problem" />
      </section>

      {/* BUILD */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What you'll build</h2>
        <EditorCard title="Section headings">
          <EditableField label="Eyebrow" value={row.build_eyebrow} onChange={(v) => update("build_eyebrow", v)} />
          <EditableField label="Headline" value={row.build_headline} onChange={(v) => update("build_headline", v)} />
          <EditableField
            label="Subheadline"
            multiline
            rows={2}
            value={row.build_subheadline}
            onChange={(v) => update("build_subheadline", v)}
          />
        </EditorCard>
        <EditorCard title="Build cards">
          <div className="space-y-4">
            {(row.build_cards || []).map((card, i) => (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Card {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeCard("build_cards", i)}>
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Title"
                  value={card.title}
                  onChange={(e) => updateCard("build_cards", i, { title: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={card.description}
                  onChange={(e) => updateCard("build_cards", i, { description: e.target.value })}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addCard("build_cards")}>
              Add card
            </Button>
          </div>
        </EditorCard>
        <SectionSaveButton section="build" />
      </section>

      {/* MODULES */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Modules</h2>
        <EditorCard title="Modules headings">
          <EditableField
            label="Eyebrow"
            value={extra.modules_eyebrow}
            onChange={(v) => updateExtra("modules_eyebrow", v)}
          />
          <EditableField
            label="Headline"
            multiline
            rows={2}
            value={extra.modules_headline}
            onChange={(v) => updateExtra("modules_headline", v)}
          />
        </EditorCard>
        <EditorCard title="Modules list">
          <div className="space-y-4">
            {extra.modules_list.map((m, i) => (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Module {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeModuleRow(i)}>
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Number (e.g. 01)"
                  value={m.number}
                  onChange={(e) => updateModuleRow(i, { number: e.target.value })}
                />
                <Input
                  placeholder="Title"
                  value={m.title}
                  onChange={(e) => updateModuleRow(i, { title: e.target.value })}
                />
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Description"
                  value={m.description}
                  onChange={(e) => updateModuleRow(i, { description: e.target.value })}
                />
              </div>
            ))}
            {extra.modules_list.length < 8 && (
              <Button variant="outline" size="sm" onClick={addModuleRow}>
                Add module
              </Button>
            )}
          </div>
        </EditorCard>
        <ExtraSaveButton section="modules" />
      </section>

      {/* TRAINER */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Trainer</h2>
        <EditorCard title="Trainer">
          <EditableField
            label="Eyebrow"
            value={extra.trainer_eyebrow}
            onChange={(v) => updateExtra("trainer_eyebrow", v)}
          />
          <EditableField
            label="Name"
            value={extra.trainer_name}
            onChange={(v) => updateExtra("trainer_name", v)}
          />
          <EditableField
            label="Title/role"
            value={extra.trainer_title}
            onChange={(v) => updateExtra("trainer_title", v)}
          />
          <EditableField
            label="Bio"
            multiline
            rows={4}
            value={extra.trainer_bio}
            onChange={(v) => updateExtra("trainer_bio", v)}
          />
          <EditableField
            label="Trainer image URL"
            value={extra.trainer_image_url}
            onChange={(v) => updateExtra("trainer_image_url", v)}
            placeholder="https://…"
          />
        </EditorCard>
        <EditorCard title="Trainer stats">
          <EditableField label="Stat 1" value={extra.trainer_stat_1} onChange={(v) => updateExtra("trainer_stat_1", v)} />
          <EditableField label="Stat 2" value={extra.trainer_stat_2} onChange={(v) => updateExtra("trainer_stat_2", v)} />
          <EditableField label="Stat 3" value={extra.trainer_stat_3} onChange={(v) => updateExtra("trainer_stat_3", v)} />
        </EditorCard>
        <ExtraSaveButton section="trainer" />
      </section>

      {/* WHO IT IS FOR */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Who It Is For</h2>
        <EditorCard title="Section heading">
          <EditableField
            label="Eyebrow"
            value={extra.audience_eyebrow}
            onChange={(v) => updateExtra("audience_eyebrow", v)}
          />
        </EditorCard>
        <EditorCard title="Tags">
          <div className="space-y-2">
            {extra.audience_tags.map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Tag ${i + 1}`}
                  value={tag}
                  onChange={(e) => updateTag(i, e.target.value)}
                />
                <Button variant="ghost" size="sm" onClick={() => removeTag(i)}>
                  Remove
                </Button>
              </div>
            ))}
            {extra.audience_tags.length < 10 && (
              <Button variant="outline" size="sm" onClick={addTag}>
                Add tag
              </Button>
            )}
          </div>
        </EditorCard>
        <ExtraSaveButton section="audience" />
      </section>

      {/* BOTTOM PRICING BLOCK */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Bottom Pricing Block</h2>
        <EditorCard title="Bottom pricing block">
          <EditableField
            label="Eyebrow"
            value={extra.pricing_eyebrow}
            onChange={(v) => updateExtra("pricing_eyebrow", v)}
          />
          <EditableField
            label="CTA label"
            value={extra.pricing_cta_label}
            onChange={(v) => updateExtra("pricing_cta_label", v)}
          />
          <EditableField
            label="CTA URL"
            value={extra.pricing_cta_url}
            onChange={(v) => updateExtra("pricing_cta_url", v)}
            placeholder="/checkout or https://…"
          />
          <EditableField
            label="Supporting line"
            value={extra.pricing_supporting_line}
            onChange={(v) => updateExtra("pricing_supporting_line", v)}
          />
        </EditorCard>
        <ExtraSaveButton section="pricing" />
      </section>

      {/* CLOSING SECTION */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Closing Section</h2>
        <EditorCard title="Closing section">
          <EditableField
            label="Headline"
            multiline
            rows={2}
            value={extra.closing_headline}
            onChange={(v) => updateExtra("closing_headline", v)}
          />
          <EditableField
            label="Subheadline"
            multiline
            rows={3}
            value={extra.closing_subheadline}
            onChange={(v) => updateExtra("closing_subheadline", v)}
          />
          <EditableField
            label="CTA label"
            value={extra.closing_cta_label}
            onChange={(v) => updateExtra("closing_cta_label", v)}
          />
          <EditableField
            label="CTA URL"
            value={extra.closing_cta_url}
            onChange={(v) => updateExtra("closing_cta_url", v)}
            placeholder="/checkout or https://…"
          />
          <EditableField
            label="Partner CTA label"
            value={extra.closing_partner_cta_label}
            onChange={(v) => updateExtra("closing_partner_cta_label", v)}
          />
        </EditorCard>
        <ExtraSaveButton section="closing" />
      </section>
    </div>
  );
};

export default AdminPremiumPage;
