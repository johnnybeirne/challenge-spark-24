import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CalendarPlus, Camera, CheckCircle2, Circle, CircleDot, Coins, Sparkles, Upload } from "lucide-react";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";
import { toast } from "sonner";
import CreditStatusCard from "@/components/CreditStatusCard";
import AddToCalendar from "@/components/AddToCalendar";
import Confetti from "@/components/Confetti";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";

const challengeSteps = [
  { day: 1, title: "Define Your Challenge" },
  { day: 2, title: "Build Your Lead Magnet Quiz" },
  { day: 3, title: "Build Your AI-Powered Challenge" },
];

const Dashboard = () => {
  const { state, setState, authUser, signOut } = useAppState();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [signupCreditCount, setSignupCreditCount] = useState(0);
  const currentDay = Math.min(state.challenge.currentDay || 1, 3);
  const isComplete = state.challenge.completed || state.challenge.currentDay > 3;
  const hasProgress =
    isComplete ||
    state.challenge.currentDay > 1 ||
    Object.keys(state.challenge.tasks).length > 0 ||
    Object.keys(state.challenge.aiOutputs).some((key) => state.challenge.aiOutputs[key]);
  const completedDays = isComplete ? 3 : Math.max(0, currentDay - 1);
  const progressValue = (completedDays / 3) * 100;
  const ctaLabel = isComplete ? "Review Your Challenge" : hasProgress ? `Continue Day ${currentDay}` : "Start Day 1";
  const ctaDay = isComplete ? 3 : currentDay;
  const hasSignupCredits = (state.credits?.awardedActions ?? []).includes("challenge_signup");

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
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${authUser.id}/profile-photo.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      setPhotoUploading(false);
      return toast.error(uploadError.message || "Photo upload failed");
    }

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("user_id", authUser.id);
    setPhotoUploading(false);

    if (profileError) return toast.error(profileError.message || "Could not save your photo");
    const alreadyUploaded = Boolean(state.user?.avatarUrl);
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, avatarUrl } } : prev));
    toast.success(alreadyUploaded ? "Photo added to your challenge profile." : "Photo added. +50 Unlock Credits earned.");
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

  return (
    <main className="app-page-container min-h-screen py-5 pb-24 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Challenge Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">Your next step is clear</h1>
        </div>
        {(authUser || sessionStorage.getItem(DEMO_USER_KEY) === "1") && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground"
            onClick={async () => {
              sessionStorage.removeItem(DEMO_USER_KEY);
              await signOut();
              window.location.href = "/";
            }}
          >
            {authUser ? "Sign out" : "Exit user view"}
          </Button>
        )}
      </header>

      <section className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {authUser && !state.user?.avatarUrl && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <img
                      src={avatarPlaceholder}
                      alt="Profile photo placeholder"
                      width={512}
                      height={512}
                      loading="lazy"
                      className="h-16 w-16 rounded-full border-2 border-dashed border-primary/40 object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-primary">Step 1</p>
                    <h2 className="mt-0.5 text-lg font-bold text-foreground">Add your challenge photo</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      People who join the challenge are encouraged to upload a photo so the builder community feels more personal.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-black text-primary">
                      <Coins className="h-4 w-4" /> Earn +50 Unlock Credits
                    </div>
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePhotoUpload(event.target.files?.[0])}
                />
                <Button type="button" variant="secondary" className="mt-auto h-12 w-full gap-2 sm:w-auto sm:self-start" disabled={photoUploading} onClick={() => photoInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {photoUploading ? "Uploading…" : "Upload photo"}
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <div className="flex h-16 w-16 flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-background shadow-sm">
                    <div className="flex h-5 items-center justify-center bg-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                      May
                    </div>
                    <div className="flex flex-1 items-center justify-center text-2xl font-black leading-none text-foreground">
                      5
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <CalendarPlus className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-primary">Step 2</p>
                  <h2 className="mt-0.5 text-lg font-bold text-foreground">Add the challenge to your calendar</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Keep momentum across all 3 days and earn credits when it’s added.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-black text-primary">
                    <Coins className="h-4 w-4" /> Earn +50 Unlock Credits
                  </div>
                </div>
              </div>
              <AddToCalendar variant="secondary" className="mt-auto h-12 w-full sm:w-auto sm:self-start" />
            </div>
          </section>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
              <span className={`text-sm font-medium ${completedDays > 0 || hasProgress ? "text-primary" : "text-muted-foreground"}`}>{completedDays} of 3 complete</span>
            </div>
            <Progress value={progressValue} className="mb-5 h-2" />
            <div className="space-y-3">
              {challengeSteps.map((step) => {
                const status = getStepStatus(step.day);
                const isActive = status === "In progress";
                const isComplete = status === "Complete";
                const isLocked = status === "Locked";
                return (
                  <div
                    key={step.day}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10"
                        : isComplete
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    {getStepIcon(step.day)}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>Day {step.day} — {step.title}</p>
                      <p className={`mt-1 text-sm ${isActive || isComplete ? "text-primary font-medium" : "text-muted-foreground"}`}>{status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <CreditStatusCard credits={state.credits?.total ?? 0} compact />

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center shadow-sm sm:p-8">
          <Button size="lg" className="h-14 w-full max-w-md gap-2 text-base font-bold sm:text-lg" onClick={() => navigate(`/day/${ctaDay}`)}>
            {ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Takes 10–15 minutes</p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-foreground">What You’re Building</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>A simple challenge for your audience</li>
                <li>A quiz that brings people in</li>
                <li>A system that encourages sharing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-foreground">By the End of This</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>You’ll have a working version of your challenge</li>
                <li>You’ll understand how it grows</li>
                <li>You’ll be able to share it</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
