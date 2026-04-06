import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type CommunityConfig } from "@/context/SiteConfigContext";

const CmsCommunity = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<CommunityConfig>(JSON.parse(JSON.stringify(config.community)));

  const update = <K extends keyof CommunityConfig>(key: K, value: CommunityConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    updateSection("community", draft);
    toast.success("Community settings updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Community & Builder Circle</h2>
        <p className="text-sm text-muted-foreground">Configure Builder Circle, leaderboard, and activity feed.</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Builder Circle</h3>
        <div className="space-y-2">
          <Label>Page Title</Label>
          <Input value={draft.pageTitle} onChange={(e) => update("pageTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Page Subtitle</Label>
          <Textarea value={draft.pageSubtitle} onChange={(e) => update("pageSubtitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Value Banner Title</Label>
          <Input value={draft.valueBannerTitle} onChange={(e) => update("valueBannerTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Value Banner Body</Label>
          <Textarea value={draft.valueBannerBody} onChange={(e) => update("valueBannerBody", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Leaderboard</h3>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showLeaderboard} onCheckedChange={(v) => update("showLeaderboard", v)} />
          <Label>Show leaderboard</Label>
        </div>
        <div className="space-y-2">
          <Label>Default Tab</Label>
          <Select value={draft.defaultTab} onValueChange={(v) => update("defaultTab", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="supportive">Most supportive</SelectItem>
              <SelectItem value="network">Network growth</SelectItem>
              <SelectItem value="active">Most active</SelectItem>
              <SelectItem value="launched">Recently launched</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Leaderboard Title</Label>
          <Input value={draft.leaderboardTitle} onChange={(e) => update("leaderboardTitle", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Activity Feed</h3>
        <div className="flex items-center gap-3">
          <Switch checked={draft.showActivityFeed} onCheckedChange={(v) => update("showActivityFeed", v)} />
          <Label>Show activity feed</Label>
        </div>
        <div className="space-y-2">
          <Label>Refresh interval (seconds)</Label>
          <Input type="number" value={draft.feedRefreshInterval} onChange={(e) => update("feedRefreshInterval", Number(e.target.value))} className="w-24" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Featured Builders</h3>
        <div className="space-y-2">
          <Label>Featured slots</Label>
          <Input type="number" value={draft.featuredSlots} onChange={(e) => update("featuredSlots", Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.autoFeature} onCheckedChange={(v) => update("autoFeature", v)} />
          <Label>Auto-feature based on score</Label>
        </div>
        <div className="space-y-2">
          <Label>Minimum score to auto-feature</Label>
          <Input type="number" value={draft.minScoreToFeature} onChange={(e) => update("minScoreToFeature", Number(e.target.value))} className="w-24" />
        </div>
      </section>

      <Button onClick={save} className="w-full">Save Community Settings</Button>
    </div>
  );
};

export default CmsCommunity;
