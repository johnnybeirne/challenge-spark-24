import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";

interface ChatEntry {
  prompt: string;
  response: string;
}

const AiCopilotChat = () => {
  const { state, setState } = useAppState();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(() => !!sessionStorage.getItem("chat_opened"));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);

  const handleOpen = () => {
    setOpen(true);
    setHasOpened(true);
    sessionStorage.setItem("chat_opened", "1");
  };

  const askCopilot = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setLoading(true);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt },
      });

      if (error) throw error;

      const response = data?.response ?? "No response received.";
      const entry: ChatEntry = { prompt, response };
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
          className={`fixed bottom-24 right-6 z-50 group flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-card border-2 border-foreground shadow-lg hover:scale-105 transition-transform ${
            !hasOpened ? "animate-bounce-in" : ""
          }`}
          aria-label="Ask Johnny B AI a question"
        >
          <span className="relative flex h-12 w-12 shrink-0">
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75" />
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
          style={{ maxHeight: "min(520px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
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

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            {history.length === 0 && !loading && (
              <div className="text-center py-8">
                <img src={aiAvatar} alt="" className="h-12 w-12 rounded-full object-cover mx-auto mb-2 opacity-60" />
                <p className="text-sm text-muted-foreground">Ask Johnny B AI anything about the challenge</p>
              </div>
            )}
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <p className="text-sm text-foreground bg-primary/10 rounded-lg px-3 py-2 max-w-[85%]">
                      {entry.prompt}
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap">
                      {entry.response}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-card">
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
                onClick={askCopilot}
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
