import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normaliseQuiz } from "@/components/Day2QuizPlayable";
import { LeadTreeIcon } from "@/components/LeadTreeIcon";
import leadtreeLogo from "@/assets/leadtree-logo.png.asset.json";

const MESSAGE_MS = 1800;
const FADE_MS = 350;
const REVEAL_FADE_MS = 450;
const AUDIO_FADE_OUT_SECONDS = 1.4;
const TOTAL_STEPS = 5;


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
    promise: clean(aiOutputs?.day1_promise),
  };
};

// ── Programmatic ambient pad ──────────────────────────────────────
// Two soft, slowly-detuned sines through a low-pass filter, with a subtle
// gain LFO so it feels calm without drawing attention. Web Audio
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
    filter.frequency.value = 520;
    filter.Q.value = 0.45;
    filter.connect(master);

    // Two oscillators, slightly detuned, warm low register.
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 82.41; // E2
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 123.47; // B2
    o2.detune.value = -3;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.08;
    o1.connect(voiceGain);
    o2.connect(voiceGain);
    voiceGain.connect(filter);

    // Very slow gain LFO, a barely-there breathing feel.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(voiceGain.gain);

    const now = ctx.currentTime;
    o1.start(now);
    o2.start(now);
    lfo.start(now);

    // Gentle fade-in.
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.22, now + 1.8);

    // Try to resume if the policy left it suspended (best-effort).
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    let stopped = false;
    return (fadeOutSeconds = AUDIO_FADE_OUT_SECONDS) => {
      if (stopped) return;
      stopped = true;
      try {
        const t = ctx.currentTime;
        const currentGain = master.gain.value;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(currentGain, t);
        master.gain.linearRampToValueAtTime(0, t + fadeOutSeconds);
        window.setTimeout(() => {
          try { o1.stop(); } catch {}
          try { o2.stop(); } catch {}
          try { lfo.stop(); } catch {}
          ctx.close().catch(() => {});
        }, Math.ceil((fadeOutSeconds + 0.1) * 1000));
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
    const name = firstName || "there";
    return [
      `Crafting your quiz, ${name}...`,
      `Building your questions...`,
      `Almost there, ${name}...`,
      `Adding the finishing touches...`,
      `Your quiz is nearly ready, ${name}...`,
    ];
  }, [firstName]);



  const [idx, setIdx] = useState(0);
  const [showing, setShowing] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  // Typing animation: type out the current message character-by-character at 35ms/char.
  useEffect(() => {
    if (!showing) return;
    const full = messages[idx] ?? "";
    setTypedText("");
    setTypingDone(false);
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setTypedText(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(interval);
        setTypingDone(true);
      }
    }, 35);
    return () => window.clearInterval(interval);
  }, [idx, showing, messages]);

  const apiDoneRef = useRef(false);
  const apiResultRef = useRef<unknown>(null);
  const minTimeDoneRef = useRef(false);
  const handedOffRef = useRef(false);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Ambient pad — fire and forget, clean up on unmount.
  useEffect(() => {
    stopAudioRef.current = startAmbientPad();
    return () => {
      stopAudioRef.current?.();
      stopAudioRef.current = null;
    };
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
              promise: d1.promise,
            },
          },
        });
        if (cancelled) return;
        if (error) throw error;
        const validated = normaliseQuiz(data);
        if (!validated) throw new Error("Quiz unavailable");
        apiResultRef.current = validated;
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
    stopAudioRef.current?.();
    stopAudioRef.current = null;
    setRevealing(true);
    window.setTimeout(() => {
      const validated = normaliseQuiz(apiResultRef.current);
      if (!validated) {
        onError?.();
        return;
      }
      if (onComplete) {
        onComplete(validated);
      } else {
        setState((prev) => ({
          ...prev,
          challenge: {
            ...prev.challenge,
            aiOutputs: {
              ...prev.challenge.aiOutputs,
              day2_s2_quiz: JSON.stringify(validated),
              day2_step: "2",
            },
          },
        }));
      }
    }, REVEAL_FADE_MS);
  };

  const stepNumber = Math.min(idx + 1, TOTAL_STEPS);

  return (
    <div
      className={cn(
        "absolute inset-0 flex min-h-screen items-center justify-center overflow-hidden transition-opacity duration-500",
        revealing ? "opacity-0" : "opacity-100",
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Powered by
          </p>
          <img
            src={leadtreeLogo.url}
            alt="LeadTree"
            width={120}
            className="h-auto w-[120px]"
          />
        </div>


        {/* Logo mark draw-on animation */}
        <style>{`
          @keyframes leadtree-draw {
            to { stroke-dashoffset: 0; }
          }
          .leadtree-anim path,
          .leadtree-anim circle {
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: var(--len, 100);
            stroke-dashoffset: var(--len, 100);
            animation: leadtree-draw 0.5s ease-in-out forwards;
            animation-iteration-count: infinite;
            animation-duration: 3s;
          }
          /* Sequential timing across a 3s loop: 2s draw + 1s hold.
             Each part draws over 0.5s of the 3s cycle (≈16.67%). */
          .leadtree-anim .lt-trunk {
            animation-name: leadtree-draw;
            animation-timing-function: ease-in-out;
            /* draw 0–0.5s, hold rest via keyframes */
          }
          @keyframes lt-trunk-kf   { 0%{stroke-dashoffset:var(--len);} 16.67%,100%{stroke-dashoffset:0;} }
          @keyframes lt-branchL-kf { 0%,16.67%{stroke-dashoffset:var(--len);} 33.33%,100%{stroke-dashoffset:0;} }
          @keyframes lt-branchR-kf { 0%,33.33%{stroke-dashoffset:var(--len);} 50%,100%{stroke-dashoffset:0;} }
          @keyframes lt-leaves-kf  { 0%,50%{stroke-dashoffset:var(--len);} 66.67%,100%{stroke-dashoffset:0;} }
          .leadtree-anim .lt-trunk   { animation-name: lt-trunk-kf; }
          .leadtree-anim .lt-branchL { animation-name: lt-branchL-kf; }
          .leadtree-anim .lt-branchR { animation-name: lt-branchR-kf; }
          .leadtree-anim .lt-leaves  { animation-name: lt-leaves-kf; }
        `}</style>
        <div className="mb-8 flex items-center justify-center">
          <svg
            width={96}
            height={96}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="leadtree-anim"
            aria-hidden="true"
          >
            {/* Trunk — draws bottom to top */}
            <path
              className="lt-trunk"
              d="M12 22 L12 14"
              stroke="#16A34A"
              strokeWidth="2"
              style={{ ["--len" as any]: 8 }}
              pathLength={8}
            />
            {/* Left branch */}
            <path
              className="lt-branchL"
              d="M12 16 L7 11"
              stroke="#16A34A"
              strokeWidth="1.75"
              style={{ ["--len" as any]: 8 }}
              pathLength={8}
            />
            {/* Right branch */}
            <path
              className="lt-branchR"
              d="M12 15 L17 10"
              stroke="#16A34A"
              strokeWidth="1.75"
              style={{ ["--len" as any]: 8 }}
              pathLength={8}
            />
            {/* Leaves / canopy — drawn last */}
            <path
              className="lt-leaves"
              d="M12 2 C 9 6 5 9 5 13 c 0 2.5 1.5 4.5 4 5.5 M12 2 c 3 4 7 7 7 11 0 2.5 -1.5 4.5 -4 5.5"
              stroke="#22C55E"
              strokeWidth="2"
              style={{ ["--len" as any]: 40 }}
              pathLength={40}
            />
          </svg>
        </div>

        {/* Status message */}
        <div className="flex h-6 items-center justify-center">
          <p
            key={idx}
            className={cn(
              "text-[20px] text-muted-foreground transition-all duration-300",
              showing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
            )}
          >
            {typedText}
            {!typingDone && <span className="ml-0.5 animate-pulse">|</span>}
          </p>
        </div>

        {/* Step counter */}
        <p className="mt-3 text-xs text-muted-foreground/70">
          Step {stepNumber} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
};


export default Day2QuizGenerating;
