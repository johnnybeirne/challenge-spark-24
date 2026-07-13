import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-8 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Premium Page"
        description="Edit the content shown on the /premium sales page. Each section saves independently."
      />

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
    </div>
  );
};

export default AdminPremiumPage;
