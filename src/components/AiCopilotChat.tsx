import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, X } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";

interface ChatEntry {
  prompt: string;
  response: string;
  displayed?: string;
  typing?: boolean;
}

const TYPE_INTERVAL_MS = 18;
const TYPE_CHARS_PER_TICK = 2;

const DEFAULT_WELCOME = "Ask Johnny B AI anything about the challenge";
const DEFAULT_FALLBACK = "I don't have an answer for that yet. Try one of the suggested questions below.";
const CHAT_PANEL_HEIGHT = "min(520px, calc(100vh - 8rem))";

const AiCopilotChat = () => {
  const { state, setState } = useAppState();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(() => !!sessionStorage.getItem("chat_opened"));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [welcome, setWelcome] = useState<string>(DEFAULT_WELCOME);
  const [starters, setStarters] = useState<string[]>([]);
  const [fallback, setFallback] = useState<string>(DEFAULT_FALLBACK);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("copilot_config") as any)
        .select("welcome_message, starter_questions, fallback_message")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.welcome_message) setWelcome(data.welcome_message);
      if (Array.isArray(data?.starter_questions)) setStarters(data.starter_questions as string[]);
      if (data?.fallback_message) setFallback(data.fallback_message);
    })();
  }, []);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: history.length > 0 ? "smooth" : "auto",
    });
  }, [history, loading]);

  // Typewriter effect for the latest response
  useEffect(() => {
    const idx = history.findIndex((h) => h.typing);
    if (idx === -1) return;
    const interval = setInterval(() => {
      setHistory((prev) => {
        const next = [...prev];
        const e = next[idx];
        if (!e || !e.typing) return prev;
        const nextLen = Math.min((e.displayed?.length ?? 0) + TYPE_CHARS_PER_TICK, e.response.length);
        next[idx] = {
          ...e,
          displayed: e.response.slice(0, nextLen),
          typing: nextLen < e.response.length,
        };
        return next;
      });
    }, TYPE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [history]);

  const handleOpen = () => {
    setOpen(true);
    setHasOpened(true);
    sessionStorage.setItem("chat_opened", "1");
  };

  const askCopilot = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt || loading) return;

    setLoading(true);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt },
      });

      if (error) throw error;

      const response = data?.response ?? "No response received.";
      const entry: ChatEntry = { prompt, response, displayed: "", typing: true };
      setHistory((prev) => [...prev, entry]);

      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            [`msg_${Date.now()}`]: response,
          },
        },
      }));
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong with Johnny B AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 group flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-card border-2 border-foreground shadow-lg hover:scale-105 transition-transform ${
            !hasOpened ? "animate-bounce-in" : ""
          }`}
          aria-label="Ask Johnny B AI a question"
        >
          <span className="relative flex h-12 w-12 shrink-0">
            <img src={aiAvatar} alt="Johnny B AI" className="relative h-12 w-12 rounded-full object-cover border-2 border-background" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground">Johnny B AI</span>
            <span className="text-sm font-semibold text-foreground">Ask me anything →</span>
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          style={{ height: CHAT_PANEL_HEIGHT, maxHeight: CHAT_PANEL_HEIGHT }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <img src={aiAvatar} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
              <h3 className="text-sm font-semibold text-foreground">Johnny B AI</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages — scrollable */}
          <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="px-4 py-3">
              {history.length === 0 && !loading && (
                <div className="text-center py-6">
                  <img src={aiAvatar} alt="" className="h-12 w-12 rounded-full object-cover mx-auto mb-3 opacity-80" />
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{welcome}</ReactMarkdown>
                  </div>
                  {starters.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {starters.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => askCopilot(q)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {history.map((entry, i) => {
                  const isFallback =
                    !entry.typing && entry.response.trim() === fallback.trim();
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-end">
                        <p className="text-sm text-foreground bg-primary/10 rounded-lg px-3 py-2 max-w-[85%]">
                          {entry.prompt}
                        </p>
                      </div>
                      <div className="flex justify-start">
                        <div className="text-sm text-foreground bg-muted rounded-lg px-3 py-2 max-w-[85%] prose prose-sm dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_p]:my-1.5">
                          <ReactMarkdown>{entry.displayed ?? entry.response}</ReactMarkdown>
                        </div>
                      </div>
                      {isFallback && starters.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {starters.map((q, qi) => (
                            <button
                              key={qi}
                              onClick={() => askCopilot(q)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-card shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askCopilot();
                  }
                }}
                className="min-h-[40px] max-h-[80px] text-sm resize-none"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => askCopilot()}
                disabled={!input.trim() || loading}
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiCopilotChat;
