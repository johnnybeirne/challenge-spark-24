import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import leadbeadLogo from "@/assets/leadbead-logo.png";

const MESSAGE_MS = 1800;
const FADE_MS = 350;
const REVEAL_FADE_MS = 450;
const FIRST_BEAD_DELAY_MS = 400;

// Bead palette + geometry (per design spec).
const BEADS = [
  { angle: -90, color: "#E85D4A", r: 13 },
  { angle: -18, color: "#F5A623", r: 11 },
  { angle: 54, color: "#4CAF82", r: 13 },
  { angle: 126, color: "#534AB7", r: 11 },
  { angle: 198, color: "#E8607A", r: 12 },
];
const TRACK_CX = 110;
const TRACK_CY = 110;
const TRACK_R = 80;


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
    const name = firstName || "Hey";
    return [
      `${name}, we're crafting your quiz...`,
      `${name}, your questions are taking shape...`,
      `${name}, almost there...`,
      `${name}, adding the finishing touches...`,
      `${name}, your quiz is nearly ready...`,
    ];
  }, [firstName]);


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

  // First bead has a small additional delay vs. the rest, per spec.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), FIRST_BEAD_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const stepNumber = Math.min(idx + 1, BEADS.length);

  return (
    <div
      className={cn(
        "absolute inset-0 flex min-h-screen items-center justify-center overflow-hidden bg-background transition-opacity duration-500",
        revealing ? "opacity-0" : "opacity-100",
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Logo */}
        <img
          src={leadbeadLogo}
          alt="LeadBead"
          width={120}
          className="mb-10 h-auto w-[120px]"
        />

        {/* Bead animation */}
        <svg
          width={220}
          height={220}
          viewBox="0 0 220 220"
          aria-hidden="true"
          className="mb-8"
        >
          <circle
            cx={TRACK_CX}
            cy={TRACK_CY}
            r={TRACK_R}
            fill="none"
            stroke="#E8E6E1"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {BEADS.map((b, i) => {
            const rad = (b.angle * Math.PI) / 180;
            const cx = TRACK_CX + TRACK_R * Math.cos(rad);
            const cy = TRACK_CY + TRACK_R * Math.sin(rad);
            const visible = started && idx >= i;
            const shineOffset = b.r * 0.35;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={visible ? b.r : 0}
                  fill={b.color}
                  style={{
                    transition: "r 450ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                <circle
                  cx={cx - shineOffset}
                  cy={cy - shineOffset}
                  r={visible ? b.r * 0.32 : 0}
                  fill="#ffffff"
                  opacity={0.3}
                  style={{
                    transition: "r 450ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Status message */}
        <div className="flex h-6 items-center justify-center">
          <p
            key={idx}
            className={cn(
              "text-[15px] text-muted-foreground transition-all duration-300",
              showing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
            )}
          >
            {messages[idx]}
          </p>
        </div>

        {/* Step counter */}
        <p className="mt-3 text-xs text-muted-foreground/70">
          Step {stepNumber} of {BEADS.length}
        </p>
      </div>
    </div>
  );
};


export default Day2QuizGenerating;
