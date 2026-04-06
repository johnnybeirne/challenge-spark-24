import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type BrandingConfig } from "@/context/SiteConfigContext";

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

  const colorField = (label: string, key: keyof BrandingConfig) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={draft[key] as string} onChange={(e) => update(key, e.target.value as any)} className="h-9 w-12 rounded border cursor-pointer" />
        <Input value={draft[key] as string} onChange={(e) => update(key, e.target.value as any)} className="w-32 font-mono text-xs" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Branding & Design</h2>
        <p className="text-sm text-muted-foreground">Colors, layout, and app identity.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          {colorField("Primary", "primaryColor")}
          {colorField("Accent", "accentColor")}
          {colorField("Success", "successColor")}
          {colorField("Background", "backgroundColor")}
          {colorField("Surface", "surfaceColor")}
          {colorField("Text", "textColor")}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Layout</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Max Width (px)</Label>
            <Input type="number" value={draft.maxWidth} onChange={(e) => update("maxWidth", Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Card Border Radius (px)</Label>
            <Input type="number" value={draft.cardBorderRadius} onChange={(e) => update("cardBorderRadius", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">App Identity</h3>
        <div className="space-y-2">
          <Label>App Name</Label>
          <Input value={draft.appName} onChange={(e) => update("appName", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>App Tagline</Label>
          <Input value={draft.appTagline} onChange={(e) => update("appTagline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Footer Text</Label>
          <Textarea value={draft.footerText} onChange={(e) => update("footerText", e.target.value)} rows={2} />
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Branding</Button>
    </div>
  );
};

export default CmsBranding;
