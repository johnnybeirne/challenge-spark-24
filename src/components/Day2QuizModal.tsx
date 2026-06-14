import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Day2QuizGenerating from "@/components/Day2QuizGenerating";
import Day2QuizPlayable from "@/components/Day2QuizPlayable";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { useAppState } from "@/context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Big centred pop-up for the quiz generation + playback experience.
 * Uses the app's shadcn Dialog primitives so it integrates with the rest
 * of the modal stack. The generating phase renders inside the panel; on
 * completion it swaps in the playable quiz. Escape and the X button close.
 */
const Day2QuizModal = ({ open, onClose }: Props) => {
  const { setState } = useAppState();
  const [phase, setPhase] = useState<"generating" | "playable">("generating");

  useEffect(() => {
    if (open) setPhase("generating");
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-md" />
        <DialogPrimitive.Content
          aria-label="Quiz preview"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 flex h-[95vh] w-[95vw] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border bg-background p-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ borderRadius: 12 }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiz preview"
            className="absolute right-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-muted hover:text-foreground"
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
              <Day2QuizPlayable onClose={onClose} />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default Day2QuizModal;
