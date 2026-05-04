import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type GlobalConfig } from "@/context/SiteConfigContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  StickyActionBar,
  FieldLabel,
} from "./cms-ui";

const CmsGlobal = () => {
  const { config, updateSection, resetToDefaults } = useSiteConfig();
  const [draft, setDraft] = useState<GlobalConfig>({ ...config.global });
  const [confirmClear, setConfirmClear] = useState(false);

  const update = <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    updateSection("global", draft);
    toast.success("Global settings updated");
  };

  const exportData = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        toast.error("No data found");
        return;
      }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const exportAllUserData = () => {
    try {
      const allData: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("challengeos_")) {
          try {
            allData[k] = JSON.parse(localStorage.getItem(k)!);
          } catch {
            allData[k] = localStorage.getItem(k);
          }
        }
      }
      if (Object.keys(allData).length === 0) {
        toast.error("No user data found");
        return;
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "challengeos_all_data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All user data exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const clearAllUserData = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("challengeos_") && k !== "challengeos_site_config") keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    toast.success(`Cleared ${keys.length} data entries`);
    setConfirmClear(false);
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Global Settings"
        description="Cohort timing, analytics, and data management."
      />

      <EditorCard title="Cohort Settings" description="When new cohorts start and how long they run.">
        <div className="space-y-1.5">
          <FieldLabel
            label="Cohort start day"
            helper="Day of the week when new cohorts start."
          />
          <Select value={draft.cohortStartDay} onValueChange={(v) => update("cohortStartDay", v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <EditableField
          label="Cohort duration (days)"
          helper="How long a cohort runs."
          type="number"
          value={String(draft.cohortDuration)}
          onChange={(v) => update("cohortDuration", Number(v))}
        />
        <ToggleField
          label="Show cohort timing on the landing page"
          checked={draft.showCohortTiming}
          onChange={(v) => update("showCohortTiming", v)}
        />
      </EditorCard>

      <EditorCard title="Analytics & Access" description="Admin password and analytics settings.">
        <EditableField
          label="Admin password"
          helper="Used for admin-only areas."
          type="password"
          value={draft.adminPassword}
          onChange={(v) => update("adminPassword", v)}
        />
        <ToggleField
          label="Track analytics"
          helper="When on, user actions are recorded for analytics."
          checked={draft.trackAnalytics}
          onChange={(v) => update("trackAnalytics", v)}
        />
      </EditorCard>

      <EditorCard
        title="Data Management"
        description="Export or reset stored configuration and user data."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportAllUserData}>Export all user data</Button>
          <Button variant="outline" size="sm" onClick={() => exportData("challengeos_site_config")}>
            Export site config
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData("challengeos_assessment")}>
            Export assessment data
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-300">
              Reset config to defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all CMS configuration to default values. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetToDefaults(); toast.success("Config reset to defaults"); }}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!confirmClear ? (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30"
            onClick={() => setConfirmClear(true)}
          >
            Clear all user data
          </Button>
        ) : (
          <div className="border border-destructive/30 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Are you absolutely sure?</p>
            <p className="text-xs text-muted-foreground">
              This will permanently delete all user progress, assessment results, and challenge data.
              Site config will be preserved.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={clearAllUserData}>
                Yes, clear everything
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save global settings" />
    </div>
  );
};

export default CmsGlobal;
