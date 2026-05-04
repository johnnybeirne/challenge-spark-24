import { useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type ReferralConfig } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  StickyActionBar,
  AdvancedDetails,
  FieldLabel,
} from "./cms-ui";

const CHANNEL_LABELS: Record<string, string> = {
  copyLink: "Copy link button",
  whatsapp: "WhatsApp share",
  email: "Email share",
  nativeShare: "Native device share",
};

const CmsReferrals = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<ReferralConfig>(JSON.parse(JSON.stringify(config.referrals)));

  const update = <K extends keyof ReferralConfig>(key: K, value: ReferralConfig[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    updateSection("referrals", draft);
    toast.success("Referral settings updated");
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Referral Settings"
        description="Configure how people invite others — the messages, share buttons, and onboarding nudges."
      />

      <EditorCard title="Referral Copy" description="The default messages people send when sharing.">
        <EditableField
          label="Default share message"
          helper="Used when someone shares from inside the app."
          value={draft.defaultShareMessage}
          onChange={(v) => update("defaultShareMessage", v)}
          multiline
        />
        <EditableField
          label="Result share message"
          helper="Used when someone shares their assessment result. XX = their score."
          value={draft.resultShareMessage}
          onChange={(v) => update("resultShareMessage", v)}
          multiline
        />
        <AdvancedDetails>
          <p className="text-xs text-muted-foreground">
            Share links are formatted as <code>/assess?ref=[code]</code>.
          </p>
        </AdvancedDetails>
      </EditorCard>

      <EditorCard
        title="Onboarding Invite"
        description="The screen shown right after someone signs up that asks them to invite others."
      >
        <ToggleField
          label="Show post-signup invite screen"
          helper="When on, new users see an invite screen right after signing up."
          checked={draft.showPostSignupInvite}
          onChange={(v) => update("showPostSignupInvite", v)}
        />
        <EditableField
          label="Headline"
          helper="Big heading on the invite screen."
          value={draft.inviteHeadline}
          onChange={(v) => update("inviteHeadline", v)}
        />
        <EditableField
          label="Body"
          helper="Explainer paragraph below the headline."
          value={draft.inviteBody}
          onChange={(v) => update("inviteBody", v)}
          multiline
        />
        <EditableField
          label="Invite target"
          helper="The number of invites the user is encouraged to send."
          type="number"
          value={String(draft.inviteTarget)}
          onChange={(v) => update("inviteTarget", Number(v))}
        />
        <ToggleField
          label="Show invite nudge on the dashboard"
          checked={draft.showDashboardNudge}
          onChange={(v) => update("showDashboardNudge", v)}
        />
        <ToggleField
          label="Show soft gate on Day 2"
          helper="Nudges users to invite others before continuing Day 2."
          checked={draft.showDay2SoftGate}
          onChange={(v) => update("showDay2SoftGate", v)}
        />
        <EditableField
          label="Soft gate text"
          helper="Message shown in the Day 2 soft gate."
          value={draft.softGateText}
          onChange={(v) => update("softGateText", v)}
          multiline
        />
      </EditorCard>

      <EditorCard
        title="Share Channels"
        description="Which share buttons appear on the share screen."
      >
        <div className="space-y-2">
          <FieldLabel label="Available channels" helper="Toggle off any you don't want users to see." />
          {(["copyLink", "whatsapp", "email", "nativeShare"] as const).map((ch) => (
            <ToggleField
              key={ch}
              label={CHANNEL_LABELS[ch] ?? ch}
              checked={draft.channels[ch]}
              onChange={(v) => update("channels", { ...draft.channels, [ch]: v })}
            />
          ))}
        </div>
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save referral settings" />
    </div>
  );
};

export default CmsReferrals;
