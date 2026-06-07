import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import {
  ClipboardList,
  Sparkles,
  Target,
  Rocket,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { AuroraBackdrop } from "@/components/premium/cinematic";
import { cn } from "@/lib/utils";

type StageType = "input" | "processing" | "approval" | "completion" | "branch";

type Stage = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  type: StageType;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: { label: string; value: string }[];
  actions: string[];
  metric: { label: string; value: string };
  branches?: { label: string; to: string }[];
};

const STAGES: Stage[] = [
  {
    id: "discover",
    index: 1,
    title: "Take the 3-minute lead-gen quiz",
    subtitle: "9 quick questions about your current lead generation situation.",
    type: "input",
    badge: "Step 1",
    icon: ClipboardList,
    fields: [
      { label: "What it covers", value: "Your current lead-gen setup" },
      { label: "Time it takes", value: "About 3 minutes, 9 questions" },
    ],
    actions: ["No signup required to start", "Works on phone or laptop"],
    metric: { label: "Time", value: "3 min" },
  },
  {
    id: "diagnose",
    index: 2,
    title: "Get your personalised plan",
    subtitle: "An AI coach reads your answers and recommends the right path.",
    type: "processing",
    badge: "Step 2",
    icon: Sparkles,
    fields: [
      { label: "What you get", value: "Score, diagnosis, next step" },
      { label: "Tailored to you", value: "Beginner, builder, or scaling" },
    ],
    actions: ["Instant AI coach reply", "Clear recommendation"],
    metric: { label: "Result", value: "Custom plan" },
  },
  {
    id: "challenge",
    index: 3,
    title: "Build over 3 days",
    subtitle: "A guided sprint to ship a real lead-generating asset.",
    type: "processing",
    badge: "Step 3",
    icon: Target,
    fields: [
      { label: "Day 1", value: "Niche, audience and promise" },
      { label: "Day 2", value: "Build a quiz-style lead magnet" },
      { label: "Day 3", value: "Launch it live" },
    ],
    actions: ["AI copilot on every step", "Roughly an hour a day"],
    metric: { label: "Outcome", value: "Live asset" },
  },
  {
    id: "launch",
    index: 4,
    title: "Launch and share",
    subtitle: "Submit your live link and start collecting leads.",
    type: "approval",
    badge: "Step 4",
    icon: Rocket,
    fields: [
      { label: "What ships", value: "A working lead magnet" },
      { label: "Where it lives", value: "Your own link, your brand" },
    ],
    actions: ["Mark the challenge complete", "Share with your audience"],
    metric: { label: "Status", value: "Shipped" },
  },
  {
    id: "grow",
    index: 5,
    title: "Grow inside the Builder Circle",
    subtitle: "Unlock the community, mentorship and rewards as you refer others.",
    type: "completion",
    badge: "Step 5",
    icon: Users,
    fields: [
      { label: "Unlock", value: "Community + leaderboard" },
      { label: "Keep going", value: "Mentor, prompt library, premium" },
    ],
    actions: ["Refer 3 builders to join the Circle", "Earn rewards as you grow"],
    metric: { label: "Next", value: "Scale up" },
  },
];

