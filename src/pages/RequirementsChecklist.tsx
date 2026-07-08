import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, FileText, FileCode2, AlertCircle, ChevronDown, Sparkles, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Phase = "Pre-Challenge" | "Challenge" | "Post-Challenge" | "Admin / Advanced";

type Feature = {
  name: string;
  description: string;
  category: "essential" | "advanced";
  phase: Phase;
  requiresVariant?: "leadMagnetQuiz" | "internalDiagnostic";
};

const FEATURES: Feature[] = [
  // Pre-Challenge
  { name: "Signup & Authentication Flow", description: "Email + Google OAuth signup, session persistence, password reset, role-aware redirects.", category: "essential", phase: "Pre-Challenge" },
  { name: "Personalised Onboarding Memory", description: "Captures audience, promise and topic during signup; reused across the journey.", category: "essential", phase: "Pre-Challenge" },
  { name: "9-Question Lead Gen Diagnostic Quiz", description: "Public lead-magnet quiz with scoring doughnut, archetype result and email capture.", category: "essential", phase: "Pre-Challenge", requiresVariant: "leadMagnetQuiz" },
  { name: "AI-Powered Quiz Result Insights", description: "Lovable AI generates a tailored insight + next-step nudge from quiz answers.", category: "essential", phase: "Pre-Challenge", requiresVariant: "leadMagnetQuiz" },

  // Challenge
  { name: "Day 1 Challenge Definition Setup", description: "Guided steps to define audience, promise, topic and challenge title with AI polish.", category: "essential", phase: "Challenge" },
  { name: "Internal Challenge Diagnostic", description: "Inline diagnostic prompts during Day 1 that score readiness and tailor the challenge.", category: "essential", phase: "Challenge", requiresVariant: "internalDiagnostic" },
  { name: "AI Coach Chat Copilot", description: "Conversational assistant grounded in user memory; helps complete each day's work.", category: "essential", phase: "Challenge" },
  { name: "Voice Dictation Input", description: "Browser speech-to-text on any long-form input so users can talk through answers.", category: "essential", phase: "Challenge" },
  { name: "Day 2 Quiz Builder", description: "Generate and edit a playable quiz from the user's challenge topic; shareable preview.", category: "essential", phase: "Challenge" },
  { name: "Day 3 Challenge Experience Design", description: "Design the live challenge experience, hooks and call-to-action for launch day.", category: "essential", phase: "Challenge" },
  { name: "72-Hour Challenge Countdown", description: "Persistent countdown timer that drives urgency across the 3-day flow.", category: "essential", phase: "Challenge" },
  { name: "Challenger Dashboard & Progress Hub", description: "Single home with score doughnut, day cards, unlocks and primary CTA by role.", category: "essential", phase: "Challenge" },
  { name: "Add to Calendar Integration", description: "One-click .ics download to block out the 3-day challenge window.", category: "essential", phase: "Challenge" },
  { name: "Training Video Hub", description: "Curated short videos per day, gated by progress, with completion tracking.", category: "essential", phase: "Challenge" },
  { name: "Challenge Completion & Launch", description: "Marks the challenge live, captures launch URL and triggers community unlock.", category: "essential", phase: "Challenge" },

  // Post-Challenge
  { name: "Referral & Invite System", description: "Unique invite links, share copy, attribution capture and direct-referral counter.", category: "essential", phase: "Post-Challenge" },
  { name: "Points & Unlocks Progression", description: "Earn points for milestones; unlock rewards, community and bonus vault.", category: "essential", phase: "Post-Challenge" },
  { name: "Builder Circle Community", description: "Gated peer community unlocked at challenge launch + 3 direct referrals.", category: "essential", phase: "Post-Challenge" },
  { name: "Leaderboard & Social Proof", description: "Visibility-tiered leaderboard with activity feed and milestone celebrations.", category: "essential", phase: "Post-Challenge" },

  // Admin / Advanced
  { name: "Owner Console Admin Panel", description: "Centralized admin shell with sidebar, role guard and live preview for all CMS tools.", category: "advanced", phase: "Admin / Advanced" },
  { name: "CMS Editor (Quiz LP, Powered-By, Day 1/2 copy)", description: "Edit landing, button labels and day step copy live with preview pane.", category: "advanced", phase: "Admin / Advanced" },
  { name: "User Admin & Roles", description: "Six-role system via has_role() RPC, with View-as-User and test accounts.", category: "advanced", phase: "Admin / Advanced" },
  { name: "JV Partner System", description: "Partner application, approval, dashboard, sales tracking and payouts.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Attribution Tracking", description: "First-touch + last-touch capture across signup, quiz and partner links.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Cross-Promo Slots", description: "Configurable promo cards and spotlight slots across post-action moments.", category: "advanced", phase: "Admin / Advanced" },
  { name: "QA Tools (Personas + Simulated Date)", description: "Switch personas and time-travel the challenge window for end-to-end QA.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Analytics Dashboard", description: "35-event analytics surface with funnel, retention and cohort views.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Stripe Embedded Checkout", description: "Embedded Stripe checkout + webhook for premium and partner products.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Premium Course / Blueprint", description: "Paid post-challenge course with lessons, insights and dashboard.", category: "advanced", phase: "Admin / Advanced" },
  { name: "Founding Partner Program", description: "Special tier with private dashboard, perks and partner ops.", category: "advanced", phase: "Admin / Advanced" },
];

const PHASE_ORDER: Phase[] = ["Pre-Challenge", "Challenge", "Post-Challenge", "Admin / Advanced"];

