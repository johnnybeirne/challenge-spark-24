import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { copilotMemoryContext } from "@/lib/personalisation";
import { trackEvent } from "@/lib/analytics";

interface ChatEntry { prompt: string; response: string }

interface Props {
  dayNum?: number;
  focus: string;
  focusSubtitle?: string;
  starters: string[];
  eyebrow?: string;
  outputKeyPrefix?: string;
  placeholder?: string;
}

// AI-guided implementation surface. Replaces video-first LMS pattern with
// strategist-style prompts + free-form input. Day 1 uses an inline variant;
// every other day + the Training hub use this shared component.
const DayCopilot = ({
  dayNum,
  focus,
  focusSubtitle,
  starters,
  eyebrow = "AI-guided training",
  outputKeyPrefix = "copilot",
  placeholder = "Ask your AI co-pilot anything — brainstorm, refine, request examples or critique…",
}: Props) => {
  const { state, setState } = useAppState();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [history, loading]);

  const ask = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setInput("");
    try {
      const memoryContext = copilotMemoryContext(state.memory);
      const dayContext = dayNum
        ? `\n\nThe user is currently on Day ${dayNum} of the 3-day challenge. Current focus: ${focus}`
        : "";
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: {
          prompt,
          memory: state.memory,
          memoryContext: memoryContext + dayContext,
        },
      });
      if (error) throw error;
      const response = data?.response ?? "No response received.";
      setHistory((prev) => [...prev, { prompt, response }]);
      trackEvent("day_training_viewed", { day: dayNum, surface: outputKeyPrefix, mode: "copilot_prompt" });
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            [`${outputKeyPrefix}_${Date.now()}`]: response,
          },
        },
      }));
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach the AI right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* CURRENT FOCUS */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
          <Target className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h3 className="mt-1.5 text-lg font-bold text-foreground">{focus}</h3>
        {focusSubtitle && <p className="mt-1 text-sm text-muted-foreground">{focusSubtitle}</p>}
      </div>

      {/* Chat thread */}
      <div
        ref={messagesRef}
        className="rounded-xl border border-border bg-background p-4 min-h-[200px] max-h-[420px] overflow-y-auto space-y-4"
      >
        {history.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Pick a starter below or type your own question to begin.
          </p>
        )}
        {history.map((entry, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {entry.prompt}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground prose prose-sm max-w-none">
                <ReactMarkdown>{entry.response}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {/* Starter prompts */}
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            {s}
          </button>
        ))}
      </div>

      {/* Free-form input */}
      <div className="rounded-xl border border-border bg-card p-3">
        <DictatedTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-h-[64px] border-0 focus-visible:ring-0 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={() => ask()} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4 mr-1.5" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DayCopilot;
