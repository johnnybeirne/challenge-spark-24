import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, X, MessageCircle } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TypingDots from "@/components/TypingDots";

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
      toast.error(err?.message || "Something went wrong with the AI co-pilot.");
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
          className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors ${
            !hasOpened ? "animate-bounce-in" : ""
          }`}
          aria-label="Open chat"
        >
          <MessageCircle className={`h-6 w-6 ${!hasOpened ? "animate-subtle-bounce" : ""}`} style={!hasOpened ? { animationDelay: "0.6s" } : {}} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 6rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Co-pilot</h3>
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
                <Bot className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ask me anything about the challenge</p>
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
