import { useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type RewardsConfig, type RewardDef } from "@/context/SiteConfigContext";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  RepeatableList,
  StickyActionBar,
} from "./cms-ui";

const CmsRewards = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<RewardsConfig>(JSON.parse(JSON.stringify(config.rewards)));

  const updateReward = (
    list: "challengeRewards" | "referralRewards",
    index: number,
    field: keyof RewardDef,
    value: string | number,
  ) => {
    const items = [...draft[list]];
    items[index] = { ...items[index], [field]: value };
    setDraft((prev) => ({ ...prev, [list]: items }));
  };

  const save = () => {
    updateSection("rewards", draft);
    toast.success("Rewards & Unlocks updated");
  };

  const renderRewardCard = (
    title: string,
    description: string,
    list: "challengeRewards" | "referralRewards",
  ) => (
    <EditorCard title={title} description={description}>
      <RepeatableList
        items={draft[list]}
        itemLabel={(i) => `Reward ${i + 1}`}
        addLabel="Add reward"
        onAdd={() =>
          setDraft((prev) => ({
            ...prev,
            [list]: [...prev[list], { trigger: "", name: "", value: 0, description: "" }],
          }))
        }
        onRemove={(i) =>
          setDraft((prev) => ({
            ...prev,
            [list]: prev[list].filter((_, j) => j !== i),
          }))
        }
        renderItem={(r, i) => (
          <div className="space-y-3">
            <EditableField
              label="Reward name"
              helper="What people see when they earn this reward."
              value={r.name}
              onChange={(v) => updateReward(list, i, "name", v)}
            />
            <EditableField
              label="Description"
              helper="A short line explaining what the reward is."
              value={r.description}
              onChange={(v) => updateReward(list, i, "description", v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="Trigger"
                helper="When this reward is awarded (e.g. day_1_complete)."
                value={r.trigger}
                onChange={(v) => updateReward(list, i, "trigger", v)}
              />
              <EditableField
                label="Value (USD)"
                helper="How much it's worth, in dollars."
                type="number"
                value={String(r.value)}
                onChange={(v) => updateReward(list, i, "value", Number(v))}
              />
            </div>
          </div>
        )}
      />
    </EditorCard>
  );

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Rewards & Unlocks"
        description="Configure what people earn through the challenge, referrals, and the Builder Circle."
      />

      {renderRewardCard(
        "Challenge Rewards",
        "Things people unlock as they complete the 3-day challenge.",
        "challengeRewards",
      )}

      {renderRewardCard(
        "Referral Rewards",
        "Things people unlock for inviting others.",
        "referralRewards",
      )}

      <EditorCard
        title="Builder Circle Unlock"
        description="Requirements for entering the Builder Circle."
      >
        <ToggleField
          label="Require Day 3 to be complete"
          checked={draft.builderCircle.requireDay3}
          onChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              builderCircle: { ...prev.builderCircle, requireDay3: v },
            }))
          }
        />
        <ToggleField
          label="Require a launch URL"
          helper="Users must submit a URL of what they built."
          checked={draft.builderCircle.requireUrl}
          onChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              builderCircle: { ...prev.builderCircle, requireUrl: v },
            }))
          }
        />
        <EditableField
          label="Required referrals"
          helper="How many direct referrals are needed to unlock the Builder Circle."
          type="number"
          value={String(draft.builderCircle.requiredReferrals)}
          onChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              builderCircle: { ...prev.builderCircle, requiredReferrals: Number(v) },
            }))
          }
        />
        <EditableField
          label="Unlock value (USD)"
          helper="Dollar value displayed on the Builder Circle unlock card."
          type="number"
          value={String(draft.builderCircle.unlockValue)}
          onChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              builderCircle: { ...prev.builderCircle, unlockValue: Number(v) },
            }))
          }
        />
        <EditableField
          label="Unlock message"
          helper="Shown right after someone unlocks the Builder Circle."
          value={draft.builderCircle.unlockMessage}
          onChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              builderCircle: { ...prev.builderCircle, unlockMessage: v },
            }))
          }
          multiline
        />
      </EditorCard>

      <EditorCard
        title="Rewards Ladder (/rewards page)"
        description="Each rung on the public rewards ladder. Prices, names, and double-unlock styling are all editable here."
      >
        <div className="grid grid-cols-2 gap-3">
          <EditableField
            label="Full suite price (USD)"
            helper="Price shown in the pinned bottom bar."
            type="number"
            value={String(draft.ladder.fullSuitePrice)}
            onChange={(v) =>
              setDraft((prev) => ({
                ...prev,
                ladder: { ...prev.ladder, fullSuitePrice: Number(v) },
              }))
            }
          />
          <EditableField
            label="Full suite Stripe price ID"
            helper="The price_id registered in Stripe (e.g. reward_full_suite)."
            value={draft.ladder.fullSuitePriceId}
            onChange={(v) =>
              setDraft((prev) => ({
                ...prev,
                ladder: { ...prev.ladder, fullSuitePriceId: v },
              }))
            }
          />
        </div>

        <div className="mt-4 space-y-3">
          {draft.ladder.rungs.map((rung, i) => (
            <div key={rung.points} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">{rung.points} pts</p>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Reward name"
                  value={rung.name}
                  onChange={(v) =>
                    setDraft((prev) => {
                      const rungs = [...prev.ladder.rungs];
                      rungs[i] = { ...rungs[i], name: v };
                      return { ...prev, ladder: { ...prev.ladder, rungs } };
                    })
                  }
                />
                <EditableField
                  label="Stripe price ID"
                  value={rung.priceId}
                  onChange={(v) =>
                    setDraft((prev) => {
                      const rungs = [...prev.ladder.rungs];
                      rungs[i] = { ...rungs[i], priceId: v };
                      return { ...prev, ladder: { ...prev.ladder, rungs } };
                    })
                  }
                />
                <EditableField
                  label="Retail value (USD)"
                  type="number"
                  value={String(rung.retailValue)}
                  onChange={(v) =>
                    setDraft((prev) => {
                      const rungs = [...prev.ladder.rungs];
                      rungs[i] = { ...rungs[i], retailValue: Number(v) };
                      return { ...prev, ladder: { ...prev.ladder, rungs } };
                    })
                  }
                />
                <EditableField
                  label="Buy price (USD)"
                  type="number"
                  value={String(rung.buyPrice)}
                  onChange={(v) =>
                    setDraft((prev) => {
                      const rungs = [...prev.ladder.rungs];
                      rungs[i] = { ...rungs[i], buyPrice: Number(v) };
                      return { ...prev, ladder: { ...prev.ladder, rungs } };
                    })
                  }
                />
              </div>
              <div className="mt-2">
                <ToggleField
                  label="Double unlock (gold/amber styling)"
                  helper="Highlights this rung as a JV partner bonus tier."
                  checked={rung.doubleUnlock}
                  onChange={(v) =>
                    setDraft((prev) => {
                      const rungs = [...prev.ladder.rungs];
                      rungs[i] = { ...rungs[i], doubleUnlock: v };
                      return { ...prev, ladder: { ...prev.ladder, rungs } };
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save rewards" />
    </div>
  );
};

export default CmsRewards;

