import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Gift, Lock, Sparkles, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppState } from "@/context/AppContext";
import Confetti from "@/components/Confetti";
import { toast } from "@/hooks/use-toast";

/**
 * Redeem Credits page.
 *
 * Edit the rewards array below to change what shows up here.
 * NOTE: Unlocking does NOT spend credits — it's a milestone unlock.
 */
const rewards = [
  {
    id: "launch_checklist",
    title: "Challenge Launch Checklist",
    threshold: 50,
    description: "A printable checklist to make sure your launch goes live cleanly.",
  },
  {
    id: "ai_prompt_pack",
    title: "AI Prompt Pack",
    threshold: 100,
    description: "Battle-tested prompts for shaping your challenge with AI.",
  },
  {
    id: "referral_templates",
    title: "Referral Message Templates",
    threshold: 150,
    description: "Plug-and-play scripts for inviting people who actually join.",
  },
];

const STORAGE_KEY = "leadio.unlockedRewards.v1";

const loadUnlocked = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const RedeemCredits = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const credits = state.credits?.total ?? 0;

  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"confirm" | "success">("confirm");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  }, [unlocked]);

  const active = useMemo(() => rewards.find((r) => r.id === activeId) ?? null, [activeId]);
  const nextThreshold = useMemo(
    () => rewards.find((r) => r.threshold > credits)?.threshold ?? null,
    [credits]
  );

  const openReward = (id: string) => {
    setActiveId(id);
    setPhase("confirm");
  };

  const confirmUnlock = () => {
    if (!active) return;
    if (!unlocked.includes(active.id)) {
      setUnlocked((prev) => [...prev, active.id]);
      toast({
        title: "New reward added to your Bonus Vault",
        description: active.title,
      });
    }
    setPhase("success");
  };

  const closeModal = () => {
    setActiveId(null);
    setPhase("confirm");
  };

  const isUnlocked = (id: string) => unlocked.includes(id);
  const alreadyUnlocked = active ? isUnlocked(active.id) : false;

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
            <h1 className="text-2xl font-bold text-foreground">Unlock Rewards</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hit milestones to unlock rewards. Your credits stay yours.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Credits</p>
            <p className="text-2xl font-black text-foreground">{credits}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {rewards.map((r) => {
            const reached = credits >= r.threshold;
            const done = isUnlocked(r.id);
            const remaining = Math.max(0, r.threshold - credits);
            return (
              <Card
                key={r.id}
                className={
                  done
                    ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20 transition-all"
                    : "border-border bg-card shadow-sm transition-all"
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={
                        done
                          ? "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"
                          : "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
                      }
                    >
                      <Gift className="h-5 w-5" />
                    </div>
                    {done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                        <Check className="h-3 w-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                        Unlock at {r.threshold}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-base font-bold text-foreground">{r.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>

                  {done ? (
                    <Button
                      className="mt-4 w-full gap-2"
                      variant="outline"
                      onClick={() => openReward(r.id)}
                    >
                      <Check className="h-4 w-4" /> View Reward
                    </Button>
                  ) : reached ? (
                    <Button
                      className="mt-4 w-full gap-2"
                      onClick={() => openReward(r.id)}
                    >
                      <Sparkles className="h-4 w-4" /> Unlock Access
                    </Button>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <Progress
                        value={Math.min(100, Math.round((credits / r.threshold) * 100))}
                        className="h-1.5"
                      />
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={() => navigate("/referrals")}
                      >
                        <Lock className="h-4 w-4" />
                        {remaining} more to unlock
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {active && phase === "confirm" && (
            <div className="p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Gift className="h-7 w-7" />
              </div>
              <h2 className="text-center text-xl font-bold text-foreground">
                {alreadyUnlocked ? "Already unlocked ✓" : "Unlock this reward?"}
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {alreadyUnlocked
                  ? `You already have access to ${active.title}.`
                  : "You've reached this milestone — this reward is now available to you."}
              </p>

              <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-center">
                <p className="text-sm font-semibold text-foreground">{active.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your credits: <span className="font-bold text-foreground">{credits}</span> · won't change
                </p>
              </div>

              {!alreadyUnlocked && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your credits will <span className="font-semibold">not</span> be used. You keep your progress.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                <Button className="flex-1 gap-2" onClick={alreadyUnlocked ? closeModal : confirmUnlock}>
                  {alreadyUnlocked ? "View Reward" : "Unlock Access"}
                </Button>
                <Button variant="ghost" className="flex-1" onClick={closeModal}>
                  Not now
                </Button>
              </div>
            </div>
          )}

          {active && phase === "success" && (
            <div className="relative p-6">
              <Confetti duration={2000} />
              <div className="mx-auto mb-4 flex h-16 w-16 animate-scale-in items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_0_8px_hsl(var(--primary)/0.08)]">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-center text-2xl font-bold text-foreground">Unlocked 🎉</h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                You now have access to {active.title}.
              </p>

              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-foreground">
                  Your credits remain: <span className="font-bold">{credits}</span>{" "}
                  <span className="text-muted-foreground">(unchanged)</span>
                </p>
                {nextThreshold && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Keep going — your next reward unlocks at {nextThreshold} credits
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                <Button className="flex-1 gap-2" onClick={closeModal}>
                  View Reward <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex-1" onClick={closeModal}>
                  Keep Earning Credits
                </Button>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fastest way to unlock more
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">
                    Invite 1 person who joins{" "}
                    <span className="font-semibold text-primary">+50 credits</span>
                  </p>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      closeModal();
                      navigate("/referrals");
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invite Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedeemCredits;
