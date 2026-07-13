import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import {
  PREMIUM_UPSELL_DEFAULTS,
  PremiumUpsellSettings,
} from "@/hooks/usePremiumUpsellSettings";

const AdminPremiumUpsell = () => {
  const [row, setRow] = useState<PremiumUpsellSettings>(PREMIUM_UPSELL_DEFAULTS);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("premium_upsell_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setRow(data as PremiumUpsellSettings);
        setRowId((data as any).id);
      } else if (!data) {
        // Seed default row if none exists
        const { data: created } = await supabase
          .from("premium_upsell_settings")
          .insert(PREMIUM_UPSELL_DEFAULTS)
          .select("*")
          .maybeSingle();
        if (created) {
          setRow(created as PremiumUpsellSettings);
          setRowId((created as any).id);
        }
      }
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof PremiumUpsellSettings>(
    key: K,
    value: PremiumUpsellSettings[K],
  ) => setRow((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      heading: row.heading,
      body_text: row.body_text,
      price: Number(row.price) || 0,
      invite_count: Number(row.invite_count) || 0,
      button_label: row.button_label,
      button_sublabel: row.button_sublabel,
      upgrade_link_label: row.upgrade_link_label,
      upgrade_url: row.upgrade_url,
    };

    let error;
    if (rowId) {
      ({ error } = await supabase
        .from("premium_upsell_settings")
        .update(payload)
        .eq("id", rowId));
    } else {
      const res = await supabase
        .from("premium_upsell_settings")
        .insert(payload)
        .select("id")
        .maybeSingle();
      error = res.error;
      if (res.data) setRowId((res.data as any).id);
    }
    setSaving(false);
    if (error) {
      toast.error("Could not save: " + error.message);
      return;
    }
    toast.success("Upsell block saved");
  };

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Premium upsell block"
        description="Edit the copy for the premium upsell block shown on Day 2 (and anywhere else it appears)."
      />

      <EditorCard title="Heading" description="Title at the top of the upsell card.">
        <EditableField
          label="Heading"
          value={loading ? "" : row.heading}
          onChange={(v) => update("heading", v)}
          placeholder="Want to go deeper…"
        />
      </EditorCard>

      <EditorCard title="Body text" description="Supporting copy under the heading.">
        <EditableField
          label="Body"
          multiline
          rows={3}
          value={loading ? "" : row.body_text}
          onChange={(v) => update("body_text", v)}
          placeholder="The full course is $497…"
        />
      </EditorCard>

      <EditorCard
        title="Price"
        description="Course price in USD. Also shown in the button sub-label and upgrade link."
      >
        <EditableField
          label="Price (USD)"
          type="number"
          value={loading ? "" : String(row.price)}
          onChange={(v) => update("price", Number(v) || 0)}
        />
      </EditorCard>

      <EditorCard
        title="Invite count"
        description="Number of friends the participant must invite to unlock free access."
      >
        <EditableField
          label="Invite count"
          type="number"
          value={loading ? "" : String(row.invite_count)}
          onChange={(v) => update("invite_count", Number(v) || 0)}
        />
      </EditorCard>

      <EditorCard title="Button label" description="Main text on the primary CTA button.">
        <EditableField
          label="Button label"
          value={loading ? "" : row.button_label}
          onChange={(v) => update("button_label", v)}
        />
      </EditorCard>

      <EditorCard title="Button sub-label" description="Small text under the button label.">
        <EditableField
          label="Button sub-label"
          value={loading ? "" : row.button_sublabel}
          onChange={(v) => update("button_sublabel", v)}
        />
      </EditorCard>

      <EditorCard title="Upgrade link label" description="Text of the underlined upgrade link under the button.">
        <EditableField
          label="Upgrade link label"
          value={loading ? "" : row.upgrade_link_label}
          onChange={(v) => update("upgrade_link_label", v)}
        />
      </EditorCard>

      <EditorCard title="Upgrade URL" description="Destination when someone clicks the upgrade link.">
        <EditableField
          label="Upgrade URL"
          value={loading ? "" : row.upgrade_url}
          onChange={(v) => update("upgrade_url", v)}
          placeholder="/upgrade or https://…"
        />
      </EditorCard>

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminPremiumUpsell;
