import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type GlobalConfig } from "@/context/SiteConfigContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
      if (!data) { toast.error("No data found"); return; }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch { toast.error("Export failed"); }
  };

  const exportAllUserData = () => {
    try {
      const allData: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("challengeos_")) {
          try { allData[k] = JSON.parse(localStorage.getItem(k)!); } catch { allData[k] = localStorage.getItem(k); }
        }
      }
      if (Object.keys(allData).length === 0) { toast.error("No user data found"); return; }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "challengeos_all_data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All user data exported");
    } catch { toast.error("Export failed"); }
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
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Global Settings</h2>
        <p className="text-sm text-muted-foreground">Cohort timing, analytics, and data management.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Cohort Settings</h3>
        <div className="space-y-2">
          <Label>Cohort Start Day</Label>
          <Select value={draft.cohortStartDay} onValueChange={(v) => update("cohortStartDay", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cohort Duration (days)</Label>
          <Input type="number" value={draft.cohortDuration} onChange={(e) => update("cohortDuration", Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showCohortTiming} onCheckedChange={(v) => update("showCohortTiming", v)} />
          <Label>Show cohort timing on landing page</Label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Analytics</h3>
        <div className="space-y-2">
          <Label>Admin Password</Label>
          <Input type="password" value={draft.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.trackAnalytics} onCheckedChange={(v) => update("trackAnalytics", v)} />
          <Label>Track analytics</Label>
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Global Settings</Button>

      <section className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Data Management</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportAllUserData}>Export all user data</Button>
          <Button variant="outline" size="sm" onClick={() => exportData("challengeos_site_config")}>Export site config</Button>
          <Button variant="outline" size="sm" onClick={() => exportData("challengeos_assessment")}>Export assessment data</Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-300">Reset config to defaults</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
              <AlertDialogDescription>This will reset all CMS configuration to default values. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetToDefaults(); toast.success("Config reset to defaults"); }}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!confirmClear ? (
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => setConfirmClear(true)}>
            Clear all user data
          </Button>
        ) : (
          <div className="border border-destructive/30 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Are you absolutely sure?</p>
            <p className="text-xs text-muted-foreground">This will permanently delete all user progress, assessment results, and challenge data. Site config will be preserved.</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={clearAllUserData}>Yes, clear everything</Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CmsGlobal;
