import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight, Pencil, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/context/AppContext";
import { getSetup } from "@/components/Day1Setup";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import johnnyAvatar from "@/assets/johnny-beirne.png";

const JohnnyAvatar = () => (
  <img
    src={johnnyAvatar}
    alt="Johnny AI"
    className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border"
  />
);

const Day2Screen1 = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();

  const setup = getSetup();
  const firstName = state.user?.name?.split(" ")[0] || "";
  const audience = setup?.audience || "";
  const superpower = setup?.superpower || "";
  const problem = setup?.problem || "";

  const savedExplanation = (state.challenge.aiOutputs.day2_screen1_explanation as string) || "";
  const savedPositioning = (state.challenge.aiOutputs.day2_screen1_positioning as string) || "";

  const [explanation, setExplanation] = useState<string>(savedExplanation);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const [positioning, setPositioning] = useState<string>(savedPositioning);
  const [loadingPos, setLoadingPos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Auto-generate explanation on first mount
  useEffect(() => {
    if (explanation || loadingExplain) return;
    void generateExplanation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, [key]: value },
      },
    }));
  };

  const generateExplanation = async () => {
    setLoadingExplain(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: {
          moment: "explain",
          inputs: { firstName, audience, superpower, problem },
        },
      });
      if (error) throw error;
      if (data?.fallback || !data?.text) {
        const fb = `${firstName ? `${firstName}, ` : ""}let me show you something that is going to change how you think about lead generation.\n\nQuiz marketing is the act of joining a conversation ${audience || "your audience"} is already having with themselves. In under three minutes a quiz listens, measures, and hands back a personalised next step — no forks, no maze.\n\nA generic PDF tells ${audience || "them"} what to do, gets saved with a dozen others, and sits forgotten in a downloads folder. A quiz is different. It mirrors where they are right now, names the tension they feel, and points to the one move that resolves it.\n\nThat matters for you because ${superpower ? `your superpower — ${superpower} — ` : "what you do best "}only lands once they have admitted the gap themselves. The quiz makes them say the pain out loud. Then you arrive as the person who can close it.\n\nThat is the whole shift: stop teaching the answer up front, start mirroring the question. The conversion happens inside the quiz, not after it.`;
        setExplanation(fb);
        persist("day2_screen1_explanation", fb);
      } else {
        setExplanation(data.text);
        persist("day2_screen1_explanation", data.text);
      }
      trackEvent("day_training_viewed", { day: 2, surface: "day2_screen1", mode: "explain" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    } finally {
      setLoadingExplain(false);
    }
  };

  const generatePositioning = async () => {
    setLoadingPos(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: {
          moment: "positioning",
          inputs: { firstName, audience, superpower, problem },
        },
      });
      if (error) throw error;
      const fb = `My quiz helps ${audience || "my audience"} see exactly where they are stuck${problem ? ` with ${problem}` : ""} so they can take the next clear step, powered by ${superpower || "what I do best"}.`;
      const text = data?.fallback || !data?.text ? fb : data.text;
      setPositioning(text);
      setDraft(text);
      persist("day2_screen1_positioning", text);
      trackEvent("day_training_viewed", { day: 2, surface: "day2_screen1", mode: "positioning" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    } finally {
      setLoadingPos(false);
    }
  };

  const savePositioning = () => {
    const next = draft.trim();
    if (!next) return;
    setPositioning(next);
    persist("day2_screen1_positioning", next);
    setEditing(false);
  };

  const handleContinue = () => {
    trackEvent("day_training_viewed", { day: 2, surface: "day2_screen1", mode: "continue" });
    // Screens 2-6 will be built next. For now, return to dashboard.
    toast.success("Screen 1 saved. Next screens coming soon.");
    navigate("/challenger-dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 pb-24">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            Day 2 · Step 1 of 6
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-6 rounded-full ${n === 1 ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-8">
          What is quiz marketing and why it will work for you.
        </h1>

        {/* Johnny explanation */}
        <div className="flex items-start gap-3 mb-8">
          <JohnnyAvatar />
          <div className="flex-1 min-w-0 space-y-3">
            {!explanation && loadingExplain && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin" />
                Johnny is thinking…
              </div>
            )}
            {explanation && (
              <div className="prose prose-sm md:prose-base max-w-none text-foreground prose-p:leading-relaxed prose-p:my-2.5">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Positioning generator */}
        {explanation && !positioning && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 animate-fade-in">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary mb-2">
              Your next move
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Let Johnny turn what you told him on Day 1 into a one-sentence
              positioning statement for your quiz. You can edit it after.
            </p>
            <Button
              onClick={generatePositioning}
              disabled={loadingPos}
              size="lg"
              className="w-full sm:w-auto"
            >
              {loadingPos ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate my quiz positioning statement
                </>
              )}
            </Button>
          </div>
        )}

        {/* Positioning result + inline edit */}
        {positioning && (
          <div className="rounded-2xl border-2 border-primary/40 bg-card p-5 sm:p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Your quiz positioning
              </p>
              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(positioning);
                    setEditing(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[120px] text-base leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft(positioning);
                      setEditing(false);
                    }}
                  >
                    <XIcon className="h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={savePositioning} disabled={!draft.trim()}>
                    <Check className="h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg leading-relaxed font-medium text-foreground">
                {positioning}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={generatePositioning}
                disabled={loadingPos || editing}
              >
                {loadingPos ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Continue */}
        {positioning && !editing && (
          <div className="mt-8 flex justify-end animate-fade-in">
            <Button size="lg" onClick={handleContinue}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day2Screen1;
