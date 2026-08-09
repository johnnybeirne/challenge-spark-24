import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { CmsPageHeader, EditorCard, EditableField } from "@/components/cms/cms-ui";

type FeaturedSettings = { id: string; threshold: number };
type InviteBadge = {
  id: string;
  name: string;
  threshold: number;
  description: string;
  sort_order: number;
};

const AdminReferralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<FeaturedSettings | null>(null);
  const [thresholdInput, setThresholdInput] = useState("100");
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [badges, setBadges] = useState<InviteBadge[]>([]);
  const [savingBadgeId, setSavingBadgeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: fc }, { data: bd }] = await Promise.all([
        (supabase.from("featured_creator_settings") as any)
          .select("id, threshold")
          .limit(1)
          .maybeSingle(),
        (supabase.from("invite_badges") as any)
          .select("id, name, threshold, description, sort_order")
          .order("sort_order", { ascending: true }),
      ]);
      if (fc) {
        setFeatured(fc as FeaturedSettings);
        setThresholdInput(String((fc as FeaturedSettings).threshold));
      }
      setBadges((bd as InviteBadge[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const saveFeatured = async () => {
    setSavingFeatured(true);
    try {
      const value = parseInt(thresholdInput, 10);
      if (isNaN(value) || value < 1) throw new Error("invalid");
      const payload = featured?.id
        ? { id: featured.id, threshold: value }
        : { threshold: value };
      const { data, error } = await (supabase.from("featured_creator_settings") as any)
        .upsert(payload)
        .select("id, threshold")
        .single();
      if (error) throw error;
      setFeatured(data as FeaturedSettings);
      toast.success("Saved");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSavingFeatured(false);
    }
  };

  const patchBadge = (id: string, changes: Partial<InviteBadge>) =>
    setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));

  const saveBadge = async (badge: InviteBadge) => {
    setSavingBadgeId(badge.id);
    try {
      const { error } = await (supabase.from("invite_badges") as any)
        .update({ name: badge.name, description: badge.description })
        .eq("id", badge.id);
      if (error) throw error;
      toast.success("Saved");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSavingBadgeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Referral settings"
        description="Control the Featured Creator milestone and the invite badge copy participants see."
      />

      <EditorCard
        title="Featured Creator milestone"
        description="Set the total all-time invite count that earns a user Featured Creator status."
        action={
          <Button size="sm" onClick={saveFeatured} disabled={savingFeatured}>
            {savingFeatured ? "Saving..." : "Save"}
          </Button>
        }
      >
        <EditableField
          label="Signups required"
          type="number"
          value={thresholdInput}
          onChange={setThresholdInput}
        />
        <p className="text-sm text-muted-foreground">
          At this threshold, a user who invites {parseInt(thresholdInput, 10) || 0} people has
          earned {((parseInt(thresholdInput, 10) || 0) / 5).toFixed(1)} months of free access.
        </p>
      </EditorCard>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Invite badges</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Edit the name and description for each badge. Thresholds and order are fixed.
        </p>
      </div>

      {badges.map((badge) => (
        <EditorCard
          key={badge.id}
          title={`${badge.threshold} ${badge.threshold === 1 ? "invite" : "invites"}`}
          description="Threshold is fixed and cannot be edited."
          action={
            <Button
              size="sm"
              onClick={() => saveBadge(badge)}
              disabled={savingBadgeId === badge.id}
            >
              {savingBadgeId === badge.id ? "Saving..." : "Save"}
            </Button>
          }
        >
          <EditableField
            label="Badge name"
            value={badge.name}
            onChange={(v) => patchBadge(badge.id, { name: v })}
          />
          <EditableField
            label="Description"
            multiline
            rows={2}
            value={badge.description}
            onChange={(v) => patchBadge(badge.id, { description: v })}
          />
        </EditorCard>
      ))}
    </div>
  );
};

export default AdminReferralSettings;
