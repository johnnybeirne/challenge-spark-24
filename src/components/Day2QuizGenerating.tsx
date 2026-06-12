import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MESSAGE_MS = 1800;
const FADE_MS = 350;
const REVEAL_FADE_MS = 450;

const readDay1 = (aiOutputs: Record<string, string> | undefined) => {
  let setup: Record<string, unknown> = {};
  try {
    const raw = aiOutputs?.day1Setup;
    if (typeof raw === "string" && raw) setup = JSON.parse(raw);
    else if (raw && typeof raw === "object") setup = raw as Record<string, unknown>;
  } catch {}
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const expertArr = Array.isArray(setup.expertType)
    ? (setup.expertType as unknown[]).map((v) => String(v || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const expertType =
    expertArr.length === 0
      ? ""
      : expertArr.length === 1
        ? expertArr[0]
        : expertArr.length === 2
          ? `${expertArr[0]} and ${expertArr[1]}`
          : `${expertArr.slice(0, -1).join(", ")}, and ${expertArr[expertArr.length - 1]}`;
  return {
    audience: clean(setup.audience),
    superpower: clean(setup.superpower),
    problem: clean(setup.problem),
    outcome: clean(setup.outcome),
    expertType,
  };
};

const Day2QuizGenerating = () => {
  const { state, setState } = useAppState();
  const d1 = useMemo(() => readDay1(state.challenge.aiOutputs), [state.challenge.aiOutputs]);

  const messages = useMemo(() => {
    const list = [
      d1.audience ? `Reviewing ${d1.audience}…` : "Reviewing your audience…",
      d1.superpower ? `Analysing your superpower in ${d1.superpower}…` : "Analysing your superpower…",
      "Pulling in your Day 1 insights…",
      d1.expertType ? `Mapping archetypes for ${d1.expertType}…` : "Mapping your quiz archetypes…",
      d1.outcome ? `Building your quiz around ${d1.outcome}…` : "Building your quiz…",
    ];
    return list;
  }, [d1]);

  const [idx, setIdx] = useState(0);
  const [showing, setShowing] = useState(true);
  const [revealing, setRevealing] = useState(false);

  const apiDoneRef = useRef(false);
  const apiResultRef = useRef<unknown>(null);
  const minTimeDoneRef = useRef(false);
  const handedOffRef = useRef(false);

  // Kick off the API call once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("day2-thread", {
          body: {
            moment: "sample_quiz",
            inputs: {
              audience: d1.audience,
              superpower: d1.superpower,
              problem: d1.problem,
              outcome: d1.outcome,
              expertType: d1.expertType,
            },
          },
        });
        if (cancelled) return;
        if (error) throw error;
        apiResultRef.current = data ?? {};
        apiDoneRef.current = true;
        tryHandoff();
      } catch (err: any) {
        if (cancelled) return;
        toast.error(err?.message || "Couldn't generate your quiz right now.");
        setState((prev) => ({
          ...prev,
          challenge: {
            ...prev.challenge,
            aiOutputs: { ...prev.challenge.aiOutputs, day2_step: "1" },
          },
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Message cycler — fade out, swap, fade in.
  useEffect(() => {
    if (idx >= messages.length - 1) {
      // Final message stays until min time is met.
      const t = window.setTimeout(() => {
        minTimeDoneRef.current = true;
        tryHandoff();
      }, MESSAGE_MS);
      return () => window.clearTimeout(t);
    }
    const tOut = window.setTimeout(() => setShowing(false), MESSAGE_MS);
    const tIn = window.setTimeout(() => {
      setIdx((i) => i + 1);
      setShowing(true);
    }, MESSAGE_MS + FADE_MS);
    return () => {
      window.clearTimeout(tOut);
      window.clearTimeout(tIn);
    };
  }, [idx, messages.length]);

  const tryHandoff = () => {
    if (handedOffRef.current) return;
    if (!apiDoneRef.current || !minTimeDoneRef.current) return;
    handedOffRef.current = true;
    setRevealing(true);
    window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            day2_s2_quiz: JSON.stringify(apiResultRef.current ?? {}),
            day2_step: "2",
          },
        },
      }));
    }, REVEAL_FADE_MS);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center overflow-hidden transition-opacity duration-500",
        revealing ? "opacity-0" : "opacity-100",
      )}
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(222 47% 11%) 0%, hsl(222 47% 6%) 60%, hsl(222 47% 4%) 100%)",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Ambient particles */}
      <div className="pointer-events-none absolute inset-0">
        {[
          { top: "18%", left: "12%", size: 6, delay: "0s", dur: "4s" },
          { top: "72%", left: "18%", size: 4, delay: "1.2s", dur: "5s" },
          { top: "28%", left: "82%", size: 5, delay: "0.6s", dur: "4.5s" },
          { top: "78%", left: "76%", size: 7, delay: "1.8s", dur: "5.5s" },
          { top: "52%", left: "8%", size: 3, delay: "2.1s", dur: "4.2s" },
          { top: "12%", left: "58%", size: 4, delay: "0.9s", dur: "4.8s" },
          { top: "88%", left: "48%", size: 5, delay: "1.5s", dur: "5.2s" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary/40 blur-[1px] animate-pulse"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      </div>

      {/* Content column */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Orb */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* Outer halo glow */}
          <span
            className="absolute inset-0 rounded-full bg-primary/40 blur-3xl opacity-60 animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          {/* Outer ping ring */}
          <span className="absolute inset-4 rounded-full border border-primary/40 animate-ping" style={{ animationDuration: "2.4s" }} />
          {/* Mid ring */}
          <span className="absolute inset-8 rounded-full border border-primary/30" />
          {/* Core orb */}
          <span
            className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/60 shadow-[0_0_60px_hsl(var(--primary)/0.7)] animate-pulse"
            style={{ animationDuration: "2s" }}
          />
          {/* Inner highlight */}
          <span className="absolute h-8 w-8 rounded-full bg-white/30 blur-md" style={{ top: "32%", left: "32%" }} />
        </div>

        <p className="mt-10 text-[11px] font-black uppercase tracking-[0.28em] text-primary/80">
          Lovable AI · Generating
        </p>

        {/* Message slot — fixed height to prevent layout shift */}
        <div className="mt-3 flex h-16 items-center justify-center">
          <p
            key={idx}
            className={cn(
              "text-lg sm:text-xl font-semibold text-white/90 transition-all duration-300",
              showing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            {messages[idx]}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mt-8 flex gap-1.5">
          {messages.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i < idx ? "w-6 bg-primary" : i === idx ? "w-8 bg-primary" : "w-6 bg-white/15",
              )}
            />
          ))}
        </div>

        <p className="mt-10 text-xs text-white/40">
          Crafting a quiz tailored to your challenge…
        </p>
      </div>
    </div>
  );
};

export default Day2QuizGenerating;
