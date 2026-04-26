import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Gift, Lock, PlayCircle, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";
import { audienceLabel, challengeTypeLabel } from "@/lib/personalisation";
import { trackEvent } from "@/lib/analytics";

const buildCards = [
  "Quiz / assessment entry point",
  "3-day challenge experience",
  "AI-guided action steps",
  "Referral unlock system",
  "Bonus Vault",
  "Builder Circle community",
];
const rewardPreview = [
  ["Bonus Vault", "Tools, templates, and training that open as you build."],
  ["Builder Circle", "A private builder network for momentum and visibility."],
  ["Partner Bonuses", "High-value extras from trusted partners and builders."],
];

const Training = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "there";
  const audience = audienceLabel(state.memory.audienceType || state.assessment?.audienceType);
  const challengeType = challengeTypeLabel(state.memory.challengeType || state.assessment?.challengeType);
  const isB2B = (state.memory.audienceType || state.assessment?.audienceType) === "b2b";
  const isB2C = (state.memory.audienceType || state.assessment?.audienceType) === "b2c";

  useEffect(() => { trackEvent("training_hub_viewed"); }, []);

  const markWatched = () => {
    setState((prev) => ({ ...prev, training: { ...prev.training, preChallengeWatched: true } }));
    trackEvent("training_video_marked_watched", { video: "pre_challenge" });
  };

  const startDay1 = () => {
    setState((prev) => ({ ...prev, training: { ...prev.training, hubCompleted: true } }));
    trackEvent("training_hub_completed");
    navigate("/day/1");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container max-w-5xl py-8 pb-24 lg:py-10">
        <header className="mb-8">
          <p className="mb-3 text-sm font-semibold text-primary">Challenge training</p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Welcome, {firstName}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            You’re about to build a challenge that can grow through trust, referrals, and real value.
          </p>
        </header>

        <Card className="mb-8 overflow-hidden border-primary/20 bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="flex aspect-video min-h-[260px] flex-col items-center justify-center bg-muted/50 p-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                <PlayCircle className="h-4 w-4 text-primary" /> Watch this first
              </div>
              <h2 className="text-2xl font-bold text-foreground">How your challenge works</h2>
              <p className="mt-3 text-sm text-muted-foreground">Training video goes here</p>
              <p className="mt-4 max-w-lg text-sm text-muted-foreground">
                In a few minutes, you’ll understand what you’re building and how it grows.
              </p>
              <Button className="mt-6 gap-2" variant={state.training.preChallengeWatched ? "secondary" : "default"} onClick={markWatched}>
                <CheckCircle className="h-4 w-4" /> {state.training.preChallengeWatched ? "Marked watched" : "Mark as watched"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8 grid gap-6 lg:grid-cols-[0.85fr_0.55fr]">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground">What you’ll build</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {state.memory.topic
                  ? `You’ll turn ${state.memory.topic} into a challenge people can complete and share.`
                  : `You’ll shape a challenge for ${audience}.`}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {buildCards.map((item) => <div key={item} className="rounded-xl border border-border bg-background p-3 text-sm text-foreground"><Sparkles className="mb-2 h-4 w-4 text-primary" />{item}</div>)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground">Why inviting matters</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The fastest builders do not grow alone. They bring the right people in early, create momentum, and unlock more value as they go.
              </p>
              <p className="mt-4 text-sm font-medium text-foreground">Your first invites help you unlock bonuses, access, and visibility.</p>
              {isB2B && <p className="mt-4 text-sm text-muted-foreground">Since you’re building for businesses, focus on authority, trust, access, and visible outcomes.</p>}
              {isB2C && <p className="mt-4 text-sm text-muted-foreground">Since you’re building for consumers, design rewards around motivation, progress, status, and shareable results.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-foreground">Rewards preview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {rewardPreview.map(([title, value]) => (
              <Card key={title} className="border-border bg-muted/40 opacity-85 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between"><Gift className="h-5 w-5 text-muted-foreground" /><Lock className="h-5 w-5 text-muted-foreground" /></div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Ready to begin?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start Day 1 now, or invite builders first to create early momentum.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={() => navigate("/referrals")}><Users className="h-4 w-4" /> Invite builders first</Button>
              <Button className="gap-2" onClick={startDay1}><Trophy className="h-4 w-4" /> Start Day 1</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Training;