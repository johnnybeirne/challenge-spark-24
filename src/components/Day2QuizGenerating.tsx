import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MESSAGE_MS = 1800;
const FADE_MS = 350;
const REVEAL_FADE_MS = 450;

// Accent palette for this screen only (per design spec).
const ACCENT_PRIMARY = "#5B4DB1";   // deep violet
const ACCENT_SECONDARY = "#CC5500"; // burnt orange

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

// ── Programmatic ambient pad ──────────────────────────────────────
// Two slowly-detuned sines through a low-pass filter, with a slow
// gain LFO so it breathes like something is being built. Web Audio
// API only — no files, no libraries. Respects autoplay policy: if
// the AudioContext can't start (e.g. system muted or autoplay
// blocked) we silently skip.
const startAmbientPad = () => {
  try {
    const Ctor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return () => {};
    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    filter.connect(master);

    // Two oscillators, slightly detuned, low register.
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 110; // A2
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 164.81; // E3 — perfect fifth
    o2.detune.value = -6;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.18;
    o1.connect(voiceGain);
    o2.connect(voiceGain);
    voiceGain.connect(filter);

    // Slow gain LFO — pulsing "breathing" feel.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.25; // ~4s cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(voiceGain.gain);

    const now = ctx.currentTime;
    o1.start(now);
    o2.start(now);
    lfo.start(now);

    // Gentle fade-in.
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.5, now + 1.2);

    // Try to resume if the policy left it suspended (best-effort).
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      try {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.4);
        window.setTimeout(() => {
          try { o1.stop(); } catch {}
          try { o2.stop(); } catch {}
          try { lfo.stop(); } catch {}
          ctx.close().catch(() => {});
        }, 500);
      } catch {
        try { ctx.close(); } catch {}
      }
    };
  } catch {
    return () => {};
  }
};

interface Day2QuizGeneratingProps {
  /** When provided, called with the generated quiz instead of mutating day2_step. */
  onComplete?: (quiz: unknown) => void;
  /** When provided, called on API failure instead of resetting day2_step. */
  onError?: () => void;
}

