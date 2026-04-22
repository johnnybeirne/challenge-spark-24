import { useEffect, useRef, useState } from "react";
import { Sparkles, Wand2, Users, Network, Infinity as InfinityIcon, Lock, Unlock, ArrowRight, Check } from "lucide-react";

/* ─────────────────────────────────────────────
   Hook: track which step is "active" based on
   the scroll position relative to the section.
   ───────────────────────────────────────────── */
const useActiveStep = (count: number) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Total scrollable distance inside the pinned section
      const total = el.offsetHeight - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      setProgress(p);
      const idx = Math.min(count - 1, Math.floor(p * count));
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  return { containerRef, active, progress };
};

/* ─────────────────────────────────────────────
   Step 1 — Idea morphs into a challenge card
   ───────────────────────────────────────────── */
const Step1Visual = ({ active }: { active: boolean }) => {
  const [typed, setTyped] = useState(0);
  const phrase = "Help coaches get their first 100 leads";

  useEffect(() => {
    if (!active) {
      setTyped(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= phrase.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active]);

  const done = typed >= phrase.length;

  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      {/* Input morphing into card */}
      <div
        className={`relative w-full max-w-md transition-all duration-700 ease-out ${
          done ? "scale-100" : "scale-95"
        }`}
      >
        {/* Input box */}
        <div
          className={`rounded-2xl border-2 bg-card shadow-lg transition-all duration-700 ease-out ${
            done
              ? "border-primary/40 -translate-y-2 opacity-30 blur-[1px]"
              : "border-border"
          }`}
        >
          <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your idea
          </div>
          <div className="px-4 py-5 min-h-[64px] text-base text-foreground font-medium">
            {phrase.slice(0, typed)}
            <span className="inline-block w-0.5 h-5 align-middle bg-primary ml-0.5 animate-pulse" />
          </div>
        </div>

        {/* Challenge card emerging */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card to-primary/[0.04] shadow-2xl transition-all duration-700 ease-out ${
            done
              ? "opacity-100 translate-y-2 scale-100"
              : "opacity-0 translate-y-6 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Challenge created</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              3 days
            </span>
          </div>
          <div className="px-4 py-4 space-y-2">
            <div className="text-sm font-semibold text-foreground leading-snug">
              The 100 Leads Sprint
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Coaches", "Lead-gen", "AI-powered"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 2 — AI generates day blocks
   ───────────────────────────────────────────── */
const Step2Visual = ({ active }: { active: boolean }) => {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (!active) {
      setFilled(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setFilled(i);
      if (i >= 3) clearInterval(id);
    }, 600);
    return () => clearInterval(id);
  }, [active]);

  const days = [
    { title: "Lock in audience", lines: 3 },
    { title: "Build the offer", lines: 4 },
    { title: "Launch + share", lines: 3 },
  ];

  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-md space-y-3">
        {/* AI badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
            <Wand2 className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-foreground">AI is writing your challenge</span>
          <span className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>

        {days.map((d, i) => {
          const isFilled = i < filled;
          return (
            <div
              key={d.title}
              className={`rounded-xl border bg-card transition-all duration-500 ease-out ${
                isFilled
                  ? "border-primary/30 opacity-100 translate-y-0 shadow-md"
                  : "border-dashed border-border opacity-40 translate-y-2"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                  DAY {i + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{d.title}</span>
                {isFilled && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </div>
              <div className="px-4 pb-3 space-y-1.5">
                {Array.from({ length: d.lines }).map((_, j) => (
                  <div
                    key={j}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isFilled ? "bg-muted" : "bg-muted/40"
                    }`}
                    style={{
                      width: `${70 + ((j * 13) % 25)}%`,
                      transitionDelay: `${i * 80 + j * 60}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 3 — People join
   ───────────────────────────────────────────── */
const Step3Visual = ({ active }: { active: boolean }) => {
  const [count, setCount] = useState(0);
  const joiners = [
    { initial: "M", color: "bg-primary" },
    { initial: "S", color: "bg-accent" },
    { initial: "A", color: "bg-success" },
    { initial: "J", color: "bg-primary" },
    { initial: "R", color: "bg-accent" },
  ];

  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= joiners.length) clearInterval(id);
    }, 320);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-md h-[280px]">
        {/* Center challenge node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground whitespace-nowrap">
            Your challenge
          </div>
        </div>

        {/* Connection rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`h-44 w-44 rounded-full border border-dashed border-primary/20 transition-opacity duration-700 ${
              count > 0 ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Joiners around the orbit */}
        {joiners.map((j, i) => {
          const angle = (i / joiners.length) * Math.PI * 2 - Math.PI / 2;
          const r = 100;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const visible = i < count;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${j.color} text-primary-foreground text-xs font-bold shadow-lg ring-4 ring-background transition-all duration-500 ease-out ${
                  visible ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}
                style={{ transitionDelay: visible ? `${i * 60}ms` : "0ms" }}
              >
                {j.initial}
              </div>
              {/* Connection line */}
              <svg
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width={Math.abs(x) * 2 || 2}
                height={Math.abs(y) * 2 || 2}
                style={{ overflow: "visible" }}
              >
                <line
                  x1={0}
                  y1={0}
                  x2={-x}
                  y2={-y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  className={`transition-opacity duration-500 ${
                    visible ? "opacity-40" : "opacity-0"
                  }`}
                />
              </svg>
            </div>
          );
        })}

        {/* Count badge */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">
          <Users className="h-3.5 w-3.5" />
          {count} joined
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 4 — Invites + unlocks (the key moment)
   ───────────────────────────────────────────── */
const Step4Visual = ({ active }: { active: boolean }) => {
  const [phase, setPhase] = useState(0); // 0 idle, 1 split, 2 unlock

  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  // L1 around root, L2 around each L1
  const l1 = [-1, 0, 1];
  const l2Per = [-1, 1];

  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-lg h-[320px]">
        {/* Root user */}
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-bold shadow-xl ring-4 ring-background">
            You
          </div>
        </div>

        {/* SVG connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 320" preserveAspectRatio="none">
          {l1.map((slot, i) => {
            const x = 200 + slot * 110;
            const y = 150;
            return (
              <g key={`l1-${i}`}>
                <line
                  x1={200}
                  y1={42}
                  x2={x}
                  y2={y - 18}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={`transition-opacity duration-700 ${phase >= 1 ? "opacity-60" : "opacity-0"}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
                {l2Per.map((slot2, j) => {
                  const x2 = x + slot2 * 36;
                  const y2 = 260;
                  return (
                    <line
                      key={`l2-${i}-${j}`}
                      x1={x}
                      y1={y + 18}
                      x2={x2}
                      y2={y2 - 14}
                      stroke="hsl(var(--accent))"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className={`transition-opacity duration-700 ${phase >= 2 ? "opacity-60" : "opacity-0"}`}
                      style={{ transitionDelay: `${200 + (i * 2 + j) * 80}ms` }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Level 1 nodes */}
        {l1.map((slot, i) => {
          const visible = phase >= 1;
          return (
            <div
              key={`n1-${i}`}
              className="absolute z-10"
              style={{
                left: `calc(50% + ${slot * 27.5}%)`,
                top: "150px",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg ring-4 ring-background transition-all duration-700 ease-out ${
                  visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 -translate-y-4"
                }`}
                style={{ transitionDelay: visible ? `${i * 120}ms` : "0ms" }}
              >
                <Users className="h-4 w-4" />
              </div>
            </div>
          );
        })}

        {/* Level 2 nodes */}
        {l1.map((slot, i) =>
          l2Per.map((slot2, j) => {
            const visible = phase >= 2;
            return (
              <div
                key={`n2-${i}-${j}`}
                className="absolute z-10"
                style={{
                  left: `calc(50% + ${slot * 27.5}% + ${slot2 * 9}%)`,
                  top: "260px",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold shadow-md ring-2 ring-background transition-all duration-700 ease-out ${
                    visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 -translate-y-3"
                  }`}
                  style={{ transitionDelay: visible ? `${200 + (i * 2 + j) * 80}ms` : "0ms" }}
                >
                  <Users className="h-3 w-3" />
                </div>
              </div>
            );
          })
        )}

        {/* Reward chip — locks → unlocks */}
        <div className="absolute right-0 top-0">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-700 ${
              phase >= 2
                ? "bg-success text-success-foreground scale-105"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {phase >= 2 ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {phase >= 2 ? "Reward unlocked" : "Reward locked"}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 5 — Compounding loop
   ───────────────────────────────────────────── */
const Step5Visual = ({ active }: { active: boolean }) => {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      <div className="relative h-[280px] w-[280px]">
        {/* Pulsing rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-full border-2 border-primary/30 ${
              active ? "" : "opacity-0"
            }`}
            style={{
              animation: active ? `loop-ring 3s cubic-bezier(0.4,0,0.2,1) ${i * 1}s infinite` : "none",
            }}
          />
        ))}

        {/* Orbiting dots */}
        <div
          className="absolute inset-0"
          style={{
            animation: active ? "loop-spin 10s linear infinite" : "none",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const r = 110;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-primary shadow-md"
                style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
              />
            );
          })}
        </div>

        {/* Center engine */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl">
            <InfinityIcon className="h-10 w-10" />
          </div>
        </div>

        {/* Stat bubbles */}
        <div className="absolute -top-2 -right-4 rounded-full bg-card border border-border shadow-md px-3 py-1 text-xs font-semibold text-foreground">
          +12 today
        </div>
        <div className="absolute -bottom-2 -left-4 rounded-full bg-card border border-border shadow-md px-3 py-1 text-xs font-semibold text-foreground">
          47 this week
        </div>
      </div>

      <style>{`
        @keyframes loop-ring {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes loop-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   The main scroll-driven section
   ───────────────────────────────────────────── */
const HowItWorksScroll = () => {
  const steps = [
    {
      headline: "Tell us how you help your clients",
      caption: "Your challenge is created for you instantly",
      Visual: Step1Visual,
    },
    {
      headline: "Let AI run it",
      caption: "AI handles the structure, content, and flow",
      Visual: Step2Visual,
    },
    {
      headline: "Invite people you can help",
      caption: "Start with whoever you already know",
      Visual: Step3Visual,
    },
    {
      headline: "They invite others to unlock more",
      caption: "Trusted invites spread from person to person, unlocking more bonuses",
      Visual: Step4Visual,
    },
    {
      headline: "It keeps growing",
      caption: "Your challenge turns into a lead engine that grows itself",
      Visual: Step5Visual,
    },
  ];

  const { containerRef, active } = useActiveStep(steps.length);

  return (
    <section className="relative border-t border-border bg-foreground/[0.015]">
      {/* Section heading */}
      <div className="mx-auto max-w-3xl text-center space-y-4 px-6 pt-20 md:pt-24 pb-10 md:pb-14">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          How it actually works
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Build once. Let it bring you leads and grow through sharing.
        </p>
      </div>

      {/* Scroll driver: tall spacer that controls progress */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${100 + steps.length * 45}vh` }}
      >
        {/* Pinned stage — uses fixed positioning so it works regardless of ancestor overflow */}
        <PinnedStage containerRef={containerRef} steps={steps} active={active} />
      </div>

      {/* Bottom padding so next section breathes */}
      <div className="h-16 md:h-20" />
    </section>
  );
};

/* Pinned stage that becomes fixed while the driver is in view */
const PinnedStage = ({
  containerRef,
  steps,
  active,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  steps: { headline: string; caption: string; Visual: React.ComponentType<{ active: boolean }> }[];
  active: number;
}) => {
  const [pinState, setPinState] = useState<"before" | "fixed" | "after">("before");

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top > 0) setPinState("before");
      else if (rect.bottom < vh) setPinState("after");
      else setPinState("fixed");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef]);

  const positionClass =
    pinState === "fixed"
      ? "fixed top-0 left-0 right-0"
      : pinState === "after"
      ? "absolute bottom-0 left-0 right-0"
      : "absolute top-0 left-0 right-0";

  return (
    <div className={`${positionClass} h-screen flex items-center px-6 pointer-events-none`}>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 w-full max-w-6xl mx-auto items-center pointer-events-auto">
        {/* LEFT: text rail */}
        <div className="relative">
          <ol className="relative space-y-6 md:space-y-8 pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border rounded-full" />
            <div
              className="absolute left-3 top-2 w-0.5 bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ height: `${((active + 1) / steps.length) * 100}%` }}
            />
            {steps.map((s, i) => {
              const isActive = i === active;
              const isPast = i < active;
              return (
                <li key={s.headline} className="relative">
                  <span
                    className={`absolute -left-[22px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      isActive
                        ? "bg-primary border-primary scale-110 shadow-md shadow-primary/40"
                        : isPast
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    {isPast && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <div
                    className={`transition-all duration-500 ease-out ${
                      isActive ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1"
                    }`}
                  >
                    <h3
                      className={`font-bold tracking-tight transition-all duration-500 ${
                        isActive
                          ? "text-2xl md:text-3xl text-foreground"
                          : "text-base md:text-lg text-foreground/70"
                      }`}
                    >
                      {s.headline}
                    </h3>
                    {isActive && (
                      <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                        {s.caption}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* RIGHT: stage */}
        <div className="relative h-[58vh] md:h-[70vh]">
          <div className="absolute inset-0 rounded-3xl border border-border bg-gradient-to-br from-card to-primary/[0.03] shadow-xl overflow-hidden">
            {steps.map((s, i) => {
              const isActive = i === active;
              return (
                <div
                  key={i}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    isActive
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                  }`}
                  aria-hidden={!isActive}
                >
                  <s.Visual active={isActive} />
                </div>
              );
            })}
            {active < steps.length - 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground animate-pulse">
                Scroll <ArrowRight className="h-3.5 w-3.5 rotate-90" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksScroll;
