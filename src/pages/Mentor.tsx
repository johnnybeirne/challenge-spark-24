import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Copy, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { copilotMemoryContext } from "@/lib/personalisation";
import TypingDots from "@/components/TypingDots";
import { toast } from "sonner";

interface ChatMsg { role: "user" | "assistant"; content: string; }

const SUGGESTED = [
  "Help me choose a challenge idea",
  "Create a 5-day challenge structure",
  "What mistakes should I avoid?",
  "Give me challenge name ideas",
];

const Mentor = () => {
  const { state } = useAppState();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      const memoryContext = copilotMemoryContext(state.memory);
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt, memory: state.memory, memoryContext },
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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 py-6 lg:py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Challenge Mentor
        </div>
        <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">Ask the Mentor</h1>
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
          <Textarea
            ref={textareaRef}
            placeholder="Ask the Challenge Mentor anything…"
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
