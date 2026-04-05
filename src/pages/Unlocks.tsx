import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Gift, Flame, Rocket, Crown, Users, Zap, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import CrossPromoSlots from "@/components/CrossPromoSlots";

interface UnlockItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  value: number;
}

const allUnlocks: UnlockItem[] = [
  { id: "day1_blueprint", icon: <Gift className="h-6 w-6" />, title: "App blueprint", description: "Your app structure mapped and ready.", value: 97 },
  { id: "day2_playbook", icon: <Flame className="h-6 w-6" />, title: "Challenge playbook", description: "Core feature built — your app is functional.", value: 147 },
  { id: "day3_checklist", icon: <Rocket className="h-6 w-6" />, title: "Launch checklist", description: "You shipped a live app in 3 days.", value: 97 },
  { id: "referral_3_trust", icon: <Users className="h-6 w-6" />, title: "Trust growth playbook", description: "Invited 3 builders to the ecosystem.", value: 147 },
  { id: "referral_5_prompts", icon: <Zap className="h-6 w-6" />, title: "AI prompt pack", description: "Invited 5 builders — advanced prompts unlocked.", value: 97 },
  { id: "referral_10_system", icon: <Package className="h-6 w-6" />, title: "Full system", description: "Invited 10 builders — complete system access.", value: 297 },
  { id: "builder_circle", icon: <Crown className="h-6 w-6" />, title: "Builder Circle access", description: "Launched and promoted — join the builder network.", value: 197 },
];

const Unlocks = () => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const earnedIds = new Set(state.unlocks.map((u) => u.id));

  const totalEarned = state.unlocks.reduce((sum, u) => sum + u.value, 0);
  const totalPossible = allUnlocks.reduce((sum, u) => sum + u.value, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Unlocks</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Complete challenges and grow your network to earn rewards.
        </p>

        {/* Total value */}
        <Card className="border-border mb-6 bg-primary/5">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">${totalEarned}</p>
            <p className="text-xs text-muted-foreground">of ${totalPossible} total value earned</p>
          </CardContent>
        </Card>

        {state.unlocks.length === 0 && (
          <EmptyState
            icon={Gift}
            title="No unlocks yet"
            description="Complete challenge days and invite builders to start earning rewards worth up to $297."
            actionLabel="Start Day 1"
            actionPath="/day/1"
          />
        )}

        {/* Cross-promotion between sections */}
        <div className="mb-4">
          <CrossPromoSlots slots={2} title="Featured builders" />
        </div>

        <div className="space-y-3">
            icon={Gift}
            title="No unlocks yet"
            description="Complete challenge days and invite builders to start earning rewards worth up to $297."
            actionLabel="Start Day 1"
            actionPath="/day/1"
          />
        )}

        <div className="space-y-3">
          {allUnlocks.map((item) => {
            const unlocked = earnedIds.has(item.id);
            return (
              <Card
                key={item.id}
                className={`border-border transition-all ${
                  unlocked ? "bg-card" : "bg-muted/40 opacity-70"
                }`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`shrink-0 rounded-full p-2.5 ${
                      unlocked
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {unlocked ? item.icon : <Lock className="h-6 w-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        ${item.value}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>

                  <div className="shrink-0">
                    {unlocked ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (item.id.startsWith("day")) navigate("/day/1");
                          else if (item.id.startsWith("referral")) navigate("/referrals");
                          else navigate("/community");
                        }}
                      >
                        Earn
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Unlocks;
