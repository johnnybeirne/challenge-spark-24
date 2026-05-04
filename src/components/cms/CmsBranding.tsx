import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type BrandingConfig } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "./cms-ui";

const CmsBranding = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<BrandingConfig>({ ...config.branding });

  const update = <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    updateSection("branding", draft);
    toast.success("Branding updated");
  };

  const colorField = (label: string, helper: string, key: keyof BrandingConfig) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{helper}</p>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={draft[key] as string}
          onChange={(e) => update(key, e.target.value as any)}
          className="h-11 w-14 rounded border cursor-pointer"
        />
        <Input
          value={draft[key] as string}
          onChange={(e) => update(key, e.target.value as any)}
          className="h-11 w-40 font-mono text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Branding & Design"
        description="Set your colors, layout sizes, and how the app introduces itself."
      />

      <EditorCard title="Brand Colors" description="The core colors used across the app.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {colorField("Primary", "Main brand color used for buttons and links.", "primaryColor")}
          {colorField("Accent", "Secondary highlight color.", "accentColor")}
          {colorField("Success", "Used for confirmations and positive states.", "successColor")}
          {colorField("Background", "The page background color.", "backgroundColor")}
          {colorField("Surface", "Background color for cards and panels.", "surfaceColor")}
          {colorField("Text", "Default text color across the app.", "textColor")}
        </div>
      </EditorCard>

      <EditorCard title="Layout" description="Sizing tokens used across the app.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EditableField
            label="Max content width"
            helper="The widest content area on big screens, in pixels."
            type="number"
            value={String(draft.maxWidth)}
            onChange={(v) => update("maxWidth", Number(v))}
          />
          <EditableField
            label="Card border radius"
            helper="How rounded cards appear, in pixels."
            type="number"
            value={String(draft.cardBorderRadius)}
            onChange={(v) => update("cardBorderRadius", Number(v))}
          />
        </div>
      </EditorCard>

      <EditorCard title="App Identity" description="How the app refers to itself.">
        <EditableField
          label="App name"
          helper="The name used in the navigation and footer."
          value={draft.appName}
          onChange={(v) => update("appName", v)}
        />
        <EditableField
          label="Tagline"
          helper="Short tagline shown alongside the app name."
          value={draft.appTagline}
          onChange={(v) => update("appTagline", v)}
        />
        <EditableField
          label="Footer text"
          helper="Text that appears in the page footer."
          value={draft.footerText}
          onChange={(v) => update("footerText", v)}
          multiline
          rows={2}
        />
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save branding" />
    </div>
  );
};

export default CmsBranding;
