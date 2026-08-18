import { useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type LadderRung } from "@/context/SiteConfigContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  StickyActionBar,
} from "@/components/cms/cms-ui";


const normalise = (rungs: LadderRung[]): LadderRung[] =>
  rungs
    .map((r, i) => ({ ...r, position: typeof r.position === "number" ? r.position : i + 1 }))
    .sort((a, b) => a.position - b.position)
    .map((r, i) => ({ ...r, position: i + 1 }));

const AdminRewardsLadder = () => {
  const { config, updateSection } = useSiteConfig();
  const [ladder, setLadder] = useState(() => ({
    ...config.rewards.ladder,
    rungs: normalise(config.rewards.ladder.rungs),
  }));

  const setRungs = (rungs: LadderRung[]) =>
    setLadder((prev) => ({ ...prev, rungs: normalise(rungs) }));

  const updateRung = (i: number, patch: Partial<LadderRung>) =>
    setRungs(ladder.rungs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) => {
    const next = [...ladder.rungs];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setRungs(next.map((r, k) => ({ ...r, position: k + 1 })));
  };

  const save = () => {
    const clean = normalise(ladder.rungs);
    updateSection("rewards", { ...config.rewards, ladder: { ...ladder, rungs: clean } });
    setLadder((prev) => ({ ...prev, rungs: clean }));
    toast.success("Rewards ladder updated");
  };

  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<
    { lookupKey: string; name: string; amount: number; status: string; priceId: string }[] | null
  >(null);

  const syncPrices = async () => {
    setSyncing(true);
    setSyncSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-reward-prices", {
        body: { environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSyncSummary(data.results ?? []);
      toast.success(`Stripe sync complete: ${data.created} created, ${data.existing} already existed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Rewards Ladder"
        description="Each rung offers two paths: earn it free at a points threshold, or buy it outright. The order below is the exact order participants see."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/rewards" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Preview live page
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={syncPrices} disabled={syncing}>
          {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Sync reward prices to Stripe ({getStripeEnvironment()})
        </Button>
      </div>

      {syncSummary && (
        <EditorCard
          title="Stripe sync summary"
          description="Result of the last price provisioning run."
        >
          <div className="space-y-1 text-sm">
            {syncSummary.map((r) => (
              <div key={r.lookupKey} className="flex items-center justify-between gap-3 border-b py-1 last:border-b-0">
                <span className="font-mono text-xs">{r.lookupKey}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-muted-foreground">${(r.amount / 100).toFixed(0)}</span>
                <span className={r.status === "created" ? "font-semibold text-emerald-600" : "text-muted-foreground"}>
                  {r.status === "created" ? "Created" : "Already existed"}
                </span>
              </div>
            ))}
          </div>
        </EditorCard>
      )}



      <EditorCard title="Buy everything bundle" description="Shown in the pinned bottom bar.">
        <div className="grid gap-3 sm:grid-cols-2">
          <EditableField
            label="Bundle price (USD)"
            type="number"
            value={String(ladder.fullSuitePrice)}
            onChange={(v) => setLadder((p) => ({ ...p, fullSuitePrice: Number(v) }))}
          />
          <EditableField
            label="Bundle price ID"
            helper="The price_id used at checkout."
            value={ladder.fullSuitePriceId}
            onChange={(v) => setLadder((p) => ({ ...p, fullSuitePriceId: v }))}
          />
        </div>
      </EditorCard>

      <EditorCard
        title="Invite block"
        description="Shown at the top and bottom of the ladder. The link itself is unique to each participant."
      >
        <div className="grid gap-3">
          <EditableField
            label="Heading"
            value={ladder.inviteHeading ?? ""}
            onChange={(v) => setLadder((p) => ({ ...p, inviteHeading: v }))}
          />
          <EditableField
            label="Copy line"
            value={ladder.inviteBody ?? ""}
            onChange={(v) => setLadder((p) => ({ ...p, inviteBody: v }))}
          />
        </div>
      </EditorCard>

      <EditorCard
        title="Ladder rungs"
        description="Reward name, points to earn it free, one price, and order."
      >
        <div className="space-y-3">
          {ladder.rungs.map((rung, i) => (
            <div key={`${rung.priceId}-${i}`} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Position {rung.position}</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(i, 1)}
                    disabled={i === ladder.rungs.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRungs(ladder.rungs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Reward name"
                  value={rung.name}
                  onChange={(v) => updateRung(i, { name: v })}
                />
                <EditableField
                  label="Points to earn it free"
                  type="number"
                  value={String(rung.points)}
                  onChange={(v) => updateRung(i, { points: Number(v) })}
                />
                <EditableField
                  label="Price (USD)"
                  helper="One price per rung — shown as “worth $X” on the earn side and the buy price. Set to 0 for an earn-only reward."
                  type="number"
                  value={String(rung.buyPrice)}
                  onChange={(v) => updateRung(i, { buyPrice: Number(v) })}
                />
                <EditableField
                  label="Price ID"
                  value={rung.priceId}
                  onChange={(v) => updateRung(i, { priceId: v })}
                />
              </div>
              <div className="mt-2">
                <ToggleField
                  label="Double unlock (gold styling)"
                  checked={rung.doubleUnlock}
                  onChange={(v) => updateRung(i, { doubleUnlock: v })}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            setRungs([
              ...ladder.rungs,
              {
                points: 0,
                name: "New reward",
                
                buyPrice: 0,
                priceId: "",
                doubleUnlock: false,
                position: ladder.rungs.length + 1,
              },
            ])
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add rung
        </Button>
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save ladder" />
    </div>
  );
};

export default AdminRewardsLadder;
