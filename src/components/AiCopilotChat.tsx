import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);

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

      // Store in global state
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
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Co-pilot</h3>
        </div>

        {history.length > 0 && (
          <ScrollArea className="max-h-60">
            <div className="space-y-3 pr-2">
              {history.map((entry, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">You</p>
                  <p className="text-sm text-foreground bg-muted rounded-md px-3 py-2">
                    {entry.prompt}
                  </p>
                  <p className="text-xs font-medium text-primary">Co-pilot</p>
                  <p className="text-sm text-foreground bg-primary/5 rounded-md px-3 py-2 whitespace-pre-wrap">
                    {entry.response}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder="Ask your co-pilot anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                askCopilot();
              }
            }}
            className="min-h-[40px] text-sm resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={askCopilot}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiCopilotChat;
