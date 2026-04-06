import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type RewardsConfig, type RewardDef } from "@/context/SiteConfigContext";
import { Plus, Trash2 } from "lucide-react";

const CmsRewards = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<RewardsConfig>(JSON.parse(JSON.stringify(config.rewards)));

  const updateReward = (list: "challengeRewards" | "referralRewards", index: number, field: keyof RewardDef, value: string | number) => {
    const items = [...draft[list]];
    items[index] = { ...items[index], [field]: value };
    setDraft((prev) => ({ ...prev, [list]: items }));
  };

  const addReward = (list: "challengeRewards" | "referralRewards") => {
    setDraft((prev) => ({ ...prev, [list]: [...prev[list], { trigger: "", name: "", value: 0, description: "" }] }));
  };

  const removeReward = (list: "challengeRewards" | "referralRewards", index: number) => {
    setDraft((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }));
  };

  const save = () => {
    updateSection("rewards", draft);
    toast.success("Rewards & Unlocks updated");
  };

  const renderRewardList = (label: string, list: "challengeRewards" | "referralRewards") => (
    <section className="space-y-4">
      <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">{label}</h3>
      {draft[list].map((r, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Trigger</Label>
              <Input value={r.trigger} onChange={(e) => updateReward(list, i, "trigger", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={r.name} onChange={(e) => updateReward(list, i, "name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value ($)</Label>
              <Input type="number" value={r.value} onChange={(e) => updateReward(list, i, "value", Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={r.description} onChange={(e) => updateReward(list, i, "description", e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeReward(list, i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => addReward(list)}><Plus className="h-4 w-4 mr-1" /> Add reward</Button>
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Rewards & Unlocks</h2>
        <p className="text-sm text-muted-foreground">Configure challenge rewards, referral rewards, and Builder Circle unlock.</p>
      </div>

      {renderRewardList("Challenge Rewards", "challengeRewards")}
      {renderRewardList("Referral Rewards", "referralRewards")}

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Builder Circle Unlock</h3>
        <div className="flex items-center gap-3">
          <Switch checked={draft.builderCircle.requireDay3} onCheckedChange={(v) => setDraft((prev) => ({ ...prev, builderCircle: { ...prev.builderCircle, requireDay3: v } }))} />
          <Label>Require Day 3 complete</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.builderCircle.requireUrl} onCheckedChange={(v) => setDraft((prev) => ({ ...prev, builderCircle: { ...prev.builderCircle, requireUrl: v } }))} />
          <Label>Require URL submitted</Label>
        </div>
        <div className="space-y-2">
          <Label>Required referrals</Label>
          <Input type="number" value={draft.builderCircle.requiredReferrals} onChange={(e) => setDraft((prev) => ({ ...prev, builderCircle: { ...prev.builderCircle, requiredReferrals: Number(e.target.value) } }))} className="w-24" />
        </div>
        <div className="space-y-2">
          <Label>Unlock value ($)</Label>
          <Input type="number" value={draft.builderCircle.unlockValue} onChange={(e) => setDraft((prev) => ({ ...prev, builderCircle: { ...prev.builderCircle, unlockValue: Number(e.target.value) } }))} className="w-24" />
        </div>
        <div className="space-y-2">
          <Label>Unlock message</Label>
          <Textarea value={draft.builderCircle.unlockMessage} onChange={(e) => setDraft((prev) => ({ ...prev, builderCircle: { ...prev.builderCircle, unlockMessage: e.target.value } }))} />
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Rewards</Button>
    </div>
  );
};

export default CmsRewards;
