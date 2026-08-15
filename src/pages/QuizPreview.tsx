import { useEffect, useState } from "react";
import Day2QuizGenerating from "@/components/Day2QuizGenerating";
import Day2QuizPlayable from "@/components/Day2QuizPlayable";
import { useAppState } from "@/context/AppContext";
import UnlockGate from "@/components/UnlockGate";

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
const QuizPreviewInner = () => {
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
          // Persist only the generated quiz so Day2QuizPlayable (which reads from
          // state) can render it. Never set day2_step: that flag would make the
          // preview mount inside the Day 2 content area in the main tab.
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
        onError={handleClose}
      />
    );
  }


  return <Day2QuizPlayable onClose={handleClose} />;
};

/**
 * Building the quiz is Day 2 work, so this standalone window sits behind the
 * same Day 2 unlock gate as the Day 2 page itself.
 */
const QuizPreview = () => {
  const { state } = useAppState();

  return (
    <div className="min-h-screen bg-background p-4">
      <UnlockGate gateKey="day2" dayIndex={2} signupAt={state.challenge.startedAt}>
        <QuizPreviewInner />
      </UnlockGate>
    </div>
  );
};

export default QuizPreview;
