import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type CommunityConfig } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  StickyActionBar,
  FieldLabel,
} from "./cms-ui";

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
    <div className="space-y-6">
      <CmsPageHeader
        title="Community & Builder Circle"
        description="Configure the Builder Circle page, the leaderboard, and the activity feed."
      />

      <EditorCard
        title="Builder Circle Page"
        description="Headings shown at the top of the Builder Circle page."
      >
        <EditableField
          label="Page title"
          helper="Big heading at the top of the Builder Circle page."
          value={draft.pageTitle}
          onChange={(v) => update("pageTitle", v)}
        />
        <EditableField
          label="Page subtitle"
          helper="Short description shown under the page title."
          value={draft.pageSubtitle}
          onChange={(v) => update("pageSubtitle", v)}
          multiline
        />
        <EditableField
          label="Value banner title"
          helper="Heading on the value-prop banner inside the page."
          value={draft.valueBannerTitle}
          onChange={(v) => update("valueBannerTitle", v)}
        />
        <EditableField
          label="Value banner body"
          helper="Body copy inside the value-prop banner."
          value={draft.valueBannerBody}
          onChange={(v) => update("valueBannerBody", v)}
          multiline
        />
      </EditorCard>

      <EditorCard
        title="Leaderboard"
        description="Public leaderboard inside the Builder Circle."
      >
        <ToggleField
          label="Show leaderboard"
          checked={draft.showLeaderboard}
          onChange={(v) => update("showLeaderboard", v)}
        />
        <div className="space-y-1.5">
          <FieldLabel
            label="Default tab"
            helper="Which leaderboard view is shown when the page first loads."
          />
          <Select value={draft.defaultTab} onValueChange={(v) => update("defaultTab", v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supportive">Most supportive</SelectItem>
              <SelectItem value="network">Network growth</SelectItem>
              <SelectItem value="active">Most active</SelectItem>
              <SelectItem value="launched">Recently launched</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <EditableField
          label="Leaderboard title"
          helper="Heading shown above the leaderboard."
          value={draft.leaderboardTitle}
          onChange={(v) => update("leaderboardTitle", v)}
        />
      </EditorCard>

      <EditorCard
        title="Activity Feed"
        description="The live feed of what other builders are doing."
      >
        <ToggleField
          label="Show activity feed"
          checked={draft.showActivityFeed}
          onChange={(v) => update("showActivityFeed", v)}
        />
        <EditableField
          label="Refresh interval (seconds)"
          helper="How often the feed checks for new activity."
          type="number"
          value={String(draft.feedRefreshInterval)}
          onChange={(v) => update("feedRefreshInterval", Number(v))}
        />
      </EditorCard>

      <EditorCard
        title="Featured Builders"
        description="Settings for which builders get featured."
      >
        <EditableField
          label="Featured slots"
          helper="How many builders are featured at any given time."
          type="number"
          value={String(draft.featuredSlots)}
          onChange={(v) => update("featuredSlots", Number(v))}
        />
        <ToggleField
          label="Auto-feature based on score"
          helper="When on, top-scoring builders are automatically featured."
          checked={draft.autoFeature}
          onChange={(v) => update("autoFeature", v)}
        />
        <EditableField
          label="Minimum score to auto-feature"
          helper="Builders below this score won't be featured automatically."
          type="number"
          value={String(draft.minScoreToFeature)}
          onChange={(v) => update("minScoreToFeature", Number(v))}
        />
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save community settings" />
    </div>
  );
};

export default CmsCommunity;
