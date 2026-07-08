import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles, FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { questions } from "@/lib/assessmentData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ChallengeRecord from "@/components/ChallengeRecord";
import YourChallengeRecap from "@/components/YourChallengeRecap";
import { cn } from "@/lib/utils";
import { useQaPreview } from "@/hooks/useQaPreview";
import { supabase } from "@/integrations/supabase/client";
import { downloadQuizAsDocx } from "@/lib/downloadQuizDocx";
import { openQuizInGoogleDocs } from "@/lib/downloadQuizGdoc";

/** Trim narrative to first N sentences. */
function firstSentences(text: string, n: number) {
  const parts = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return parts.slice(0, n).join(" ").trim();
}

/** Build a one-sentence teaser, capped at ~20 words. */
function teaser(text: string, maxWords = 20) {
  const first = (text.match(/[^.!?]+[.!?]+/) ?? [text])[0].trim();
  const words = first.split(/\s+/);
  if (words.length <= maxWords) return first;
  return words.slice(0, maxWords).join(" ").replace(/[,;:]$/, "") + "...";
}


/* Strong-answer rule mirrors QuizScoreCard: q2, q6, q9 are reverse-scored. */
const REVERSE = new Set(["q2", "q6", "q9"]);

type SignalCopy = {
  strongTitle: string;
  strongCopy: string;
  weakTitle: string;
  weakReality: string;
  weakFix: string;
};

const SIGNALS: Record<string, SignalCopy> = {
  q1: {
    strongTitle: "Reliable Demand Source",
    strongCopy:
      "You have identified a channel that consistently brings prospects to your door. You aren't guessing where your next lead is coming from; you just need to automate and scale the delivery mechanism.",
    weakTitle: "Unpredictable Pipeline",
    weakReality:
      "You are operating in a \u201Cfeast or famine\u201D lead cycle, relying on sporadic referrals or unpredictable networking.",
    weakFix:
      "In Day 1, you will define a high-ticket, high-relevance challenge promise that turns cold traffic into enthusiastic participants.",
  },
  q2: {
    strongTitle: "Content Autonomy",
    strongCopy:
      "Your content operates as a true asset, generating interest even when you step away. Your business isn't held hostage by daily content schedules.",
    weakTitle: "The Content Treadmill",
    weakReality:
      "If you stop posting, writing, or promoting for even a few days, your lead flow immediately dries up.",
    weakFix:
      "Day 3 focuses on creating an evergreen experience that captures, nurtures, and converts leads 24/7/365, giving you your time back.",
  },
  q3: {
    strongTitle: "Attribution Clarity",
    strongCopy:
      "You know exactly which channels, campaigns, or partnerships are driving your revenue. You can safely allocate budget and time because you have data.",
    weakTitle: "Attribution Blind Spot",
    weakReality:
      "You are getting leads, but you have no clear idea which specific efforts are producing them, leading to wasted time on dead-end channels.",
    weakFix:
      "Our backend integration binds tracking tokens on signup, allowing you to instantly see which referral links and partnerships are converting.",
  },
  q4: {
    strongTitle: "Pre-Sold Authority",
    strongCopy:
      "Your audience respects your expertise before they ever jump on a call. This slashes your sales cycle and eliminates the need for aggressive, high-pressure selling.",
    weakTitle: "Skeptical Audience",
    weakReality:
      "You have to spend the first half of every sales conversation proving your basic credibility, fighting against cold-traffic skepticism.",
    weakFix:
      "By structuring your quiz and challenge using our pre-built templates, you educate and build authority before you make an offer.",
  },
  q5: {
    strongTitle: "Self-Propelling Virality",
    strongCopy:
      "Your existing audience does your marketing for you. Every new signup has a high probability of bringing in peers, driving down your customer acquisition cost to near zero.",
    weakTitle: "Isolated Signups",
    weakReality:
      "Your lead generation is entirely linear, each lead must be manually found and acquired by you.",
    weakFix:
      "LeadBead's built-in Referral & Invite System encourages participants to invite 3 peers to unlock bonus templates, turning one lead into four.",
  },
  q6: {
    strongTitle: "Tailored Diagnostics",
    strongCopy:
      "You treat different audience segments with tailored solutions. This personalized approach maximizes opt-in rates and makes prospects feel uniquely understood.",
    weakTitle: "One-Size-Fits-All Magnet",
    weakReality:
      "You serve a single static PDF or ebook to everyone, ignoring the fact that different buyers have completely different pain points.",
    weakFix:
      "In Day 2, you'll construct an interactive quiz that automatically segments leads into custom archetypes and serves dynamic advice.",
  },
  q7: {
    strongTitle: "Seamless Lead Onboarding",
    strongCopy:
      "Your signups have zero friction. They are immediately directed to an actionable next step, keeping their momentum high and driving them deeper into your ecosystem.",
    weakTitle: "Onboarding Leak",
    weakReality:
      "Leads sign up and then sit in limbo, wondering what to do next, which causes their excitement and buying intent to plummet.",
    weakFix:
      "Our Challenger Progress Hub visually updates in real-time, showing new signups exactly what daily tasks they need to perform.",
  },
  q8: {
    strongTitle: "Evergreen Asset Leverage",
    strongCopy:
      "You have built assets that generate compound returns. They act as automated 24/7 business developers, freeing you up to focus on product and high-level strategy.",
    weakTitle: "Temporary Campaigns",
    weakReality:
      "You are constantly building temporary campaigns, webinars, or launches that generate a brief spike of leads and then go completely dead.",
    weakFix:
      "Build your challenge once and flip it into \u201CEvergreen Mode,\u201D where the 72-hour countdown runs automatically for every new visitor.",
  },
  q9: {
    strongTitle: "Passive Generation",
    strongCopy:
      "Your pipeline is completely decoupled from your physical presence. You wake up to new pre-sold leads in your database without having worked overnight.",
    weakTitle: "Manual Pipeline Maintenance",
    weakReality:
      "If you take a vacation, get sick, or focus on fulfillment, your lead generation grinds to a halt.",
    weakFix:
      "The unified 3-day challenge framework automates the entire relationship-building process, turning traffic into warmed-up leads passively.",
  },
};

