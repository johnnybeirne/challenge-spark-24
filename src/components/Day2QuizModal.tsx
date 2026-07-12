import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, RefreshCw } from "lucide-react";
import Day2QuizGenerating from "@/components/Day2QuizGenerating";
import Day2QuizPlayable, { normaliseQuiz } from "@/components/Day2QuizPlayable";
import { useAppState } from "@/context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Big centred pop-up for the quiz generation + playback experience.
 * Custom portal implementation so we control the backdrop blur directly.
 */
const Day2QuizModal = ({ open, onClose }: Props) => {
  const { setState } = useAppState();
  const [phase, setPhase] = useState<"generating" | "playable" | "error">("generating");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (open) {
      setPhase("generating");
      setAttempt(0);
    }
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quiz preview"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "88vw",
          height: "90vh",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz preview"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            transition: "color 150ms ease, background-color 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
            e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={24} />
        </button>

        {/* Phase content — fills the panel */}
        <div
          key={`${phase}-${attempt}`}
          className="animate-fade-in"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "auto",
          }}
        >
          {phase === "generating" ? (
            <Day2QuizGenerating
              onComplete={(quiz) => {
                const validated = normaliseQuiz(quiz);
                if (!validated) {
                  setPhase("error");
                  return;
                }
                setState((p) => ({
                  ...p,
                  challenge: {
                    ...p.challenge,
                    aiOutputs: {
                      ...p.challenge.aiOutputs,
                      day2_s2_quiz: JSON.stringify(validated),
                    },
                  },
                }));
                setPhase("playable");
              }}
              onError={() => setPhase("error")}
            />
          ) : phase === "error" ? (
            <div className="flex h-full w-full items-center justify-center p-8">
              <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <h3 className="text-[var(--h2-size)] font-black text-foreground">
                  We couldn't generate your quiz
                </h3>
                <p className="mt-2 text-[var(--body-size)] text-muted-foreground">
                  Something went wrong on our side. Your previous quiz (if any) is still saved.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttempt((a) => a + 1);
                      setPhase("generating");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[var(--body-size)] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--body-size)] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Day2QuizPlayable onClose={onClose} />
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default Day2QuizModal;
