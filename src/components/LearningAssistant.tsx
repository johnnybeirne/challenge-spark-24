import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import johnnyAvatar from "@/assets/johnny-beirne.png";

export type Turn = { role: "user" | "ai"; text: string };

type Props = {
  topic?: string;
  prompts: string[];
  ask: (prompt: string) => Promise<string>;
};

const LearningAssistant = ({ topic = "Your challenge", prompts, ask }: Props) => {
  const [openPill, setOpenPill] = useState<string | null>(prompts[0] ?? null);
  const [threads, setThreads] = useState<Record<string, Turn[]>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<Record<string, string>>({});
  const [freeform, setFreeform] = useState("");
  const [freeThread, setFreeThread] = useState<Turn[]>([]);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const freeRef = useRef<HTMLDivElement | null>(null);

  // Auto-load the first pill once
  useEffect(() => {
    if (!openPill) return;
    if (threads[openPill]) return;
    void run(openPill, openPill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPill]);

  useEffect(() => {
    const el = openPill ? scrollRefs.current[openPill] : null;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [threads, loadingKey, openPill]);

  useEffect(() => {
    freeRef.current?.scrollTo({ top: freeRef.current.scrollHeight, behavior: "smooth" });
  }, [freeThread, loadingKey]);

  const run = async (key: string, prompt: string) => {
    setThreads((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { role: "user", text: prompt }] }));
    setLoadingKey(key);
    try {
      const response = await ask(prompt);
      setThreads((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { role: "ai", text: response }] }));
    } finally {
      setLoadingKey(null);
    }
  };

  const runFree = async () => {
    const prompt = freeform.trim();
    if (!prompt || loadingKey) return;
    setFreeform("");
    setFreeThread((prev) => [...prev, { role: "user", text: prompt }]);
    setLoadingKey("__free__");
    try {
      const response = await ask(prompt);
      setFreeThread((prev) => [...prev, { role: "ai", text: response }]);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">Learning assistant</span>
        </div>
        <span className="text-xs text-muted-foreground">Topic: {topic}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Pills */}
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground mb-3">SUGGESTED PROMPTS</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => {
              const active = openPill === p;
              return (
                <button
                  key={p}
                  onClick={() => setOpenPill(active ? null : p)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion */}
        {openPill && (
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden animate-fade-in">
            <button
              onClick={() => setOpenPill(null)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/70 transition"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {openPill}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            <div
              ref={(el) => (scrollRefs.current[openPill] = el)}
              className="px-4 py-4 max-h-[360px] overflow-y-auto space-y-3 bg-background"
            >
              {(threads[openPill] ?? []).map((t, i) => (
                <Bubble key={i} turn={t} />
              ))}
              {loadingKey === openPill && <Typing />}
            </div>

            <div className="border-t border-border bg-background p-3 flex gap-2">
              <input
                value={followUp[openPill] ?? ""}
                onChange={(e) => setFollowUp((p) => ({ ...p, [openPill]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const v = (followUp[openPill] ?? "").trim();
                    if (!v || loadingKey) return;
                    setFollowUp((p) => ({ ...p, [openPill]: "" }));
                    void run(openPill, v);
                  }
                }}
                placeholder="Follow up on this answer…"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                size="sm"
                disabled={loadingKey !== null || !(followUp[openPill] ?? "").trim()}
                onClick={() => {
                  const v = (followUp[openPill] ?? "").trim();
                  if (!v) return;
                  setFollowUp((p) => ({ ...p, [openPill]: "" }));
                  void run(openPill, v);
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Freeform */}
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground mb-2">ASK ANYTHING</p>
          {freeThread.length > 0 && (
            <div
              ref={freeRef}
              className="mb-3 rounded-xl border border-border bg-background p-4 max-h-[320px] overflow-y-auto space-y-3"
            >
              {freeThread.map((t, i) => (
                <Bubble key={i} turn={t} />
              ))}
              {loadingKey === "__free__" && <Typing />}
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-3">
            <DictatedTextarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              placeholder="Type your own question or thought…"
              className="min-h-[64px] border-0 focus-visible:ring-0 resize-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runFree();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Press Enter to send</span>
              <Button size="sm" onClick={runFree} disabled={loadingKey !== null || !freeform.trim()}>
                <Send className="h-4 w-4 mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ turn }: { turn: Turn }) => {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2 text-sm text-foreground">
          {turn.text}
        </div>
        <div className="h-7 w-7 shrink-0 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground grid place-items-center">
          You
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start gap-2">
      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/15 text-[10px] font-semibold text-primary grid place-items-center">
        AI
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{turn.text}</ReactMarkdown>
      </div>
    </div>
  );
};

const Typing = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="h-7 w-7 rounded-full bg-primary/15 text-[10px] font-semibold text-primary grid place-items-center">AI</div>
    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  </div>
);

export default LearningAssistant;
