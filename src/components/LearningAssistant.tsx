import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Loader2, Send, Sparkles } from "lucide-react";
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
  autoOpen?: boolean;
  typewriter?: boolean;
  onJoinCtaClick?: () => void;
  limitToOneQuestion?: boolean;
  advisorAvatar?: string | null;
  advisorName?: string;
  allowFollowUpQuestion?: boolean;
  followUpPlaceholder?: string;
  followUpButtonLabel?: string;
  joinCtaLabel?: string;
};

const LearningAssistant = ({ topic = "Your challenge", prompts, ask, autoOpen = true, typewriter = false, onJoinCtaClick, limitToOneQuestion = false, advisorAvatar, advisorName, allowFollowUpQuestion = false, followUpPlaceholder, followUpButtonLabel, joinCtaLabel }: Props) => {
  const [openPill, setOpenPill] = useState<string | null>(autoOpen ? prompts[0] ?? null : null);
  const [threads, setThreads] = useState<Record<string, Turn[]>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [freeform, setFreeform] = useState("");
  const [freeThread, setFreeThread] = useState<Turn[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [freeformAnswered, setFreeformAnswered] = useState(false);
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
    if (!el) return;
    el.scrollTo({ top: typewriter ? 0 : el.scrollHeight, behavior: "smooth" });
  }, [threads, loadingKey, openPill, typewriter]);

  useEffect(() => {
    if (!freeRef.current) return;
    freeRef.current.scrollTo({ top: typewriter ? 0 : freeRef.current.scrollHeight, behavior: "smooth" });
  }, [freeThread, loadingKey, typewriter]);

  const run = async (key: string, prompt: string) => {
    setThreads((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { role: "user", text: prompt }] }));
    setLoadingKey(key);
    try {
      const response = await ask(prompt);
      setThreads((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { role: "ai", text: response }] }));
      setHasAnswered(true);
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
      setHasAnswered(true);
      setFreeformAnswered(true);
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
      </div>

      <div className="p-5 space-y-5">
        {/* Pills */}
        {(!limitToOneQuestion || !hasAnswered) && (
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
        )}

        {/* Accordion */}
        {openPill && (
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden animate-fade-in">
            {(!limitToOneQuestion || !hasAnswered) ? (
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
            ) : (
              <div className="w-full flex items-center px-4 py-3 bg-muted/50">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {openPill}
                </span>
              </div>
            )}

            <div
              ref={(el) => (scrollRefs.current[openPill] = el)}
              className="px-4 py-4 space-y-3 bg-background"
            >
              {(threads[openPill] ?? []).map((t, i) => (
                <Bubble key={i} turn={t} typewriter={typewriter} onJoinCtaClick={onJoinCtaClick} limitToOneQuestion={limitToOneQuestion} advisorAvatar={advisorAvatar} advisorName={advisorName} />
              ))}
              {loadingKey === openPill && <Typing advisorAvatar={advisorAvatar} advisorName={advisorName} />}
            </div>
          </div>
        )}

        {/* Freeform thread display */}
        {freeThread.length > 0 && (
          <div
            ref={freeRef}
            className="rounded-xl border border-border bg-background p-4 space-y-3"
          >
            {freeThread.map((t, i) => (
              <Bubble key={i} turn={t} typewriter={typewriter} onJoinCtaClick={onJoinCtaClick} limitToOneQuestion={limitToOneQuestion} advisorAvatar={advisorAvatar} advisorName={advisorName} />
            ))}
            {loadingKey === "__free__" && <Typing advisorAvatar={advisorAvatar} advisorName={advisorName} />}
          </div>
        )}

        {/* Freeform input or warm handoff */}
        {limitToOneQuestion && hasAnswered ? (
          <div className="pt-3 border-t border-border space-y-3">
            <p className="text-sm text-foreground">
              That is one piece of what the challenge helps you work through. Join to get the full guidance built around your situation.
            </p>
            <Button
              onClick={onJoinCtaClick}
              className="w-full gap-2 rounded-xl font-semibold tracking-tight shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
            >
              Join the 3-Day Challenge today
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground mb-2">ASK A QUESTION</p>
            <div className="rounded-xl border border-border bg-card p-3">
              <DictatedTextarea
                value={freeform}
                onChange={(e) => setFreeform(e.target.value)}
                placeholder="Ask one more question"
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
                <Button
                  onClick={runFree}
                  disabled={loadingKey !== null || !freeform.trim()}
                  className="h-8 rounded-full px-3 text-xs font-semibold gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Bubble = ({ turn, typewriter, onJoinCtaClick, limitToOneQuestion, advisorAvatar, advisorName }: { turn: Turn; typewriter?: boolean; onJoinCtaClick?: () => void; limitToOneQuestion?: boolean; advisorAvatar?: string | null; advisorName?: string }) => {
  const [typingDone, setTypingDone] = useState(!typewriter);

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

  const showCta = onJoinCtaClick && typingDone && !limitToOneQuestion;

  const advisorInitial = (advisorName || "?").charAt(0).toUpperCase();

  return (
    <div className="flex justify-start gap-2">
      {advisorAvatar ? (
        <img
          src={advisorAvatar}
          alt={`${advisorName || "AI"} avatar`}
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
      ) : advisorAvatar === null || advisorAvatar === "" ? (
        <div className="h-7 w-7 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold ring-1 ring-border">
          {advisorInitial}
        </div>
      ) : (
        <img
          src={johnnyAvatar}
          alt="Johnny AI"
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
      )}
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground">
        {typewriter ? (
          <TypewriterText text={turn.text} onDone={() => setTypingDone(true)} />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{turn.text}</ReactMarkdown>
          </div>
        )}
        {showCta && (
          <Button
            size="sm"
            onClick={onJoinCtaClick}
            className="mt-3 w-full gap-2 rounded-xl font-semibold tracking-tight shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 animate-fade-in"
          >
            Join the 3-Day Challenge today
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const TYPING_SPEED_MS = 18;

const TypewriterText = ({ text, onDone }: { text: string; onDone?: () => void }) => {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  const doneRef = useRef(false);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (doneRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      doneRef.current = true;
      setDone(true);
      onDoneRef.current?.();
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        doneRef.current = true;
        setDone(true);
        onDoneRef.current?.();
      }
    }, TYPING_SPEED_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleSkip = () => {
    if (doneRef.current) return;
    setShown(text);
    doneRef.current = true;
    setDone(true);
    onDoneRef.current?.();
  };

  return (
    <span onClick={handleSkip} className={done ? "" : "cursor-pointer"}>
      {shown}
      {!done && (
        <span className="ml-0.5 inline-block h-[0.9em] w-[2px] animate-pulse bg-foreground/40 align-[-0.12em]" />
      )}
    </span>
  );
};

const Typing = ({ advisorAvatar, advisorName }: { advisorAvatar?: string | null; advisorName?: string }) => {
  const advisorInitial = (advisorName || "?").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {advisorAvatar ? (
        <img src={advisorAvatar} alt={`${advisorName || "AI"} avatar`} className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
      ) : advisorAvatar === null || advisorAvatar === "" ? (
        <div className="h-7 w-7 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold ring-1 ring-border">
          {advisorInitial}
        </div>
      ) : (
        <img src={johnnyAvatar} alt="Johnny AI" className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
      )}
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    </div>
  );
};

export default LearningAssistant;
