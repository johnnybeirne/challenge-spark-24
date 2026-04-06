import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type LandingConfig, type SocialProofItem } from "@/context/SiteConfigContext";
import { Plus, Trash2 } from "lucide-react";

const CmsLanding = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<LandingConfig>({ ...config.landing });

  const update = <K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateProofItem = (index: number, field: keyof SocialProofItem, value: string) => {
    const items = [...draft.socialProofItems];
    items[index] = { ...items[index], [field]: value };
    update("socialProofItems", items);
  };

  const addProofItem = () => {
    if (draft.socialProofItems.length >= 10) return;
    update("socialProofItems", [...draft.socialProofItems, { name: "", action: "" }]);
  };

  const removeProofItem = (index: number) => {
    update("socialProofItems", draft.socialProofItems.filter((_, i) => i !== index));
  };

  const save = () => {
    updateSection("landing", draft);
    toast.success("Landing page updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Landing Page</h2>
        <p className="text-sm text-muted-foreground">Edit the public landing page content.</p>
      </div>

      {/* Hero */}
      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Hero Section</h3>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input value={draft.heroHeadline} onChange={(e) => update("heroHeadline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Subheadline</Label>
          <Input value={draft.heroSubheadline} onChange={(e) => update("heroSubheadline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Primary CTA Text</Label>
          <Input value={draft.primaryCtaText} onChange={(e) => update("primaryCtaText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Primary CTA Link</Label>
          <Select value={draft.primaryCtaLink} onValueChange={(v) => update("primaryCtaLink", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="/assess">/assess</SelectItem>
              <SelectItem value="/join">/join</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Urgency */}
      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Urgency Section</h3>
        <div className="space-y-2">
          <Label>Urgency Text</Label>
          <Input value={draft.urgencyText} onChange={(e) => update("urgencyText", e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCountdown} onCheckedChange={(v) => update("showCountdown", v)} />
          <Label>Show countdown timer</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.autoAdvanceCountdown} onCheckedChange={(v) => update("autoAdvanceCountdown", v)} />
          <Label>Auto-advance weekly</Label>
        </div>
      </section>

      {/* Promise */}
      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Promise Section</h3>
        <div className="space-y-2">
          <Label>Promise Text</Label>
          <Textarea value={draft.promiseText} onChange={(e) => update("promiseText", e.target.value)} />
        </div>
      </section>

      {/* Social Proof */}
      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Social Proof</h3>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showSocialProof} onCheckedChange={(v) => update("showSocialProof", v)} />
          <Label>Show social proof</Label>
        </div>
        {draft.socialProofItems.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Name" value={item.name} onChange={(e) => updateProofItem(i, "name", e.target.value)} className="w-1/3" />
            <Input placeholder="Action" value={item.action} onChange={(e) => updateProofItem(i, "action", e.target.value)} className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeProofItem(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addProofItem}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
        <div className="space-y-2">
          <Label>Rotate speed (seconds)</Label>
          <Input type="number" value={draft.socialProofRotateSpeed} onChange={(e) => update("socialProofRotateSpeed", Number(e.target.value))} className="w-24" />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Bottom CTA</h3>
        <div className="space-y-2">
          <Label>Bottom CTA Text</Label>
          <Input value={draft.bottomCtaText} onChange={(e) => update("bottomCtaText", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bottom CTA Link</Label>
          <Select value={draft.bottomCtaLink} onValueChange={(v) => update("bottomCtaLink", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="/assess">/assess</SelectItem>
              <SelectItem value="/join">/join</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Landing Page</Button>
    </div>
  );
};

export default CmsLanding;