const TYPE_STYLES: Record<StageType, { ring: string; dot: string; chip: string; glow: string }> = {
  input:       { ring: "ring-sky-400/40",     dot: "bg-sky-400",     chip: "bg-sky-500/10 text-sky-300 border-sky-400/30",       glow: "shadow-[0_0_60px_-15px_hsl(199_89%_60%/0.6)]" },
  processing:  { ring: "ring-violet-400/40",  dot: "bg-violet-400",  chip: "bg-violet-500/10 text-violet-300 border-violet-400/30", glow: "shadow-[0_0_60px_-15px_hsl(262_83%_65%/0.6)]" },
  approval:    { ring: "ring-amber-400/40",   dot: "bg-amber-400",   chip: "bg-amber-500/10 text-amber-300 border-amber-400/30",  glow: "shadow-[0_0_60px_-15px_hsl(38_92%_60%/0.6)]" },
  completion:  { ring: "ring-emerald-400/40", dot: "bg-emerald-400", chip: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30", glow: "shadow-[0_0_60px_-15px_hsl(160_84%_55%/0.6)]" },
  branch:      { ring: "ring-fuchsia-400/40", dot: "bg-fuchsia-400", chip: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/30", glow: "shadow-[0_0_60px_-15px_hsl(292_84%_65%/0.6)]" },
};

const StageCard = ({ stage, active, completed }: { stage: Stage; active: boolean; completed: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const Icon = stage.icon;
  const style = TYPE_STYLES[stage.type];

  return (
    <motion.div
      ref={ref}
      id={`stage-${stage.id}`}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative scroll-mt-28"
    >
      {/* connector line down */}
      {stage.index < STAGES.length && (
        <div aria-hidden className="pointer-events-none absolute left-6 top-full hidden h-12 w-px bg-gradient-to-b from-border to-transparent md:block" />
      )}
      <Card
        className={cn(
          "relative overflow-hidden border bg-card/60 backdrop-blur-xl transition-all duration-500",
          active && `ring-2 ${style.ring} ${style.glow}`,
          completed && "opacity-95",
        )}
      >
        {active && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Icon column */}
            <div className="flex shrink-0 items-start gap-4">
              <motion.div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-xl border bg-background",
                  active && style.ring,
                )}
                animate={active ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon className="h-6 w-6 text-foreground" />
                {active && (
                  <motion.span
                    aria-hidden
                    className={cn("absolute inset-0 rounded-xl", style.ring, "ring-2")}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <div className="text-xs text-muted-foreground md:hidden">
                <div className="font-mono">Stage {stage.index}/{STAGES.length}</div>
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="hidden font-mono text-xs text-muted-foreground md:inline">
                  Stage {String(stage.index).padStart(2, "0")}
                </span>
                <Badge variant="outline" className={cn("border", style.chip)}>
                  <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", style.dot)} />
                  {stage.badge}
                </Badge>
                {completed && (
                  <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                  </Badge>
                )}
                {active && (
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    <Activity className="mr-1 h-3 w-3 animate-pulse" /> Live
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{stage.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{stage.subtitle}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fields</p>
                  <dl className="space-y-2 text-sm">
                    {stage.fields.map((f) => (
                      <div key={f.label} className="flex flex-col gap-0.5">
                        <dt className="text-xs text-muted-foreground">{f.label}</dt>
                        <dd className="font-medium text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actions</p>
                  <ul className="space-y-2 text-sm">
                    {stage.actions.map((a) => (
                      <li key={a} className="flex items-start gap-2">
                        <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
                        <span className="text-foreground">{a}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{stage.metric.label}</span>
                    <span className="font-mono text-sm font-semibold text-foreground">{stage.metric.value}</span>
                  </div>
                </div>
              </div>

              {stage.branches && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {stage.branches.map((b) => (
                    <span key={b.label} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", style.chip)}>
                      <ArrowRight className="h-3 w-3" /> {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FlowchartNode = ({ stage, index, total }: { stage: Stage; index: number; total: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const style = TYPE_STYLES[stage.type];
  const Icon = stage.icon;
  const isLast = index === total - 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center"
    >
      <div className={cn("group relative w-full rounded-xl border bg-card/70 p-4 backdrop-blur-xl transition-all", style.ring, "hover:ring-2")}>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background", style.ring)}>
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{stage.title}</p>
            <p className="truncate text-xs text-muted-foreground">{stage.badge}</p>
          </div>
        </div>
        <motion.span
          aria-hidden
          className={cn("absolute -inset-px rounded-xl", style.ring, "ring-1")}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
        />
      </div>
      {!isLast && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.05 + 0.2 }}
          className="my-2 flex h-8 origin-top flex-col items-center"
        >
          <div className={cn("h-full w-px bg-gradient-to-b", "from-border via-primary/40 to-border")} />
          <ArrowRight className="h-3 w-3 rotate-90 text-primary" />
        </motion.div>
      )}
    </motion.div>
  );
};

const Workflow = () => {
  const [activeId, setActiveId] = useState<string>(STAGES[0].id);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("stage-", "");
          setActiveId(id);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0.1, 0.4, 0.7] },
    );
    STAGES.forEach((s) => {
      const el = document.getElementById(`stage-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const activeIndex = useMemo(() => STAGES.findIndex((s) => s.id === activeId), [activeId]);

  return (
    <>
      <SEO
        title="Product Workflow — Leadio User Journey"
        description="A live, scroll-driven walkthrough of the end-to-end Leadio user journey: assessment → 3-day challenge → launch → referrals → Builder Circle."
        canonical="/workflow"
      />

      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400"
        style={{ scaleX: progress }}
      />

      <div className="relative min-h-screen bg-background text-foreground">
        <AuroraBackdrop />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 text-center"
          >
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              <Activity className="mr-1.5 h-3 w-3 animate-pulse" /> Live product workflow
            </Badge>
            <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              How it works.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Five simple steps — from a 3-minute diagnostic to a launched lead magnet and a community of builders behind you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
              {(["input", "processing", "approval", "branch", "completion"] as StageType[]).map((t) => (
                <span key={t} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1", TYPE_STYLES[t].chip)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", TYPE_STYLES[t].dot)} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              ))}
            </div>
          </motion.header>

          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Sticky progress nav */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Progress · {activeIndex + 1}/{STAGES.length}
                </p>
                <ol className="space-y-1">
                  {STAGES.map((s, i) => {
                    const isActive = s.id === activeId;
                    const isDone = i < activeIndex;
                    const style = TYPE_STYLES[s.type];
                    return (
                      <li key={s.id}>
                        <a
                          href={`#stage-${s.id}`}
                          className={cn(
                            "group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-all",
                            isActive ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="relative flex h-5 w-5 items-center justify-center">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : isActive ? (
                              <>
                                <span className={cn("absolute h-4 w-4 rounded-full", style.dot, "opacity-30 animate-ping")} />
                                <span className={cn("relative h-2 w-2 rounded-full", style.dot)} />
                              </>
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </span>
                          <span className="truncate">{s.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </aside>

            {/* Stage cards */}
            <div className="space-y-6">
              {STAGES.map((s, i) => (
                <StageCard key={s.id} stage={s} active={s.id === activeId} completed={i < activeIndex} />
              ))}
            </div>
          </div>

          {/* Flowchart */}
          <section className="mt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.7 }}
              className="mb-10 text-center"
            >
              <Badge variant="outline" className="mb-3">Flowchart</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The full path, mapped.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Connected nodes with directional flow. Decision branches at diagnosis, growth loop at Earn & Refer.
              </p>
            </motion.div>

            <div className="rounded-2xl border bg-card/40 p-6 backdrop-blur-xl sm:p-10">
              <div className="mx-auto grid max-w-xl gap-0">
                {STAGES.map((s, i) => (
                  <FlowchartNode key={s.id} stage={s} index={i} total={STAGES.length} />
                ))}
              </div>
            </div>
          </section>

          {/* Footer summary */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-cyan-400/10 p-8 text-center"
          >
            <h3 className="text-xl font-semibold">From cold visitor to launched builder in 3 days.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Personalised diagnosis · AI-assisted build · enforced shipping · referral-powered community.
            </p>
          </motion.section>

          {/* Admin operations workflow */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-2xl border bg-card/60 p-8 backdrop-blur-xl"
          >
            <div className="mb-6 text-center">
              <Badge variant="outline" className="mb-3">Admin operations</Badge>
              <h3 className="text-2xl font-bold tracking-tight">Behind the scenes — what the owner does.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                The recurring admin workflow that keeps the live experience tuned.
              </p>
            </div>
            <ol className="mx-auto grid max-w-3xl gap-3 text-sm">
              {[
                "Review JV partner applications coming in from /jv-apply and decide who to onboard.",
                "Manage JV partner step tooltip content shown on the /jv-partners landing page.",
                "Edit Day 1 and Day 2 step content and the generate-button labels used inside each day.",
                "Edit quiz archetype names (Pioneer, Architect, Authority) and their result messages.",
                "Manage the rewards ladder prices and the JV partner bonus rewards.",
              ].map((line, i) => (
                <li key={line} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{line}</span>
                </li>
              ))}
            </ol>
          </motion.section>

        </div>
      </div>
    </>
  );
};

export default Workflow;
