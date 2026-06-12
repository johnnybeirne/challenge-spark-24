import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Day2QuizGenerating from "@/components/Day2QuizGenerating";
import Day2QuizPlayable from "@/components/Day2QuizPlayable";
import { useAppState } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen modal overlay for the quiz generation + playback experience.
 *
 * Sits above the Day 2 dashboard (which remains mounted behind it). Owns the
 * phase transition: generating (AI orb) → playable (landing → questions →
 * result). No routing — pure overlay.
 */
const Day2QuizModal = ({ open, onClose }: Props) => {
  const { setState } = useAppState();
  const [phase, setPhase] = useState<"generating" | "playable">("generating");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Mount/unmount with fade. When `open` flips true, mount and fade in.
  // When it flips false, fade out then unmount.
  useEffect(() => {
    if (open) {
      setPhase("generating");
      setMounted(true);
      // next frame → trigger fade-in
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  // Lock background scroll while open
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // ESC to close
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quiz preview"
      className={cn(
        "fixed inset-0 z-[100] transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative h-full w-full overflow-y-auto bg-background">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz preview"
          className="fixed right-4 top-4 z-[110] inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg ring-1 ring-border backdrop-blur transition hover:bg-background hover:scale-105 sm:right-6 sm:top-6"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Phase content with crossfade */}
        <div key={phase} className="animate-fade-in">
          {phase === "generating" ? (
            <Day2QuizGenerating
              onComplete={(quiz) => {
                // IMPORTANT: do NOT write day2_step here. The modal is rendered
                // from inside Day2Screen1, and changing day2_step causes
                // DayChallenge to swap out Day2Screen1 → modal unmounts mid-flow.
                // We only cache the generated quiz so Day2QuizPlayable can read it.
                setState((p) => ({
                  ...p,
                  challenge: {
                    ...p.challenge,
                    aiOutputs: {
                      ...p.challenge.aiOutputs,
                      day2_s2_quiz: JSON.stringify(quiz ?? {}),
                    },
                  },
                }));
                setPhase("playable");
              }}
              onError={onClose}
            />
          ) : (
            <Day2QuizPlayable onBack={onClose} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Day2QuizModal;
