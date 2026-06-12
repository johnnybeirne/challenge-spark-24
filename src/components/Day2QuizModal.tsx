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
 * Big centred pop-up for the quiz generation + playback experience.
 *
 * Renders via portal directly to <body>. Uses a darkened backdrop and a
 * white panel that fills ~95% of the viewport. The Generating phase renders
 * inside the panel (not as its own fixed overlay) so it's always visible.
 */
const Day2QuizModal = ({ open, onClose }: Props) => {
  const { setState } = useAppState();
  const [phase, setPhase] = useState<"generating" | "playable">("generating");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setPhase("generating");
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

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
        "fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Backdrop (click to close) */}
      <button
        type="button"
        aria-label="Close quiz preview"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/85 backdrop-blur-sm"
      />

      {/* Big centred panel */}
      <div
        className={cn(
          "relative z-10 flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-border transition-transform duration-300",
          visible ? "scale-100" : "scale-95",
        )}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz preview"
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border backdrop-blur transition hover:bg-background hover:scale-105"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Phase content — fills the panel */}
        <div key={phase} className="relative flex-1 overflow-y-auto animate-fade-in">
          {phase === "generating" ? (
            <Day2QuizGenerating
              onComplete={(quiz) => {
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
