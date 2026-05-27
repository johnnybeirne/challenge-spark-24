import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Copy, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { challengerCoachContext, copilotMemoryContext } from "@/lib/personalisation";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserStage } from "@/hooks/useUserStage";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import TypingDots from "@/components/TypingDots";
import { toast } from "sonner";

interface ChatMsg { role: "user" | "assistant"; content: string; }

const DEFAULT_SUGGESTED = [
  "Help me choose a challenge idea",
  "Create a 5-day challenge structure",
  "What mistakes should I avoid?",
  "Give me challenge name ideas",
];

const DAY_SUGGESTED: Record<number, string[]> = {
  1: [
    "Sharpen my problem statement",
    "Make my audience more specific",
    "Reframe my challenge positioning",
    "What's a strong Day 1 outcome?",
  ],
  2: [
    "Improve my quiz questions",
    "Make my quiz more engaging",
    "Map quiz results to next steps",
    "How do I build Day 2 momentum?",
  ],
  3: [
    "Tighten my launch checklist",
    "Write a referral invite message",
    "Boost completion-to-referral conversion",
    "What should I do after Day 3?",
  ],
};

const Mentor = () => {
  const { state } = useAppState();
  const { role } = useUserRole();
  const { stage } = useUserStage();
  const identity = useChallengeIdentity();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isChallenger = role === "challenger";
  const currentDay = Math.min(Math.max(state.challenge.currentDay || 1, 1), 3);
  const SUGGESTED = isChallenger ? DAY_SUGGESTED[currentDay] ?? DEFAULT_SUGGESTED : DEFAULT_SUGGESTED;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { textareaRef.current?.focus(); }, [messages.length]);

  useEffect(() => {
    const seed = params.get("prompt");
    if (seed) {
      setInput(seed);
      params.delete("prompt");
      setParams(params, { replace: true });
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ask = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt || loading) return;
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");
    setLoading(true);
    try {
      const ch = state.challenge;
      const isComplete = ch.completed || ch.currentDay > 3;
      const unlockMap: Record<number, string> = {
        1: "AI Prompt Pack",
        2: "Lead Magnet Templates",
        3: "Community Access",
      };
      const baseContext = isChallenger
        ? challengerCoachContext(state.memory, {
            currentDay,
            completed: isComplete,
            problem: ch.aiOutputs?.[`day1_problem`] || state.memory.topic,
            audience: ch.aiOutputs?.[`day1_define_app`],
            method: ch.aiOutputs?.[`day1_result`] || state.memory.desiredOutcome,
            unlockedNext: isComplete ? "Community Access" : unlockMap[currentDay],
            hasUrl: !!ch.launchUrl,
            directReferrals: state.referrals?.count ?? 0,
          })
        : copilotMemoryContext(state.memory);
      const memoryContext = isChallenger && identity.isPersonalised
        ? `The user calls this "${identity.title}". Refer to it by that name when natural. ${baseContext}`
        : baseContext;
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt, memory: state.memory, memoryContext, stage },
      });
      if (error) throw error;
      const response = data?.response ?? "No response received.";
      setMessages((m) => [...m, { role: "assistant", content: response }]);
    } catch (err: any) {
      toast.error(err?.message || "Mentor is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <main className="app-page-container min-h-screen py-5 pb-28 lg:py-8 lg:pb-8">
      <section className="mx-auto flex max-w-5xl flex-col space-y-5 sm:space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Johnny AI
          </div>
          <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">Ask Johnny AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get practical, beginner-friendly help designing, launching, and running your challenge.
          </p>
        </header>


      <section className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Try a starter prompt:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <p className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</p>
              ) : (
                <div className="group max-w-[90%]">
                  <div className="prose prose-sm max-w-none text-foreground dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => copy(m.content)}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2.5"><TypingDots /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </section>

      <div className="mt-4 rounded-2xl border border-border bg-card p-3">
        <div className="flex gap-2">
          <DictatedTextarea
            ref={textareaRef}
            placeholder="Ask Johnny AI anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
            }}
            className="max-h-[140px] min-h-[44px] resize-none text-sm"
            rows={1}
          />
          <Button onClick={() => ask()} disabled={!input.trim() || loading} size="icon" className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Mentor;
