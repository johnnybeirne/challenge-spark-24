import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSiteConfig, type ChallengeConfig, type ChallengeTask, type UpgradeCardsConfig, type UpgradeCardPlan } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  RepeatableList,
  StickyActionBar,
  AdvancedDetails,
  FieldLabel,
} from "./cms-ui";

const CmsChallenge = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<ChallengeConfig>(JSON.parse(JSON.stringify(config.challenge)));
  const [upgradeDraft, setUpgradeDraft] = useState<UpgradeCardsConfig>(
    JSON.parse(JSON.stringify(config.upgradeCards)),
  );

  const updatePlan = (slot: "plan1" | "plan2", field: keyof UpgradeCardPlan, value: string) => {
    setUpgradeDraft((prev) => ({ ...prev, [slot]: { ...prev[slot], [field]: value } }));
  };

  const updateTask = (dayIdx: number, taskIdx: number, field: keyof ChallengeTask, value: string) => {
    const days = [...draft.days];
    const tasks = [...days[dayIdx].tasks];
    tasks[taskIdx] = { ...tasks[taskIdx], [field]: value };
    days[dayIdx] = { ...days[dayIdx], tasks };
    setDraft((prev) => ({ ...prev, days }));
  };

  const updateDay = (dayIdx: number, field: string, value: any) => {
    const days = [...draft.days];
    days[dayIdx] = { ...days[dayIdx], [field]: value };
    setDraft((prev) => ({ ...prev, days }));
  };

  const save = () => {
    updateSection("challenge", draft);
    updateSection("upgradeCards", upgradeDraft);
    toast.success("Challenge content updated");
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Challenge Content"
        description="Edit the 3-day challenge — titles, intros, and the tasks people complete each day."
      />

      <EditorCard title="Overall Challenge" description="Top-level title shown across the challenge.">
        <EditableField
          label="Challenge title"
          helper="Shown at the top of the challenge dashboard."
          value={draft.challengeTitle}
          onChange={(v) => setDraft((prev) => ({ ...prev, challengeTitle: v }))}
        />
        <p className="text-xs text-muted-foreground">The challenge has 3 days (fixed for now).</p>
      </EditorCard>

      {draft.days.map((day, dayIdx) => (
        <EditorCard
          key={dayIdx}
          title={`Day ${dayIdx + 1}`}
          description={`What people see and do on day ${dayIdx + 1} of the challenge.`}
        >
          <EditableField
            label="Day title"
            helper={`Big heading shown at the top of Day ${dayIdx + 1}.`}
            value={day.title}
            onChange={(v) => updateDay(dayIdx, "title", v)}
          />
          <EditableField
            label="Day subtitle"
            helper="Short line under the day title."
            value={day.subtitle}
            onChange={(v) => updateDay(dayIdx, "subtitle", v)}
          />

          <RepeatableList
            label="Tasks for this day"
            helper="Each task is something the person completes during the day."
            items={day.tasks}
            itemLabel={(i) => `Task ${i + 1}`}
            addLabel="Add task"
            onAdd={() => {
              if (day.tasks.length >= 5) return;
              updateDay(dayIdx, "tasks", [
                ...day.tasks,
                { title: "", description: "", type: "textarea" },
              ]);
            }}
            onRemove={(i) =>
              updateDay(
                dayIdx,
                "tasks",
                day.tasks.filter((_, j) => j !== i),
              )
            }
            renderItem={(task, taskIdx) => (
              <div className="space-y-3">
                <EditableField
                  label="Task title"
                  value={task.title}
                  onChange={(v) => updateTask(dayIdx, taskIdx, "title", v)}
                />
                <AdvancedDetails>
                  <div className="space-y-1.5">
                    <FieldLabel
                      label="Input type"
                      helper="Controls what kind of input the user gets to fill in."
                    />
                    <Select
                      value={task.type}
                      onValueChange={(v) => updateTask(dayIdx, taskIdx, "type", v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="textarea">Long text (textarea)</SelectItem>
                        <SelectItem value="text_input">Short text</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="url_input">Web link (URL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AdvancedDetails>
              </div>
            )}
          />

          {day.nudgeText !== undefined && (
            <EditableField
              label="Nudge text"
              helper="A small motivational message shown during the day."
              value={day.nudgeText || ""}
              onChange={(v) => updateDay(dayIdx, "nudgeText", v)}
              multiline
              rows={2}
            />
          )}

          {dayIdx === 2 && (
            <>
              <ToggleField
                label="Require people to submit a URL"
                helper="If on, people must paste their launch URL to complete Day 3."
                checked={day.requireUrl ?? true}
                onChange={(v) => updateDay(dayIdx, "requireUrl", v)}
              />
              <EditableField
                label="Completion message"
                helper="Shown right after people finish Day 3."
                value={day.completionMessage || ""}
                onChange={(v) => updateDay(dayIdx, "completionMessage", v)}
                multiline
                rows={2}
              />
              <EditableField
                label="Post-completion tension text"
                helper="Encourages the next step after completion."
                value={day.postCompletionTension || ""}
                onChange={(v) => updateDay(dayIdx, "postCompletionTension", v)}
                multiline
                rows={2}
              />
            </>
          )}
        </EditorCard>
      ))}

      <EditorCard
        title="Upgrade cards"
        description="Two side-by-side upgrade cards shown on Day 1/2/3 completion screens and Day 2/3 locked screens."
      >
        <EditableField
          label="Heading shown above the cards"
          value={upgradeDraft.heading}
          onChange={(v) => setUpgradeDraft((p) => ({ ...p, heading: v }))}
          multiline
          rows={2}
        />
        {(["plan1", "plan2"] as const).map((slot) => (
          <div key={slot} className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {slot === "plan1" ? "Card 1" : "Card 2"}
            </p>
            <EditableField
              label="Name"
              value={upgradeDraft[slot].name}
              onChange={(v) => updatePlan(slot, "name", v)}
            />
            <EditableField
              label="Price"
              value={upgradeDraft[slot].price}
              onChange={(v) => updatePlan(slot, "price", v)}
            />
            <EditableField
              label="Description"
              value={upgradeDraft[slot].description}
              onChange={(v) => updatePlan(slot, "description", v)}
              multiline
              rows={3}
            />
            <EditableField
              label="Button text"
              value={upgradeDraft[slot].ctaText}
              onChange={(v) => updatePlan(slot, "ctaText", v)}
            />
            <EditableField
              label="Button link"
              value={upgradeDraft[slot].ctaLink}
              onChange={(v) => updatePlan(slot, "ctaLink", v)}
            />
          </div>
        ))}
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save challenge" />
    </div>
  );
};

export default CmsChallenge;
