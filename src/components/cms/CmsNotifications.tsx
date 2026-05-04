import { useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type NotificationConfig } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "./cms-ui";

const CmsNotifications = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<NotificationConfig>(JSON.parse(JSON.stringify(config.notifications)));

  const updateToast = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, toasts: { ...prev.toasts, [key]: value } }));
  };

  const updateEmpty = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, emptyStates: { ...prev.emptyStates, [key]: value } }));
  };

  const save = () => {
    updateSection("notifications", draft);
    toast.success("Notifications updated");
  };

  const toastMeta: Record<string, { label: string; helper: string }> = {
    unlock_earned: {
      label: "Unlock earned",
      helper: "Shown when someone unlocks a new reward.",
    },
    builder_circle_unlocked: {
      label: "Builder Circle unlocked",
      helper: "Shown the moment someone joins the Builder Circle.",
    },
    builder_supported: {
      label: "Builder supported",
      helper: "Shown when one builder supports another.",
    },
    partner_approved: {
      label: "Partner approved",
      helper: "Shown when a partner application is approved.",
    },
    task_completed: {
      label: "Task completed",
      helper: "Shown after each completed challenge task.",
    },
    day_completed: {
      label: "Day completed",
      helper: "Shown when a full challenge day is finished.",
    },
    challenge_completed: {
      label: "Challenge completed",
      helper: "Shown when the entire 3-day challenge is finished.",
    },
  };

  const emptyMeta: Record<string, { label: string; helper: string }> = {
    no_referrals: {
      label: "No referrals yet",
      helper: "Shown on the referrals page when no one has been invited.",
    },
    no_unlocks: {
      label: "No unlocks yet",
      helper: "Shown on the unlocks page before anything is earned.",
    },
    no_featured: {
      label: "No featured builders",
      helper: "Shown when no builders are currently featured.",
    },
    no_activity: {
      label: "No activity",
      helper: "Shown when the activity feed is empty.",
    },
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Notifications & Copy"
        description="Edit toast messages and empty-state messages. Use [placeholders] for dynamic values."
      />

      <EditorCard
        title="Toast Messages"
        description="Quick popup messages that appear when something happens."
      >
        {Object.entries(draft.toasts).map(([key, value]) => {
          const meta = toastMeta[key];
          return (
            <EditableField
              key={key}
              label={meta?.label ?? key}
              helper={meta?.helper}
              value={value}
              onChange={(v) => updateToast(key, v)}
            />
          );
        })}
      </EditorCard>

      <EditorCard
        title="Empty State Messages"
        description="Friendly messages shown when a list or screen has no content yet."
      >
        {Object.entries(draft.emptyStates).map(([key, value]) => {
          const meta = emptyMeta[key];
          return (
            <EditableField
              key={key}
              label={meta?.label ?? key}
              helper={meta?.helper}
              value={value}
              onChange={(v) => updateEmpty(key, v)}
            />
          );
        })}
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save notifications" />
    </div>
  );
};

export default CmsNotifications;
