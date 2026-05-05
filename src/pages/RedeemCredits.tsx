import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";

/**
 * Redeem Credits page.
 *
 * Edit the rewards array below to change what shows up here.
 * Linked from the "Redeem Credits" button under Unlock Credits in the sidebar
 * and from the Unlocks page.
 */
const rewards = [
  {
    title: "Challenge Launch Checklist",
    cost: 50,
    description: "A printable checklist to make sure your launch goes live cleanly.",
  },
  {
    title: "AI Prompt Pack",
    cost: 100,
    description: "Battle-tested prompts for shaping your challenge with AI.",
  },
  {
    title: "Referral Message Templates",
    cost: 150,
    description: "Plug-and-play scripts for inviting people who actually join.",
  },
];

const RedeemCredits = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const credits = state.credits?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Redeem Credits</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Spend your credits on bonus unlocks and rewards.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Balance</p>
            <p className="text-2xl font-black text-foreground">{credits}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {rewards.map((r) => {
            const canRedeem = credits >= r.cost;
            return (
              <Card key={r.title} className="border-border bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Gift className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                      {r.cost} credits
                    </span>
                  </div>
                  <h2 className="mt-4 text-base font-bold text-foreground">{r.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>
                  <Button
                    className="mt-4 w-full gap-2"
                    variant={canRedeem ? "default" : "outline"}
                    disabled={!canRedeem}
                  >
                    <Sparkles className="h-4 w-4" />
                    {canRedeem ? "Redeem" : `Need ${r.cost - credits} more`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RedeemCredits;
