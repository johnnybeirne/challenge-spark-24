import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteConfig, type NotificationConfig } from "@/context/SiteConfigContext";

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

  const toastLabels: Record<string, string> = {
    unlock_earned: "Unlock Earned",
    builder_circle_unlocked: "Builder Circle Unlocked",
    builder_supported: "Builder Supported",
    partner_approved: "Partner Approved",
    task_completed: "Task Completed",
    day_completed: "Day Completed",
    challenge_completed: "Challenge Completed",
  };

  const emptyLabels: Record<string, string> = {
    no_referrals: "No Referrals",
    no_unlocks: "No Unlocks",
    no_featured: "No Featured Builders",
    no_activity: "No Activity",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Notifications & Copy</h2>
        <p className="text-sm text-muted-foreground">Edit toast messages and empty states. Use [placeholders] for dynamic values.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Toast Messages</h3>
        {Object.entries(draft.toasts).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{toastLabels[key] || key}</Label>
            <Input value={value} onChange={(e) => updateToast(key, e.target.value)} />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Empty State Messages</h3>
        {Object.entries(draft.emptyStates).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{emptyLabels[key] || key}</Label>
            <Input value={value} onChange={(e) => updateEmpty(key, e.target.value)} />
          </div>
        ))}
      </section>

      <Button onClick={save} className="w-full">Save Notifications</Button>
    </div>
  );
};

export default CmsNotifications;