const Day2QuizGenerating = ({ onComplete, onError }: Day2QuizGeneratingProps = {}) => {
  const { state, setState, authUser } = useAppState();
  const d1 = useMemo(() => readDay1(state.challenge.aiOutputs), [state.challenge.aiOutputs]);

  const firstName = useMemo(() => {
    const metaName =
      (authUser?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
      (authUser?.user_metadata as { name?: string } | undefined)?.name ||
      "";
    return (state.user?.name?.split(" ")[0] || metaName.split(" ")[0] || "").trim();
  }, [state.user?.name, authUser]);

  const messages = useMemo(() => {
    const audienceLine = d1.audience
      ? `Reviewing your audience: ${d1.audience}…`
      : "Reviewing your audience…";
    const superpowerLine = d1.superpower
      ? `Analysing your superpower: ${d1.superpower}…`
      : "Analysing your superpower…";
    const insightsLine = firstName
      ? `Pulling in your Day 1 insights, ${firstName}…`
      : "Pulling in your Day 1 insights…";
    const archetypeLine = d1.expertType
      ? `Mapping your quiz archetypes for ${d1.expertType}…`
      : "Mapping your quiz archetypes…";
    const buildLine = firstName
      ? `Building your quiz, ${firstName}…`
      : "Building your quiz…";
    return [audienceLine, superpowerLine, insightsLine, archetypeLine, buildLine];
  }, [d1, firstName]);

  const [idx, setIdx] = useState(0);
  const [showing, setShowing] = useState(true);
  const [revealing, setRevealing] = useState(false);

  const apiDoneRef = useRef(false);
  const apiResultRef = useRef<unknown>(null);
  const minTimeDoneRef = useRef(false);
  const handedOffRef = useRef(false);

  // Ambient pad — fire and forget, clean up on unmount.
  useEffect(() => {
    const stop = startAmbientPad();
    return () => stop();
  }, []);

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
        if (onError) {
          onError();
        } else {
          setState((prev) => ({
            ...prev,
            challenge: {
              ...prev.challenge,
              aiOutputs: { ...prev.challenge.aiOutputs, day2_step: "1" },
            },
          }));
        }
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
      if (onComplete) {
        onComplete(apiResultRef.current ?? {});
      } else {
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
      }
    }, REVEAL_FADE_MS);
  };

  return (
    <div
      className={cn(
        "absolute inset-0 flex min-h-[60vh] items-center justify-center overflow-hidden transition-opacity duration-500",
        revealing ? "opacity-0" : "opacity-100",
      )}
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(222 47% 11%) 0%, hsl(222 47% 6%) 60%, hsl(222 47% 4%) 100%)",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Ambient particles — alternating accent colours */}
      <div className="pointer-events-none absolute inset-0">
        {[
          { top: "18%", left: "12%", size: 6, delay: "0s", dur: "4s", c: ACCENT_PRIMARY },
          { top: "72%", left: "18%", size: 4, delay: "1.2s", dur: "5s", c: ACCENT_SECONDARY },
          { top: "28%", left: "82%", size: 5, delay: "0.6s", dur: "4.5s", c: ACCENT_PRIMARY },
          { top: "78%", left: "76%", size: 7, delay: "1.8s", dur: "5.5s", c: ACCENT_SECONDARY },
          { top: "52%", left: "8%", size: 3, delay: "2.1s", dur: "4.2s", c: ACCENT_PRIMARY },
          { top: "12%", left: "58%", size: 4, delay: "0.9s", dur: "4.8s", c: ACCENT_SECONDARY },
          { top: "88%", left: "48%", size: 5, delay: "1.5s", dur: "5.2s", c: ACCENT_PRIMARY },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full blur-[1px] animate-pulse"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.c,
              opacity: 0.55,
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
            className="absolute inset-0 rounded-full blur-3xl animate-pulse"
            style={{ backgroundColor: ACCENT_PRIMARY, opacity: 0.55, animationDuration: "3s" }}
          />
          {/* Secondary halo accent */}
          <span
            className="absolute inset-6 rounded-full blur-2xl animate-pulse"
            style={{ backgroundColor: ACCENT_SECONDARY, opacity: 0.25, animationDuration: "4s" }}
          />
          {/* Outer ping ring */}
          <span
            className="absolute inset-4 rounded-full border animate-ping"
            style={{ borderColor: `${ACCENT_PRIMARY}66`, animationDuration: "2.4s" }}
          />
          {/* Mid ring */}
          <span
            className="absolute inset-8 rounded-full border"
            style={{ borderColor: `${ACCENT_PRIMARY}4D` }}
          />
          {/* Core orb */}
          <span
            className="relative h-20 w-20 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${ACCENT_PRIMARY} 0%, ${ACCENT_PRIMARY} 55%, ${ACCENT_SECONDARY} 130%)`,
              boxShadow: `0 0 60px ${ACCENT_PRIMARY}B3, 0 0 30px ${ACCENT_SECONDARY}55`,
              animationDuration: "2s",
            }}
          />
          {/* Inner highlight */}
          <span
            className="absolute h-8 w-8 rounded-full bg-white/30 blur-md"
            style={{ top: "32%", left: "32%" }}
          />
        </div>

        <p
          className="mt-10 text-[11px] font-black uppercase tracking-[0.28em]"
          style={{ color: `${ACCENT_PRIMARY}` }}
        >
          LeadBead · Generating
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
          {messages.map((_, i) => {
            const active = i === idx;
            const done = i < idx;
            return (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: active ? 32 : 24,
                  backgroundColor: done || active ? ACCENT_PRIMARY : "rgba(255,255,255,0.15)",
                  boxShadow: active ? `0 0 12px ${ACCENT_SECONDARY}AA` : undefined,
                }}
              />
            );
          })}
        </div>

        <p className="mt-10 text-xs text-white/40">
          Crafting a quiz tailored to your challenge…
        </p>
      </div>
    </div>
  );
};

export default Day2QuizGenerating;