function downloadFile(filename: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const RequirementsChecklist = () => {
  const [variantLeadMagnetQuiz, setVariantLeadMagnetQuiz] = useState(true);
  const [variantInternalDiagnostic, setVariantInternalDiagnostic] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-uncheck variant-gated features when their toggle is off
  const visibleFeatures = useMemo(
    () =>
      FEATURES.filter((f) => {
        if (f.requiresVariant === "leadMagnetQuiz" && !variantLeadMagnetQuiz) return false;
        if (f.requiresVariant === "internalDiagnostic" && !variantInternalDiagnostic) return false;
        return true;
      }),
    [variantLeadMagnetQuiz, variantInternalDiagnostic],
  );

  const grouped = useMemo(() => {
    const out: Record<Phase, Feature[]> = {
      "Pre-Challenge": [],
      "Challenge": [],
      "Post-Challenge": [],
      "Admin / Advanced": [],
    };
    for (const f of visibleFeatures) out[f.phase].push(f);
    return out;
  }, [visibleFeatures]);

  const checkedCount = useMemo(
    () => visibleFeatures.filter((f) => checked[f.name]).length,
    [visibleFeatures, checked],
  );
  const canGenerate = checkedCount >= 3;

  const toggle = (name: string) =>
    setChecked((s) => ({ ...s, [name]: !s[name] }));

  const selectAllPhase = (phase: Phase, value: boolean) => {
    setChecked((s) => {
      const next = { ...s };
      for (const f of grouped[phase]) next[f.name] = value;
      return next;
    });
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedFeatures = visibleFeatures
        .filter((f) => checked[f.name])
        .map((f) => f.name);

      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-requirements-spec",
        {
          body: {
            selectedFeatures,
            variantLeadMagnetQuiz,
            variantInternalDiagnostic,
          },
        },
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (!data?.docxBase64 || !data?.markdown) throw new Error("Empty response");

      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadFile(
        `LeadTree-Proposal-${stamp}.docx`,
        base64ToBlob(
          data.docxBase64,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      );
      downloadFile(
        `LeadTree-Requirements-${stamp}.md`,
        new Blob([data.markdown], { type: "text/markdown;charset=utf-8" }),
      );
    } catch (e) {
      setError((e as Error).message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const renderFeature = (f: Feature) => (
    <label
      key={f.name}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
        "hover:border-primary/40 hover:bg-muted/30",
        checked[f.name] && "border-primary/60 bg-primary/5",
        f.category === "essential" && "border-l-[3px] border-l-emerald-500/70",
      )}
    >
      <Checkbox
        checked={!!checked[f.name]}
        onCheckedChange={() => toggle(f.name)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{f.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4",
              f.category === "essential"
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
            )}
          >
            {f.category === "essential" ? "Essential" : "Advanced"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-snug">{f.description}</p>
      </div>
    </label>
  );

  const phaseSection = (phase: Phase, collapsible = false) => {
    const items = grouped[phase];
    if (!items.length) return null;
    const allChecked = items.every((f) => checked[f.name]);

    const inner = (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {phase}{" "}
            <span className="text-muted-foreground/60 normal-case font-normal">
              ({items.filter((f) => checked[f.name]).length}/{items.length})
            </span>
          </h3>
          <button
            type="button"
            onClick={() => selectAllPhase(phase, !allChecked)}
            className="text-xs text-primary hover:underline"
          >
            {allChecked ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="space-y-2">{items.map(renderFeature)}</div>
      </div>
    );

    if (!collapsible) {
      return (
        <section key={phase} className="rounded-xl border bg-card/50 p-4 space-y-3">
          {inner}
        </section>
      );
    }

    return (
      <Collapsible key={phase} defaultOpen={false}>
        <section className="rounded-xl border bg-card/50 p-4">
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 group">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {phase}{" "}
              <span className="text-muted-foreground/60 normal-case font-normal">
                ({items.filter((f) => checked[f.name]).length}/{items.length})
              </span>
            </h3>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => selectAllPhase(phase, !allChecked)}
                className="text-xs text-primary hover:underline"
              >
                {allChecked ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="space-y-2">{items.map(renderFeature)}</div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <ClipboardCheck className="h-3.5 w-3.5" /> Admin · Requirements Checklist
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Build a Custom LeadTree
          </h1>
          <p className="text-muted-foreground">
            Select features, choose variants, generate a proposal and technical spec.
          </p>
        </header>

        {/* Variants */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Include Lead Magnet Quiz?</p>
                <p className="text-xs text-muted-foreground">
                  Public 9-question diagnostic quiz that captures leads before signup.
                </p>
              </div>
              <Switch
                checked={variantLeadMagnetQuiz}
                onCheckedChange={setVariantLeadMagnetQuiz}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Include Internal Challenge Diagnostic?</p>
                <p className="text-xs text-muted-foreground">
                  In-app diagnostic during Day 1 that scores readiness and tailors the build.
                </p>
              </div>
              <Switch
                checked={variantInternalDiagnostic}
                onCheckedChange={setVariantInternalDiagnostic}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-4 mb-6">
          {phaseSection("Pre-Challenge")}
          {phaseSection("Challenge")}
          {phaseSection("Post-Challenge")}
          {phaseSection("Admin / Advanced", true)}
        </div>

        {/* Generate */}
        <Card className="border-2">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <p className="text-sm text-muted-foreground">
              {checkedCount} feature{checkedCount === 1 ? "" : "s"} selected
              {!canGenerate && " · pick at least 3 to generate"}
            </p>
            <Button
              size="lg"
              onClick={generate}
              disabled={!canGenerate || loading}
              className="h-12 px-8 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating your proposal and requirements spec…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Requirements Spec
                </>
              )}
            </Button>

            {!loading && canGenerate && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Proposal.docx
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5" /> Requirements.md
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3 max-w-md mt-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-left">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequirementsChecklist;
