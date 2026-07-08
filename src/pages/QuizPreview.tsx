import { useEffect, useState } from "react";
import Day2QuizGenerating from "@/components/Day2QuizGenerating";
import Day2QuizPlayable from "@/components/Day2QuizPlayable";
import { useAppState } from "@/context/AppContext";

/**
 * Standalone quiz preview window.
 *
 * Opened in a new browser tab from Day 2 Step 1 so creators can show their
 * audience exactly what taking the quiz feels like, without leaving the
 * main builder flow in the original tab.
 *
 * Flow inside this window: full-screen "AI is building" generation →
 * playable Step 2 quiz. Closing the window returns the user to wherever
 * they were in the main app.
 */
const QuizPreview = () => {
  const { setState } = useAppState();
  const [phase, setPhase] = useState<"generating" | "playable">("generating");

  useEffect(() => {
    const prev = document.title;
    document.title = "Your quiz preview · LeadTree";
    return () => {
      document.title = prev;
    };
  }, []);

  const handleClose = () => {
    // Best-effort close; if the browser blocks it (tab wasn't script-opened
    // on this navigation), fall back to history.back / about:blank.
    try {
      window.close();
    } catch {
      /* no-op */
    }
    setTimeout(() => {
      if (!window.closed) {
        window.location.href = "about:blank";
      }
    }, 100);
  };

  if (phase === "generating") {
    return (
      <Day2QuizGenerating
        onComplete={(quiz) => {
          // Persist the generated quiz into shared state so Day2QuizPlayable
          // (which reads from state) can render it.
          setState((p) => ({
            ...p,
            challenge: {
              ...p.challenge,
              aiOutputs: {
                ...p.challenge.aiOutputs,
                day2_s2_quiz: JSON.stringify(quiz ?? {}),
                day2_step: "2",
              },
            },
          }));
          setPhase("playable");
        }}
        onError={handleClose}
      />
    );
  }

  return <Day2QuizPlayable onClose={handleClose} />;
};

export default QuizPreview;
