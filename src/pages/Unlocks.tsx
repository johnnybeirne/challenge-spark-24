import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Gift, Flame, Rocket, Crown } from "lucide-react";

interface UnlockItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlockedAt: number; // day needed to unlock (0 = paid)
  isPaid?: boolean;
  price?: string;
  paidLabel?: string;
}

const unlocks: UnlockItem[] = [
  {
    key: "day1",
    icon: <Gift className="h-6 w-6" />,
    title: "Day 1 Reward",
    description: "Foundation blueprint — your app structure mapped and ready.",
    unlockedAt: 1,
  },
  {
    key: "day2",
    icon: <Flame className="h-6 w-6" />,
    title: "Day 2 Reward",
    description: "Core feature built — your app is functional and connected.",
    unlockedAt: 2,
  },
  {
    key: "day3",
    icon: <Rocket className="h-6 w-6" />,
    title: "Day 3 Reward",
    description: "Launch badge — you shipped a live app in 3 days.",
    unlockedAt: 3,
  },
  {
    key: "builder_circle",
    icon: <Crown className="h-6 w-6" />,
    title: "Builder Circle Access",
    description: "Launch + promote. Join a network where builders promote each other.",
    unlockedAt: 0,
    isPaid: true,
    price: "$197",
    paidLabel: "Launch + promote",
  },
];

const Unlocks = () => {
  const { state } = useAppState();
  const currentDay = state.challenge.currentDay;
  const completed = state.challenge.completed;

  const isUnlocked = (item: UnlockItem) => {
    if (item.isPaid) return state.communityUnlocked;
    if (item.unlockedAt <= currentDay - 1) return true;
    if (item.unlockedAt === 3 && completed) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Unlocks</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Complete challenge days to earn rewards.
        </p>

        <div className="space-y-3">
          {unlocks.map((item) => {
            const unlocked = isUnlocked(item);
            return (
              <Card
                key={item.key}
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
                      <p className="font-semibold text-foreground text-sm">
                        {item.title}
                      </p>
                      {item.isPaid && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {item.price}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {unlocked ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : item.isPaid ? (
                      <Button size="sm" className="text-xs">
                        Unlock
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Day {item.unlockedAt}
                      </span>
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