type ArchetypeKey = "pioneer" | "architect" | "authority";

type Archetype = {
  key: ArchetypeKey;
  name: string;
  zoneLabel: string;
  hook: string;
  narrative: string;
  roadmapHeader: string;
  roadmapIntro: string;
  roadmap: { day: string; title: string; copy: string }[];
  ctaLabel: string;
  tone: {
    chip: string;
    bar: string;
    gaugeRing: string;
    gaugeText: string;
    badgeWeak: string;
  };
};

const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  pioneer: {
    key: "pioneer",
    name: "The Pioneer",
    zoneLabel: "Red Zone \u00b7 0\u201333% Strength",
    hook:
      "You have built a trusted brand, but you are currently trapped in an active-labor loop.",
    narrative:
      "As a Pioneer, your greatest asset is your raw skill and the high trust of your current audience. When you get in front of people, you convert them easily because your pre-sold trust is high. However, you are currently trading your direct, physical energy for every single lead. If you stop writing posts, launching temporary campaigns, or doing manual outreach, your pipeline dries up. You do not have a lead generation problem, you have a system design problem. You are acting as the engine of your marketing when you should be the architect. To step into the next phase of growth, you must package your authority into a self-running asset.",
    roadmapHeader: "Your Step-by-Step Pioneer Breakthrough Plan",
    roadmapIntro:
      "You don't need to spend months coding complex marketing pipelines. Over the next 72 hours, we are going to build your high-converting, evergreen lead system:",
    roadmap: [
      {
        day: "Day 1",
        title: "System Definition",
        copy: "Shift from manual outreach to a highly engaging challenge promise. We'll outline your perfect audience and desired outcome.",
      },
      {
        day: "Day 2",
        title: "Quiz Personalization",
        copy: "Stop using a one-size-fits-all lead magnet. We'll build a dynamic, diagnostic-driven quiz to automatically segment your visitors.",
      },
      {
        day: "Day 3",
        title: "Organic Virality",
        copy: "Implement a milestone-based referral system (e.g. \u201CInvite 3 peers to unlock the community\u201D) so your leads generate more leads for you.",
      },
    ],
    ctaLabel: "Start Day 1 Challenge Definition",
    tone: {
      chip: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      bar: "bg-gradient-to-r from-rose-500 to-orange-500",
      gaugeRing: "ring-rose-500/30 bg-rose-500/10",
      gaugeText: "text-rose-600 dark:text-rose-400",
      badgeWeak: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
  },
  architect: {
    key: "architect",
    name: "The Architect",
    zoneLabel: "Gold Zone \u00b7 44\u201366% Strength",
    hook:
      "You have functional automation, but your systems are fragmented and leaking revenue.",
    narrative:
      "As an Architect, you have successfully moved past the manual grind. You have set up reliable lead generation methods, and you probably have an automated tool or two running in the background. You know where your leads are coming from, but you are missing key optimization levers. Your primary leaks are segmentation and virality. Because you serve a static lead magnet to everyone, you are treating different buyer personas as identical. Furthermore, your leads enter your ecosystem in isolation; they aren't incentivized to bring their peers. You have a great engine, but we need to tune the components and tie them into a unified, viral challenge to maximize your ROI.",
    roadmapHeader: "Your Step-by-Step Architect Optimization Plan",
    roadmapIntro:
      "Let's plug the leaks in your current funnel and transform your static lead capture into a high-octane growth loop:",
    roadmap: [
      {
        day: "Day 1",
        title: "Challenge Positioning",
        copy: "Upgrade your existing lead magnet into an interactive 3-day challenge designed to warm up your most profitable buyers.",
      },
      {
        day: "Day 2",
        title: "Dynamic Segmenting",
        copy: "Build a premium diagnostic quiz to automatically route different leads to different result tiers based on their specific friction points.",
      },
      {
        day: "Day 3",
        title: "Multiplayer Virality",
        copy: "Activate the LeadBead referral engine, transforming isolated signups into a self-propelling community that invites their peers on autopilot.",
      },
    ],
    ctaLabel: "Begin Your System Calibration",
    tone: {
      chip: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      bar: "bg-gradient-to-r from-amber-400 to-yellow-500",
      gaugeRing: "ring-amber-500/30 bg-amber-500/10",
      gaugeText: "text-amber-600 dark:text-amber-400",
      badgeWeak: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
  },
  authority: {
    key: "authority",
    name: "The Authority",
    zoneLabel: "Green Zone \u00b7 77\u2013100% Strength",
    hook:
      "You have built a high-performing lead engine. Now it's time to build a self-scaling ecosystem.",
    narrative:
      "As an Authority, you represent the top tier of lead generation maturity. Your pipeline is largely automated, your leads trust you before they speak to you, and you can track your attribution cleanly. You have built a highly reliable machine. Your next frontier isn't just generating more leads, it's hyper-scale, brand network effects, and premium monetization. To fully capitalize on your market position, you need to transition your challenge from a simple lead capture tool into a highly engaging \u201Cmultiplayer\u201D community and partner-driven ecosystem. We will focus on unlocking the viral loops and affiliate features that turn your brand into an industry institution.",
    roadmapHeader: "Your Step-by-Step Authority Scaling Plan",
    roadmapIntro:
      "Let's scale your high-performing machine into a self-propagating market institution over the next 3 days:",
    roadmap: [
      {
        day: "Day 1",
        title: "High-Ticket Alignment",
        copy: "Align your challenge design with high-ticket backend offers, optimizing your positioning for maximum high-value buyer conversion.",
      },
      {
        day: "Day 2",
        title: "Advanced Diagnostic Routing",
        copy: "Deploy deep, AI-driven diagnostic results and custom archetype pages that match your elite market authority.",
      },
      {
        day: "Day 3",
        title: "Network Effect Launch",
        copy: "Unlock advanced viral features: set up the Builder Circle community and JV Partner portals to have affiliates and clients drive your traffic for you.",
      },
    ],
    ctaLabel: "Unlock Hyper-Scale Engine",
    tone: {
      chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
      gaugeRing: "ring-emerald-500/30 bg-emerald-500/10",
      gaugeText: "text-emerald-600 dark:text-emerald-400",
      badgeWeak: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
  },
};

function pickArchetype(strong: number): Archetype {
  if (strong <= 3) return ARCHETYPES.pioneer;
  if (strong <= 6) return ARCHETYPES.architect;
  return ARCHETYPES.authority;
}

const LeadGenStrengthCard = () => {
  const { state, setState, authUser } = useAppState();
  const qa = useQaPreview();
  const navigate = useNavigate();
  const [showFullNarrative, setShowFullNarrative] = useState(false);
  const [quizTiers, setQuizTiers] = useState<Array<{
    tier: string;
    min_percent: number;
    max_percent: number;
    title: string;
    messages: string[];
  }> | null>(null);
  const [archetypeCfg, setArchetypeCfg] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: tiers }, { data: content }] = await Promise.all([
        supabase.from("diagnostic_responses").select("tier,min_percent,max_percent,title,messages"),
        supabase.from("site_content").select("key,value").eq("page", "results").eq("section", "archetypes"),
      ]);
      if (cancelled) return;
      if (tiers) {
        setQuizTiers(
          tiers.map((r: any) => ({
            tier: r.tier,
            min_percent: r.min_percent,
            max_percent: r.max_percent,
            title: r.title ?? "",
            messages: Array.isArray(r.messages) ? r.messages.filter((m: any) => typeof m === "string") : [],
          })),
        );
      }
      if (content) {
        const map: Record<string, string> = {};
        for (const r of content as any[]) map[r.key] = r.value;
        setArchetypeCfg(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const assessment = state.assessment as
    | { answers?: Record<string, string>; diagnosticScore?: number }
    | undefined;

  // Refetch just the quiz slice from Supabase on mount and whenever the tab
  // regains focus, so a quiz generated in another tab appears here without
  // requiring a manual page refresh. Scoped to day2_s2_quiz — does not
  // invalidate cached AI strength statements.
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const refetchQuiz = async () => {
      try {
        const { data: row } = await (supabase.from("challenge_progress") as any)
          .select("ai_outputs")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (cancelled || !row) return;
        const latestQuiz = row.ai_outputs?.day2_s2_quiz;
        if (!latestQuiz) return;
        setState((prev) => {
          if (prev.challenge.aiOutputs?.day2_s2_quiz === latestQuiz) return prev;
          return {
            ...prev,
            challenge: {
              ...prev.challenge,
              aiOutputs: { ...prev.challenge.aiOutputs, day2_s2_quiz: latestQuiz },
            },
          };
        });
      } catch {
        /* no-op */
      }
    };
    refetchQuiz();
    const onFocus = () => refetchQuiz();
    const onVis = () => { if (document.visibilityState === "visible") refetchQuiz(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [authUser, setState]);


  const qaArchetype = qa.active ? qa.archetypeOverride ?? null : null;

  const data = useMemo(() => {
    const rawAnswers = assessment?.answers;
    // Treat answers as "present" only if at least one yes/no value exists.
    const hasRealAnswers =
      !!rawAnswers &&
      Object.values(rawAnswers).some((v) => v === "yes" || v === "no");
    const realAnswers = hasRealAnswers ? rawAnswers : undefined;
    const total = questions.length;

    // Determine a synthetic strong-count target when real answers are absent.
    // Priority: QA archetype override → persona diagnosticScore → none.
    let synthStrongCount: number | null = null;
    if (!realAnswers) {
      if (qaArchetype) {
        synthStrongCount = qaArchetype === "pioneer" ? 2 : qaArchetype === "architect" ? 5 : 8;
      } else if (typeof assessment?.diagnosticScore === "number") {
        synthStrongCount = Math.max(0, Math.min(total, Math.round(assessment.diagnosticScore)));
      } else {
        // No signal at all → default to a mid-tier preview so the tab is never empty.
        synthStrongCount = 5;
      }
    }

    let answers: Record<string, string> | undefined = realAnswers;
    if (!realAnswers && synthStrongCount !== null) {
      const synth: Record<string, string> = {};
      questions.forEach((q, i) => {
        const makeStrong = i < (synthStrongCount as number);
        const strongVal = REVERSE.has(q.id) ? "no" : "yes";
        const weakVal = REVERSE.has(q.id) ? "yes" : "no";
        synth[q.id] = makeStrong ? strongVal : weakVal;
      });
      answers = synth;
    }

    let strong = 0;
    let hasAnswers = false;
    const active: { id: string; question: string; title: string; copy: string }[] = [];
    const priorities: {
      id: string;
      question: string;
      title: string;
      reality: string;
      fix: string;
    }[] = [];
    const quiz: { id: string; question: string; answer: "yes" | "no"; isStrong: boolean }[] = [];

    if (answers) {
      questions.forEach((q) => {
        const ans = answers![q.id];
        if (ans !== "yes" && ans !== "no") return;
        hasAnswers = true;
        const isStrong = REVERSE.has(q.id) ? ans === "no" : ans === "yes";
        quiz.push({ id: q.id, question: q.text, answer: ans, isStrong });
        const sig = SIGNALS[q.id];
        if (!sig) return;
        if (isStrong) {
          strong += 1;
          active.push({
            id: q.id,
            question: q.text,
            title: sig.strongTitle,
            copy: sig.strongCopy,
          });
        } else {
          priorities.push({
            id: q.id,
            question: q.text,
            title: sig.weakTitle,
            reality: sig.weakReality,
            fix: sig.weakFix,
          });
        }
      });
    }

    if (!hasAnswers && !assessment && !qaArchetype) {
      return null;
    }

    const percent = Math.round((strong / total) * 100);
    const archetype = pickArchetype(strong);
    return { strong, total, percent, archetype, active, priorities, quiz };
  }, [assessment, qaArchetype]);

  if (!data) {
    const rawQuiz = state.challenge.aiOutputs?.day2_s2_quiz;
    if (!parseQuizForDownload(rawQuiz)) return null;
    return (
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden p-5 sm:p-7">
        <QuizDownloadAssets rawQuiz={rawQuiz} />
      </section>
    );
  }

  const archetypeOverride = qaArchetype ? ARCHETYPES[qaArchetype] : null;
  const archetype = archetypeOverride ?? data.archetype;
  const { priorities } = data;
  const percent = qaArchetype
    ? (qaArchetype === "pioneer" ? 22 : qaArchetype === "architect" ? 55 : 88)
    : data.percent;
  const narrativeShort = firstSentences(archetype.narrative, 2);
  const narrativeRest = archetype.narrative.slice(narrativeShort.length).trim();
  const heroTeaser = teaser(archetype.narrative, 20);

  const hasQuizResult = !!assessment && (data.strong > 0 || data.priorities.length > 0 || !!qaArchetype);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* HERO ROW */}
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Score + archetype */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Lead Gen Strength
            </p>
            <div className="mt-1 flex items-baseline gap-3 flex-wrap">
              <span className={cn("text-5xl sm:text-6xl font-black leading-none", archetype.tone.gaugeText)}>
                {percent}%
              </span>
              <span className={cn("text-base font-bold", archetype.tone.gaugeText)}>
                {archetype.name}
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full max-w-md rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", archetype.tone.bar)}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground italic leading-snug">
              {heroTeaser}
            </p>
          </div>

        </div>
      </div>

      {/* TABS */}
      <div className="border-t border-border bg-background px-5 sm:px-7 pt-4">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList
            className="h-auto w-full justify-start items-end gap-0 rounded-none border-0 border-b bg-transparent p-0 overflow-x-auto flex-nowrap whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ borderBottomColor: "hsl(var(--border))", borderBottomWidth: "1.5px" }}
          >
            {[
              { value: "profile", label: "Your Profile" },
              { value: "assets", label: "Your Assets" },
              
              { value: "quiz", label: "Quiz Results" },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                ref={(el) => {
                  if (el && el.getAttribute("data-state") === "active") {
                    el.scrollIntoView({ block: "nearest", inline: "center" });
                  }
                }}
                className="group relative shrink-0 rounded-none border-0 bg-transparent px-5 pt-1 pb-3 text-[15px] font-normal text-muted-foreground shadow-none hover:text-foreground data-[state=active]:text-[#534AB7] data-[state=active]:font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-150 ease-out after:pointer-events-none after:absolute after:left-0 after:right-0 after:-bottom-[1.5px] after:h-[2.5px] after:bg-[#534AB7] after:opacity-0 data-[state=active]:after:opacity-100 after:transition-opacity after:duration-150"
              >
                <span className="relative inline-flex flex-col items-center">
                  <span>{t.label}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground group-hover:border-t-[#534AB7] group-data-[state=active]:border-t-transparent transition-colors duration-150"
                  />

                </span>
              </TabsTrigger>
            ))}
          </TabsList>





          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="pt-6 pb-6 animate-fade-in focus-visible:outline-none">
            <div className="space-y-6">
              {/* Strategic profile */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Strategic Profile
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {narrativeShort}
                  {showFullNarrative && narrativeRest && (
                    <span className="block mt-2">{narrativeRest}</span>
                  )}
                </p>
                {narrativeRest && (
                  <button
                    type="button"
                    onClick={() => setShowFullNarrative((v) => !v)}
                    className="mt-2 text-xs font-bold text-primary hover:underline"
                  >
                    {showFullNarrative ? "Show less" : "Read more"}
                  </button>
                )}
              </div>

              {/* Optimization Priorities accordion */}
              {priorities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Your Top Priorities
                      <span className="ml-2 text-muted-foreground font-bold normal-case tracking-normal">
                        ({priorities.length})
                      </span>
                    </h3>
                  </div>
                  <p className="mb-3 text-xs font-semibold text-rose-600">
                    👇 Tap each item to read the fix
                  </p>
                  <Accordion type="single" collapsible className="space-y-2">
                    {priorities.map((p) => (
                      <AccordionItem
                        key={p.id}
                        value={p.id}
                        className="rounded-lg border-2 border-rose-200 bg-rose-50/60 px-4 shadow-sm hover:border-rose-400 hover:bg-rose-50 transition-colors data-[state=open]:border-rose-500 data-[state=open]:bg-rose-500/10 data-[state=open]:shadow-md"
                      >
                        <AccordionTrigger className="py-3 text-left text-sm font-bold text-foreground hover:no-underline [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-rose-600 [&>svg]:shrink-0">
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">!</span>
                            {p.title}
                          </span>
                        </AccordionTrigger>

                        <AccordionContent className="pb-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Current Reality
                              </p>
                              <p className="mt-1 text-xs leading-snug text-foreground">
                                {p.reality}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-primary">
                                The LeadBead Fix
                              </p>
                              <p className="mt-1 text-xs leading-snug text-foreground">
                                {p.fix}
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Your Challenge recap (kept here so Day 1 answers stay visible) */}
              <YourChallengeRecap />
            </div>
          </TabsContent>

          {/* TAB 2: ASSETS */}
          <TabsContent value="assets" className="pt-6 pb-6 animate-fade-in focus-visible:outline-none">
            <QuizDownloadAssets rawQuiz={state.challenge.aiOutputs?.day2_s2_quiz} />
          </TabsContent>



          {/* TAB 3: ROADMAP */}

          {/* TAB 4: QUIZ RESULTS */}
          <TabsContent value="quiz" className="pt-6 pb-6 animate-fade-in focus-visible:outline-none">
            {(() => {
              const roundedPct = Math.max(0, Math.min(100, Math.round(percent)));
              const matched =
                quizTiers?.find((t) => roundedPct >= t.min_percent && roundedPct <= t.max_percent) ??
                (quizTiers && quizTiers.length
                  ? [...quizTiers].sort((a, b) => {
                      const da = roundedPct < a.min_percent ? a.min_percent - roundedPct : roundedPct - a.max_percent;
                      const db = roundedPct < b.min_percent ? b.min_percent - roundedPct : roundedPct - b.max_percent;
                      return da - db;
                    })[0]
                  : null);
              const archName = matched ? archetypeCfg[`${matched.tier}_name`] : "";
              const archTagline = matched ? archetypeCfg[`${matched.tier}_tagline`] : "";
              const intro = archetypeCfg.intro || "Based on your answers...";
              const lines = matched
                ? [matched.title, ...matched.messages].map((s) => (s ?? "").trim()).filter(Boolean)
                : [];

              return (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {intro}
                    </p>
                    <p className="mt-2 text-5xl sm:text-6xl font-black leading-none text-primary">
                      {roundedPct}%
                    </p>
                    {archName && (
                      <p className="mt-2 text-sm font-bold text-foreground">{archName}</p>
                    )}
                    {archTagline && (
                      <p className="mt-1 text-sm text-muted-foreground">{archTagline}</p>
                    )}
                  </div>

                  {lines.length > 0 && (
                    <ul className="mt-6 space-y-2">
                      {lines.map((line, i) => (
                        <li
                          key={`${i}-${line}`}
                          className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm leading-snug text-foreground">{line}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </TabsContent>

        </Tabs>
      </div>
    </section>
  );
};

function parseQuizForDownload(raw: string | undefined | null): boolean {
  if (!raw) return false;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return !!(parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0);
  } catch {
    return false;
  }
}

export function QuizDownloadAssets({ rawQuiz }: { rawQuiz: string | undefined | null }) {
  const isValid = useMemo(() => parseQuizForDownload(rawQuiz), [rawQuiz]);
  if (!isValid) return null;

  const handleWord = async () => {
    try {
      await downloadQuizAsDocx(rawQuiz);
    } catch {
      toast.error("Generate your quiz first, then download it.");
    }
  };

  const handleGdoc = async () => {
    try {
      await openQuizInGoogleDocs(rawQuiz);
      toast.success("Quiz copied. Paste (Ctrl/Cmd+V) into the new Google Doc.");
    } catch {
      toast.error("Generate your quiz first, then download it.");
    }
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Your Quiz
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleWord}
          className="text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-2">
            <FileDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[14px] font-bold text-foreground">Your Quiz as a Word doc</p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Download your generated quiz as a Word document.
          </p>
        </button>
        <button
          type="button"
          onClick={handleGdoc}
          className="text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[14px] font-bold text-foreground">Your Quiz as a Google Doc</p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Copy your quiz straight into a new Google Doc.
          </p>
        </button>
      </div>
    </div>
  );
}

export default LeadGenStrengthCard;

