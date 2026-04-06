import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type ReferralConfig } from "@/context/SiteConfigContext";

const CmsReferrals = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<ReferralConfig>(JSON.parse(JSON.stringify(config.referrals)));

  const update = <K extends keyof ReferralConfig>(key: K, value: ReferralConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    updateSection("referrals", draft);
    toast.success("Referral settings updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Referral Settings</h2>
        <p className="text-sm text-muted-foreground">Configure referral copy, onboarding, and share channels.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Referral Copy</h3>
        <div className="space-y-2">
          <Label>Default Share Message</Label>
          <Textarea value={draft.defaultShareMessage} onChange={(e) => update("defaultShareMessage", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Result Share Message (XX = score)</Label>
          <Textarea value={draft.resultShareMessage} onChange={(e) => update("resultShareMessage", e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">Link format: /assess?ref=[code]</p>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Onboarding Invite</h3>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showPostSignupInvite} onCheckedChange={(v) => update("showPostSignupInvite", v)} />
          <Label>Show post-signup invite screen</Label>
        </div>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input value={draft.inviteHeadline} onChange={(e) => update("inviteHeadline", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea value={draft.inviteBody} onChange={(e) => update("inviteBody", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Invite Target</Label>
          <Input type="number" value={draft.inviteTarget} onChange={(e) => update("inviteTarget", Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showDashboardNudge} onCheckedChange={(v) => update("showDashboardNudge", v)} />
          <Label>Show dashboard invite nudge</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showDay2SoftGate} onCheckedChange={(v) => update("showDay2SoftGate", v)} />
          <Label>Show Day 2 soft gate</Label>
        </div>
        <div className="space-y-2">
          <Label>Soft Gate Text</Label>
          <Textarea value={draft.softGateText} onChange={(e) => update("softGateText", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Share Channels</h3>
        {(["copyLink", "whatsapp", "email", "nativeShare"] as const).map((ch) => (
          <div key={ch} className="flex items-center gap-3">
            <Switch checked={draft.channels[ch]} onCheckedChange={(v) => update("channels", { ...draft.channels, [ch]: v })} />
            <Label className="capitalize">{ch.replace(/([A-Z])/g, " $1")}</Label>
          </div>
        ))}
      </section>

      <Button onClick={save} className="w-full">Save Referral Settings</Button>
    </div>
  );
};

export default CmsReferrals;
