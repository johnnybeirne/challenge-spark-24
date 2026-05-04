import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useSiteConfig, type PartnerConfig, type RewardDef } from "@/context/SiteConfigContext";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  RepeatableList,
  StickyActionBar,
  FieldLabel,
} from "./cms-ui";

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
    <div className="space-y-6">
      <CmsPageHeader
        title="Partner Settings"
        description="Edit the partner acquisition page, cross-promotion settings, and reward tiers."
      />

      <EditorCard title="Partner Acquisition Page" description="The page shown to potential partners.">
        <EditableField
          label="Headline"
          helper="The main heading of the partners page."
          value={draft.pageHeadline}
          onChange={(v) => update("pageHeadline", v)}
        />
        <EditableField
          label="Subtitle"
          helper="Description shown under the headline."
          value={draft.pageSubtitle}
          onChange={(v) => update("pageSubtitle", v)}
          multiline
        />
        <EditableField
          label="Minimum contribution value (USD)"
          helper="Smallest accepted partner contribution."
          type="number"
          value={String(draft.minContributionValue)}
          onChange={(v) => update("minContributionValue", Number(v))}
        />
        <ToggleField
          label="Show founding-partner urgency"
          helper="Displays a limited-slots banner."
          checked={draft.showFoundingUrgency}
          onChange={(v) => update("showFoundingUrgency", v)}
        />
        <EditableField
          label="Founding partner slots"
          helper="How many founding-partner spots are available."
          type="number"
          value={String(draft.foundingSlots)}
          onChange={(v) => update("foundingSlots", Number(v))}
        />
        <div className="space-y-1.5">
          <FieldLabel label="Founding cutoff date" helper="When founding-partner offer ends." />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-11 w-full justify-start text-left font-normal",
                  !draft.foundingCutoffDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {draft.foundingCutoffDate ? format(new Date(draft.foundingCutoffDate), "PPP") : "No cutoff date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={draft.foundingCutoffDate ? new Date(draft.foundingCutoffDate) : undefined}
                onSelect={(d) => update("foundingCutoffDate", d ? d.toISOString() : null)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {draft.foundingCutoffDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update("foundingCutoffDate", null)}
              className="text-xs text-muted-foreground"
            >
              Clear date
            </Button>
          )}
        </div>
      </EditorCard>

      <EditorCard
        title="Cross-Promotion"
        description="Where and how cross-promotion cards appear across the app."
      >
        <EditableField
          label="Slots per page"
          helper="Maximum cross-promo cards shown on each page."
          type="number"
          value={String(draft.slotsPerPage)}
          onChange={(v) => update("slotsPerPage", Number(v))}
        />
        <ToggleField
          label="Show on Dashboard"
          checked={draft.showCrossPromoDashboard}
          onChange={(v) => update("showCrossPromoDashboard", v)}
        />
        <ToggleField
          label="Show on Day pages"
          checked={draft.showCrossPromoDayPages}
          onChange={(v) => update("showCrossPromoDayPages", v)}
        />
        <ToggleField
          label="Show on Unlocks page"
          checked={draft.showCrossPromoUnlocks}
          onChange={(v) => update("showCrossPromoUnlocks", v)}
        />
        <ToggleField
          label="Show in Builder Circle"
          checked={draft.showCrossPromoCommunity}
          onChange={(v) => update("showCrossPromoCommunity", v)}
        />
        <EditableField
          label="Frequency cap"
          helper="Maximum times a single promo is shown to one user."
          type="number"
          value={String(draft.frequencyCap)}
          onChange={(v) => update("frequencyCap", Number(v))}
        />
      </EditorCard>

      <EditorCard title="Promoter Reward Tiers" description="Reward levels promoters can unlock.">
        <RepeatableList
          items={draft.promoterRewardTiers}
          itemLabel={(i) => `Tier ${i + 1}`}
          addLabel="Add tier"
          onAdd={() =>
            update("promoterRewardTiers", [
              ...draft.promoterRewardTiers,
              { trigger: "", name: "", value: 0, description: "" },
            ])
          }
          onRemove={(i) => update("promoterRewardTiers", draft.promoterRewardTiers.filter((_, j) => j !== i))}
          renderItem={(tier, i) => (
            <div className="space-y-3">
              <EditableField
                label="Tier name"
                value={tier.name}
                onChange={(v) => updateTier(i, "name", v)}
              />
              <EditableField
                label="Description"
                value={tier.description}
                onChange={(v) => updateTier(i, "description", v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Threshold"
                  helper="When this tier is reached (e.g. number of conversions)."
                  value={tier.trigger}
                  onChange={(v) => updateTier(i, "trigger", v)}
                />
                <EditableField
                  label="Value (USD)"
                  type="number"
                  value={String(tier.value)}
                  onChange={(v) => updateTier(i, "value", Number(v))}
                />
              </div>
            </div>
          )}
        />
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save partner settings" />
    </div>
  );
};

export default CmsPartners;
