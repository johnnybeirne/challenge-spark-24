import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useSiteConfig, type PartnerConfig, type RewardDef } from "@/context/SiteConfigContext";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CmsPartners = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<PartnerConfig>(JSON.parse(JSON.stringify(config.partners)));

  const update = <K extends keyof PartnerConfig>(key: K, value: PartnerConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateTier = (index: number, field: keyof RewardDef, value: string | number) => {
    const tiers = [...draft.promoterRewardTiers];
    tiers[index] = { ...tiers[index], [field]: value };
    update("promoterRewardTiers", tiers);
  };

  const save = () => {
    updateSection("partners", draft);
    toast.success("Partner settings updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Partner Settings</h2>
        <p className="text-sm text-muted-foreground">Partner acquisition, cross-promotion, and reward tiers.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Acquisition Page</h3>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input value={draft.pageHeadline} onChange={(e) => update("pageHeadline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Textarea value={draft.pageSubtitle} onChange={(e) => update("pageSubtitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Min Contribution Value ($)</Label>
          <Input type="number" value={draft.minContributionValue} onChange={(e) => update("minContributionValue", Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showFoundingUrgency} onCheckedChange={(v) => update("showFoundingUrgency", v)} />
          <Label>Show founding partner urgency</Label>
        </div>
        <div className="space-y-2">
          <Label>Founding Slots</Label>
          <Input type="number" value={draft.foundingSlots} onChange={(e) => update("foundingSlots", Number(e.target.value))} className="w-24" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Cross-Promotion</h3>
        <div className="space-y-2">
          <Label>Slots per page</Label>
          <Input type="number" value={draft.slotsPerPage} onChange={(e) => update("slotsPerPage", Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCrossPromoDashboard} onCheckedChange={(v) => update("showCrossPromoDashboard", v)} />
          <Label>Show on Dashboard</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCrossPromoDayPages} onCheckedChange={(v) => update("showCrossPromoDayPages", v)} />
          <Label>Show on Day pages</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCrossPromoUnlocks} onCheckedChange={(v) => update("showCrossPromoUnlocks", v)} />
          <Label>Show on Unlocks page</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCrossPromoCommunity} onCheckedChange={(v) => update("showCrossPromoCommunity", v)} />
          <Label>Show in Builder Circle</Label>
        </div>
        <div className="space-y-2">
          <Label>Frequency cap (impressions)</Label>
          <Input type="number" value={draft.frequencyCap} onChange={(e) => update("frequencyCap", Number(e.target.value))} className="w-24" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Promoter Reward Tiers</h3>
        {draft.promoterRewardTiers.map((tier, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Threshold</Label>
                <Input value={tier.trigger} onChange={(e) => updateTier(i, "trigger", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={tier.name} onChange={(e) => updateTier(i, "name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value ($)</Label>
                <Input type="number" value={tier.value} onChange={(e) => updateTier(i, "value", Number(e.target.value))} />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Description</Label>
                <Input value={tier.description} onChange={(e) => updateTier(i, "description", e.target.value)} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => update("promoterRewardTiers", draft.promoterRewardTiers.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("promoterRewardTiers", [...draft.promoterRewardTiers, { trigger: "", name: "", value: 0, description: "" }])}><Plus className="h-4 w-4 mr-1" /> Add tier</Button>
      </section>

      <Button onClick={save} className="w-full">Save Partner Settings</Button>
    </div>
  );
};

export default CmsPartners;
