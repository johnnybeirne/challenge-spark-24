import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CalendarPlus, Camera, CheckCircle2, Circle, CircleDot, Coins, Lock, LogOut, Sparkles, Upload, Zap } from "lucide-react";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";
import { toast } from "sonner";

import AddToCalendar from "@/components/AddToCalendar";
import Confetti from "@/components/Confetti";
import TrainingVideoCard from "@/components/TrainingVideoCard";
import { useTrainingContent } from "@/hooks/useTrainingContent";
import { trackEvent } from "@/lib/analytics";
import { uploadProfilePhoto } from "@/lib/profilePhoto";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import { useUserStage } from "@/hooks/useUserStage";
import AssessmentResultCard from "@/components/AssessmentResultCard";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsChallengerShell } from "@/hooks/useIsChallengerShell";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { Play } from "lucide-react";

const challengeSteps = [
  { day: 1, title: "Define Your Challenge" },
  { day: 2, title: "Build Your Lead Magnet Quiz" },
  { day: 3, title: "Build Your AI-Powered Challenge" },
];

const Dashboard = () => {
  const { state, setState, authUser, signOut } = useAppState();
  const navigate = useNavigate();
  const stage = useUserStage();
  const trainingContent = useTrainingContent();
  const { permissions, role } = useUserRole();
  const identity = useChallengeIdentity();
  const isChallengerShell = useIsChallengerShell();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bioDraft, setBioDraft] = useState(state.user?.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [signupCreditCount, setSignupCreditCount] = useState(0);
  const currentDay = Math.min(state.challenge.currentDay || 1, 3);
  const isComplete = state.challenge.completed || state.challenge.currentDay > 3;
  const hasProgress =
    isComplete ||
    state.challenge.currentDay > 1 ||
    Object.keys(state.challenge.tasks).length > 0 ||
    Object.keys(state.challenge.aiOutputs).some((key) => state.challenge.aiOutputs[key]) ||
    (state.credits?.awardedActions?.length ?? 0) > 0 ||
    Boolean(state.user?.avatarUrl) ||
    Boolean(state.user?.bio) ||
    state.challenge.calendarAdded;
  const completedDays = isComplete ? 3 : Math.max(0, currentDay - 1);
  const progressValue = isComplete ? 100 : ((completedDays + 0.5) / 3) * 100;
  const isDay1InProgress = !isComplete && currentDay === 1 && hasProgress;
  const ctaLabel = isComplete
    ? "View Your Challenge"
    : isDay1InProgress
    ? "Continue Building Your Challenge"
    : currentDay > 1
    ? `Continue Day ${currentDay}`
    : "Start Day 1";
  const ctaDay = isComplete ? 3 : currentDay;
  const hasSignupCredits = (state.credits?.awardedActions ?? []).includes("challenge_signup");
  const startedAt = state.challenge.startedAt ? new Date(state.challenge.startedAt) : null;
  const getDayDate = (day: number) => {
    if (!startedAt) return null;
    const d = new Date(startedAt);
    d.setDate(d.getDate() + (day - 1));
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  useEffect(() => { trackEvent("dashboard_training_viewed"); }, []);

  useEffect(() => {
    if (!hasSignupCredits) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSignupCreditCount(100);
      return;
    }

    let frame = 0;
    const duration = 1400;
    const start = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSignupCreditCount(Math.round(eased * 100));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hasSignupCredits]);

  const handlePhotoUpload = async (file?: File) => {
    if (!file || !authUser || photoUploading) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Please choose an image under 5MB.");

    setPhotoUploading(true);
    const { path, signedUrl, error: uploadError } = await uploadProfilePhoto(authUser.id, file);

    if (uploadError || !signedUrl) {
      setPhotoUploading(false);
      return toast.error(uploadError?.message || "Photo upload failed");
    }

    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: path } as any).eq("user_id", authUser.id);
    setPhotoUploading(false);

    if (profileError) return toast.error(profileError.message || "Could not save your photo");
    const alreadyUploaded = Boolean(state.user?.avatarUrl);
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, avatarUrl: signedUrl } } : prev));
    toast.success(alreadyUploaded ? "Photo added to your challenge profile." : "Photo added. +50 Points earned.");
  };

  const handleBioSave = async () => {
    if (!authUser || bioSaving) return;
    const trimmed = bioDraft.trim();
    if (trimmed.length < 20) return toast.error("Please write at least 20 characters about who you help and how.");
    if (trimmed.length > 500) return toast.error("Please keep your bio under 500 characters.");

    setBioSaving(true);
    const { error } = await supabase.from("profiles").update({ bio: trimmed } as any).eq("user_id", authUser.id);
    setBioSaving(false);
    if (error) return toast.error(error.message || "Could not save your bio");

    const alreadySaved = Boolean(state.user?.bio);
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, bio: trimmed } } : prev));
    toast.success(alreadySaved ? "Bio updated." : "Bio saved. +50 Points earned.");
  };

  const getStepStatus = (day: number) => {
    if (isComplete || currentDay > day) return "Complete";
    if (currentDay === day) return "In progress";
    return "Locked";
  };

  const getStepIcon = (day: number) => {
    const status = getStepStatus(day);
    if (status === "Complete") return <CheckCircle2 className="h-5 w-5 text-primary" />;
    if (status === "In progress") return <CircleDot className="h-5 w-5 text-primary" />;
    return <Circle className="h-5 w-5 text-muted-foreground/50" />;
  };

  // ──────────────────────────────────────────────────────────────────────
  // CHALLENGER SHELL focused dashboard
  // One clear next action. Left sidebar already owns Day 1/2/3 progression.
  // Active for real challengers AND admins previewing the experience.
  // ──────────────────────────────────────────────────────────────────────
  if (isChallengerShell) {
    const dayMeta: Record<number, { title: string; outcome: string }> = {
      1: {
        title: "Define Your Challenge",
        outcome:
          "Before anything else, clarify the problem, audience, and method behind your challenge.",
      },
      2: {
        title: "Build Your Lead Magnet Quiz",
        outcome:
          "Turn your challenge into a quiz that captures qualified leads on autopilot.",
      },
      3: {
        title: "Build Your AI-Powered Challenge",
        outcome:
          "Launch the AI-powered challenge that nurtures your audience automatically.",
      },
    };
    const meta = dayMeta[ctaDay] ?? dayMeta[1];
    const cfg = trainingContent.dashboard;
    const photoDone = !!state.user?.avatarUrl;
    const calendarDone = !!state.challenge.calendarAdded;
    const bioDone = !!state.user?.bio;

    // Dynamic "Today" system — what's now, next, and the next unlock
    const nextDay = !isComplete && ctaDay < 3 ? ctaDay + 1 : null;
    const tomorrowMeta = nextDay ? dayMeta[nextDay] : null;
    const unlockMap: Record<number, string> = {
      1: "AI Prompt Pack",
      2: "Lead Magnet Templates",
      3: "Community Access",
    };
    const nextUnlock = isComplete ? "Community Access" : unlockMap[ctaDay];

    return (
      <main className="app-page-container min-h-screen py-5 pb-28 lg:py-8 lg:pb-8">
        <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">

          {/* INTRO VIDEO — welcome briefing */}
          <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Play className="h-4 w-4" fill="currentColor" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {cfg.videoTitle || "Watch this first"}
                </p>
                <p className="truncate text-sm text-muted-foreground">Quick briefing · ~2 min</p>
              </div>
              {state.training.dashboardVideoWatched && cfg.videoUrl && (
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-sm font-bold text-success">
                  Watched
                </span>
              )}
            </div>
            <div className="aspect-video w-full bg-black">
              {cfg.videoUrl ? (
                <iframe
                  src={cfg.videoUrl}
                  title={cfg.videoTitle || "Watch this first"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => {
                    if (!state.training.dashboardVideoWatched) {
                      setState((prev) => ({
                        ...prev,
                        training: {
                          ...prev.training,
                          dashboardVideoWatched: true,
                          preChallengeWatched: true,
                        },
                      }));
                      trackEvent("dashboard_training_marked_watched");
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/40 to-muted/10 text-center">
                  <button
                    type="button"
                    aria-label="Play training video"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
                  >
                    <Play className="h-6 w-6" fill="currentColor" />
                  </button>
                  <p className="text-sm font-bold text-muted-foreground">Training video goes here</p>
                </div>
              )}
            </div>
          </section>

          {/* TIMELINE — Today / Tomorrow / Day 3, full-width under video */}
          {(() => {
            const fmt = (d: Date) =>
              d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
            const base = startedAt ?? new Date();
            const todayDate = new Date(base);
            todayDate.setDate(todayDate.getDate() + (ctaDay - 1));
            const tomorrowDate = new Date(todayDate);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const day3Date = new Date(base);
            day3Date.setDate(day3Date.getDate() + 2);
            const day3Meta = dayMeta[3];
            return (
              <section className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-md sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-start gap-2.5">
                    <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">Today</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{fmt(todayDate)}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{meta.title}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">Tomorrow</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{fmt(tomorrowDate)}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {tomorrowMeta ? tomorrowMeta.title : isComplete ? "You're all caught up" : "Wrap up & celebrate"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">{day3Date.toLocaleDateString(undefined, { weekday: "long" })}</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{fmt(day3Date)}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{day3Meta.title}</p>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}


          {/* 3. TODAY'S TASK */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
              Today's task
            </p>
            <h2 className="mt-1.5 text-xl font-bold text-foreground">
              Answer 3 questions about your challenge
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                "What problem do you solve?",
                "Who do you solve it for?",
                "How do you solve it?",
              ].map((q, i) => (
                <li key={q} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {i + 1}
                  </span>
                  <span className="text-base font-semibold text-foreground">{q}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-5 h-12 w-full gap-2 text-base font-black uppercase tracking-wider sm:w-auto"
              onClick={() => {
                trackEvent("dashboard_training_viewed");
                navigate(`/challenge/day-${ctaDay}`);
              }}
            >
              <Sparkles className="h-4 w-4" />
              {ctaLabel}
            </Button>
          </section>


          {/* 4. MOMENTUM ACTIONS */}
          <section>
            <p className="mb-3 px-1 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
              Momentum
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handlePhotoUpload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => !photoDone && photoInputRef.current?.click()}
                disabled={photoDone || photoUploading}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  photoDone
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Add Profile Photo</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {photoDone ? "Done" : photoUploading ? "Uploading…" : "+50 points"}
                  </p>
                </div>
              </button>

              <div
                className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                  calendarDone
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarPlus className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">Add Challenge To Calendar</p>
                  {calendarDone ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">Done</p>
                  ) : (
                    <AddToCalendar
                      variant="secondary"
                      className="mt-1.5 !h-9 !px-3 text-sm font-bold"
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/mentor")}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  bioDone
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Create Bio With AI</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {bioDone ? "Done" : "+50 points"}
                  </p>
                </div>
              </button>
            </div>
          </section>
        </section>

        {/* Mobile sticky CTA — sits above BottomNav for one-tap day access */}
        <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
          <Button
            size="lg"
            className="h-12 w-full gap-2 text-base font-black uppercase tracking-wider"
            onClick={() => navigate(`/challenge/day-${ctaDay}`)}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page-container min-h-screen py-5 pb-24 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 pb-2 lg:flex-row lg:items-center lg:justify-end">
        {(authUser || sessionStorage.getItem(DEMO_USER_KEY) === "1") && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-2 border-border shadow-sm hover:bg-muted"
            onClick={async () => {
              sessionStorage.removeItem(DEMO_USER_KEY);
              await signOut();
              window.location.href = "/";
            }}
          >
            <LogOut className="h-4 w-4" />
            {authUser ? "Log out" : "Exit user view"}
          </Button>
        )}
      </header>

      <section className="mx-auto max-w-5xl space-y-6">
        {(() => {
          const firstName = state.user?.name?.split(" ")[0] || "";
          const t = state.training;
          const cfg = trainingContent.dashboard;
          const watchedCount = [t.dashboardVideoWatched, t.day1Watched, t.day2Watched, t.day3Watched].filter(Boolean).length;
          const markDashboardWatched = () => {
            if (state.training.dashboardVideoWatched) return;
            setState((prev) => ({ ...prev, training: { ...prev.training, dashboardVideoWatched: true, preChallengeWatched: true } }));
            trackEvent("dashboard_training_marked_watched");
          };
          if (!cfg.enabled) return null;
          const personalize = (s: string) => firstName ? s.replace(/\.$/, `, ${firstName}.`) : s;
          return (
            <>
              <TrainingVideoCard
                eyebrow={cfg.title}
                videoTitle={cfg.videoTitle}
                subtitle={personalize(cfg.subtitle)}
                placeholderLabel={cfg.placeholderText}
                lesson={cfg.supportingText}
                videoUrl={cfg.videoUrl}
                watched={t.dashboardVideoWatched}
                watchedLabel="Intro training complete"
                primaryCta={{ label: firstName ? `${cfg.primaryCtaText}, ${firstName}` : cfg.primaryCtaText, onClick: () => { markDashboardWatched(); navigate("/challenge/day-1"); } }}
                
              />
              
            </>
          );
        })()}
        <AssessmentResultCard />
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
              <span className={`text-sm font-medium ${completedDays > 0 || hasProgress ? "text-primary" : "text-muted-foreground"}`}>{completedDays} of 3 complete</span>
            </div>
            <div className="mb-3 flex justify-between px-0.5 text-sm font-semibold text-muted-foreground">
              {challengeSteps.map((step) => {
                const status = getStepStatus(step.day);
                const dim = status === "Locked";
                return (
                  <div
                    key={step.day}
                    className={`flex flex-col ${step.day === 1 ? "items-start" : step.day === 2 ? "items-center" : "items-end"}`}
                  >
                    <span className={`text-sm font-black uppercase tracking-[0.12em] ${dim ? "text-muted-foreground/70" : "text-primary"}`}>Day {step.day}</span>
                    {getDayDate(step.day) && (
                      <span className={`mt-0.5 text-sm ${dim ? "text-muted-foreground/70" : "text-foreground"}`}>{getDayDate(step.day)}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={Math.max(progressValue, hasProgress ? 8 : 0)} className="mb-5 h-2" />
            <div className="grid gap-3 sm:grid-cols-3">
              {challengeSteps.map((step) => {
                const status = getStepStatus(step.day);
                const isActive = status === "In progress";
                const isComplete = status === "Complete";
                const isLocked = status === "Locked";
                return (
                  <div
                    key={step.day}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10"
                        : isComplete
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getStepIcon(step.day)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-black uppercase tracking-[0.12em] ${isLocked ? "text-muted-foreground" : "text-primary"}`}>Day {step.day}</p>
                      <p className={`mt-0.5 text-base font-semibold leading-tight ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>{step.title}</p>
                      <p className={`mt-1 text-sm font-medium ${isActive || isComplete ? "text-primary" : "text-muted-foreground"}`}>{status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <section className="rounded-2xl border-2 border-primary bg-primary/10 p-5 text-center shadow-md sm:p-6">
          <Button size="lg" className="h-14 w-full max-w-md gap-2 text-base font-black uppercase tracking-wide sm:text-lg" onClick={() => navigate(`/challenge/day-${ctaDay}`)}>
            {ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] text-primary">10–15 min · earn points · unlock rewards</p>
        </section>

        {permissions.showChallengeGamification && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-primary">Points Earned</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-5xl font-black leading-none text-foreground sm:text-6xl">{state.credits?.total ?? 0}</span>
                <span className="mb-1.5 text-sm font-semibold text-muted-foreground">points</span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:text-right">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Zap className="h-5 w-5" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground sm:text-base">
                  Earn more points to unlock rewards and bonus training
                </p>
              </div>
            </div>
          </div>
        </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {authUser && (() => {
            const photoDone = !!state.user?.avatarUrl;
            return (
            <section className={`relative rounded-2xl border p-5 shadow-sm sm:p-6 ${photoDone ? "border-border bg-muted/40 opacity-60" : "border-border bg-card"}`}>
              <span className={`pointer-events-none absolute right-3 top-3 inline-flex select-none items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${photoDone ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                {photoDone ? <><Lock className="h-3 w-3" /> Done</> : <>+50 <Zap className="h-3 w-3" fill="currentColor" /></>}
              </span>
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <img
                      src={state.user?.avatarUrl || avatarPlaceholder}
                      alt="Profile photo"
                      width={512}
                      height={512}
                      loading="lazy"
                      className={`h-16 w-16 rounded-full border-2 object-cover ${photoDone ? "border-muted grayscale" : "border-dashed border-primary/40"}`}
                    />
                    <span className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md ${photoDone ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                      {photoDone ? <Lock className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <div className="min-w-0 pr-14">
                    <p className={`text-sm font-black uppercase tracking-[0.12em] ${photoDone ? "text-muted-foreground" : "text-primary"}`}>Step 1</p>
                    <h2 className={`mt-0.5 text-lg font-bold ${photoDone ? "text-muted-foreground" : "text-foreground"}`}>Add your challenge photo</h2>
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void handlePhotoUpload(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <Button type="button" variant="secondary" className="mt-auto h-12 w-full gap-2 sm:w-auto sm:self-start" disabled={photoUploading || photoDone} onClick={() => photoInputRef.current?.click()}>
                  {photoDone ? <><Lock className="h-4 w-4" /> Locked</> : <><Upload className="h-4 w-4" /> {photoUploading ? "Uploading…" : "Upload photo"}</>}
                </Button>
              </div>
            </section>
            );
          })()}

          {!state.challenge.calendarAdded && (
          <section className="relative rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <span className="pointer-events-none absolute right-3 top-3 inline-flex select-none items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              +50 <Zap className="h-3 w-3" fill="currentColor" />
            </span>
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <div className="flex h-16 w-16 flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-background shadow-sm">
                    <div className="flex h-5 items-center justify-center bg-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                      {(startedAt ?? new Date()).toLocaleDateString(undefined, { month: "short" })}
                    </div>
                    <div className="flex flex-1 items-center justify-center text-2xl font-black leading-none text-foreground">
                      {(startedAt ?? new Date()).getDate()}
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <CalendarPlus className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 pr-14">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-primary">Step 2</p>
                  <h2 className="mt-0.5 text-lg font-bold text-foreground">Add the challenge to your calendar</h2>
                </div>
              </div>
              <AddToCalendar variant="secondary" className="mt-auto h-12 w-full sm:w-auto sm:self-start" />
            </div>
          </section>
          )}

          <section className="relative rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <span className="pointer-events-none absolute right-3 top-3 inline-flex select-none items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              +50 <Zap className="h-3 w-3" fill="currentColor" />
            </span>
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/40 bg-background shadow-sm">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 pr-14">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-primary">Step 3</p>
                  <h2 className="mt-0.5 text-lg font-bold text-foreground">Create Bio</h2>
                </div>
              </div>
              <DictatedTextarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value.slice(0, 500))}
                placeholder="e.g. I help solo coaches turn cold leads into paying clients with AI-powered quizzes."
                className="min-h-[88px] resize-none text-sm"
                maxLength={500}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{bioDraft.trim().length}/500 · min 20</span>
                <Button type="button" variant="secondary" className="h-10 gap-2" disabled={bioSaving} onClick={handleBioSave}>
                  {bioSaving ? "Saving…" : state.user?.bio ? "Update bio" : "Save bio"}
                </Button>
              </div>
            </div>
          </section>
        </div>


      </section>
    </main>
  );
};

export default Dashboard;

