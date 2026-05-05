import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ExternalLink, Gift, Lock, Sparkles, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";

interface PartnerAsset {
  id: string;
  contribution_title: string;
  contribution_description: string;
  estimated_value: number;
  contribution_url: string;
  user_id: string;
  partner_name?: string;
}

const challengeBonuses = [
  { id: "day1_blueprint", title: "Challenge Blueprint", benefit: "Map the structure of your offer and user journey.", day: 1 },
  { id: "day2_playbook", title: "Experience Playbook", benefit: "Turn your idea into a step-by-step user experience.", day: 2 },
  { id: "day3_checklist", title: "Launch Checklist", benefit: "Ship with a cleaner message and launch plan.", day: 3 },
];

const partnerImages = ["bg-primary/10", "bg-accent/10", "bg-success/10"];

const CREDIT_REWARDS_CATALOG: Record<string, { title: string; description: string; threshold: number }> = {
  launch_checklist: { title: "Challenge Launch Checklist", description: "A printable checklist to make sure your launch goes live cleanly.", threshold: 50 },
  ai_prompt_pack: { title: "AI Prompt Pack", description: "Battle-tested prompts for shaping your challenge with AI.", threshold: 100 },
  referral_templates: { title: "Referral Message Templates", description: "Plug-and-play scripts for inviting people who actually join.", threshold: 150 },
};
const UNLOCKED_STORAGE_KEY = "leadio.unlockedRewards.v1";

const Rewards = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [assets, setAssets] = useState<PartnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditUnlocked, setCreditUnlocked] = useState<string[]>([]);
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "there";
  const direct = state.network.direct;
  const completedDay = state.challenge.completed ? 3 : Math.max(0, state.challenge.currentDay - 1);
  const unlockedChallengeBonuses = challengeBonuses.filter((b) => completedDay >= b.day).length;
  const unlockedPartnerCount = direct >= 10 ? assets.length : direct >= 5 ? 5 : direct >= 3 ? 3 : Math.min(1, assets.length);

  useEffect(() => { trackEvent("reward_accessed"); }, []);

  useEffect(() => {
    (async () => {
      const { data: contribs } = await (supabase.from("partner_contributions") as any)
        .select("id, contribution_title, contribution_description, estimated_value, contribution_url, user_id")
        .eq("status", "approved")
        .order("estimated_value", { ascending: false });

      if (!contribs?.length) { setAssets([]); setLoading(false); return; }
      const userIds = [...new Set(contribs.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds as string[]);
      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.name]));
      setAssets(contribs.map((c: any) => ({ ...c, partner_name: nameMap.get(c.user_id) || "Builder" })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-10 pb-24">
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Your Bonus Vault</h1>
          </div>
          <p className="mt-2 text-muted-foreground">Unlock tools, training, and rewards as you build your challenge</p>
        </header>

        <Card className="mb-8 border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xl font-semibold text-foreground">{firstName}, you’ve unlocked {unlockedChallengeBonuses + Math.min(unlockedPartnerCount, assets.length)} bonuses</p>
            <p className="mt-2 text-sm text-muted-foreground">Keep completing days and inviting builders to open more of the vault.</p>
          </CardContent>
        </Card>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Challenge bonuses</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {challengeBonuses.map((bonus) => {
              const unlocked = completedDay >= bonus.day;
              return (
                <Card key={bonus.id} className={unlocked ? "border-primary/25 bg-card shadow-sm" : "border-border bg-muted/40 opacity-70"}>
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <Gift className={unlocked ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
                      {unlocked ? <CheckCircle className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h3 className="font-semibold text-foreground">{bonus.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{bonus.benefit}</p>
                    <Button className="mt-5 w-full" variant={unlocked ? "default" : "outline"} onClick={() => navigate(`/day/${bonus.day}`)}>
                      {unlocked ? "Access" : `Unlock by completing Day ${bonus.day}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Partner bonuses</h2>
          {assets.length === 0 ? (
            <Card><CardContent className="p-8 text-center"><Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-semibold text-foreground">Partner bonuses are coming soon</p></CardContent></Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset, index) => {
                const unlocked = index < unlockedPartnerCount;
                const requirement = index < 3 ? "Invite 3 builders" : "Complete Day 2";
                return (
                  <Card key={asset.id} className={unlocked ? "overflow-hidden border-border bg-card shadow-sm" : "overflow-hidden border-border bg-muted/40 opacity-75"}>
                    <div className={`relative aspect-video ${partnerImages[index % partnerImages.length]} flex items-center justify-center`}>
                      <Gift className="h-12 w-12 text-primary" />
                      {!unlocked && <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold text-foreground">Unlock this bonus</div>}
                    </div>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">By {asset.partner_name}</p>
                      <h3 className="mt-2 font-semibold text-foreground">{asset.contribution_title}</h3>
                      <p className="mt-3 text-sm font-medium text-foreground">What this helps you achieve</p>
                      <p className="mt-1 text-sm text-muted-foreground">{asset.contribution_description}</p>
                      <Button className="mt-5 w-full gap-2" variant={unlocked ? "default" : "outline"} onClick={() => unlocked ? navigate(`/reward/${asset.id}`) : navigate(index < 3 ? "/referrals" : "/day/2")}>
                        {unlocked ? <ExternalLink className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {unlocked ? "Access bonus" : requirement}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">How to unlock more</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {["Complete challenge days", "Invite builders", "Support builders"].map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground"><Users className="mb-3 h-5 w-5 text-primary" />{item}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Rewards;