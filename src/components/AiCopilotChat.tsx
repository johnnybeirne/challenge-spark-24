import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { Send, Loader2, X, MessageCircle, Move } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import TypingDots from "@/components/TypingDots";
import { copilotMemoryContext, hasMemory } from "@/lib/personalisation";
import { trackEvent } from "@/lib/analytics";
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

const BUBBLE_SIZE = 72;

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
  const firstName = state.user?.name?.split(" ")[0] || "";
  const personalisedWelcome = welcome === DEFAULT_WELCOME ? `What do you want to work on next, ${firstName}?` : welcome;

  // Draggable bubble position (persisted). null = default bottom-right.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem("chat_bubble_pos");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean; pointerId: number } | null>(null);

  const clampPos = (x: number, y: number) => {
    const w = window.innerWidth, h = window.innerHeight;
    return {
      x: Math.max(8, Math.min(w - BUBBLE_SIZE - 8, x)),
      y: Math.max(8, Math.min(h - BUBBLE_SIZE - 8, y)),
    };
  };

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
      const memoryContext = copilotMemoryContext(state.memory);
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt, memory: state.memory, memoryContext },
      });

      if (error) throw error;

      const response = data?.response ?? "No response received.";
      const entry: ChatEntry = { prompt, response, displayed: "", typing: true };
      setHistory((prev) => [...prev, entry]);
      if (hasMemory(state.memory)) {
        trackEvent("ai_response_personalised", { hasMemory: true });
        trackEvent("personalisation_used", { surface: "ai_copilot" });
      }

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
      {/* Floating bubble — bigger, clearly labelled, draggable */}
      {!open && (
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const origX = rect.left;
            const origY = rect.top;
            let moved = false;

            const onMove = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              const dy = ev.clientY - startY;
              if (!moved && Math.hypot(dx, dy) < 5) return;
              moved = true;
              setPos(clampPos(origX + dx, origY + dy));
            };
            const onUp = (ev: PointerEvent) => {
              document.removeEventListener("pointermove", onMove);
              document.removeEventListener("pointerup", onUp);
              document.removeEventListener("pointercancel", onUp);
              if (moved) {
                const finalPos = clampPos(origX + (ev.clientX - startX), origY + (ev.clientY - startY));
                try { localStorage.setItem("chat_bubble_pos", JSON.stringify(finalPos)); } catch {}
              } else {
                handleOpen();
              }
            };
            document.addEventListener("pointermove", onMove);
            document.addEventListener("pointerup", onUp);
            document.addEventListener("pointercancel", onUp);
          }}
          style={
            pos
              ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", touchAction: "none" }
              : { touchAction: "none" }
          }
          className={`fixed ${pos ? "" : "bottom-6 right-6"} z-50 group flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-card border-2 border-primary shadow-xl hover:shadow-2xl active:cursor-grabbing cursor-grab select-none ${
            !hasOpened ? "animate-bounce-in" : ""
          }`}
          aria-label="Open chat with Johnny B AI (drag to move)"
        >
          <span className="relative flex h-12 w-12 shrink-0 pointer-events-none">
            <img src={aiAvatar} alt="Johnny B AI" draggable={false} className="relative h-12 w-12 rounded-full object-cover border-2 border-background pointer-events-none" />
            <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-primary border-2 border-card flex items-center justify-center pointer-events-none shadow-md">
              <Move className="h-3 w-3 text-primary-foreground" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary border-2 border-card flex items-center justify-center pointer-events-none">
              <MessageCircle className="h-3 w-3 text-primary-foreground" />
            </span>
          </span>
          <span className="text-base font-semibold text-foreground pointer-events-none">Chat</span>
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
                    <ReactMarkdown>{personalisedWelcome}</ReactMarkdown>
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
              <DictatedTextarea
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
