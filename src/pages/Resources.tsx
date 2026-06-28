import { useMemo, useState } from "react";
import { BookOpen, Check, CheckSquare, ClipboardList, Copy, Download, FileDown, FileText, HelpCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { downloadQuizAsDocx } from "@/lib/downloadQuizDocx";
import { openQuizInGoogleDocs } from "@/lib/downloadQuizGdoc";
import { questions as leadGenQuestions } from "@/lib/assessmentData";

function buildQuizPlainText(quiz: {
  quizTitle?: string;
  heroProblemShort?: string;
  questions?: Array<{ text: string; scoring?: { low?: string; mid?: string; high?: string } }>;
  tiers?: { low?: { name: string; description: string }; mid?: { name: string; description: string }; high?: { name: string; description: string } };
}): string {
  const lines: string[] = [];
  lines.push((quiz.quizTitle || "Your diagnostic quiz").trim());
  lines.push("");
  if (quiz.heroProblemShort) {
    lines.push(quiz.heroProblemShort);
    lines.push("");
  }
  lines.push("Questions");
  lines.push("");
  (quiz.questions || []).forEach((q, i) => {
    lines.push(`${i + 1}. ${q.text || ""}`);
    const opts: Array<["low" | "mid" | "high", string]> = [["low", "A"], ["mid", "B"], ["high", "C"]];
    opts.forEach(([t, label]) => {
      const txt = q.scoring?.[t];
      if (txt) lines.push(`   ${label}. ${txt}`);
    });
    lines.push("");
  });
  if (quiz.tiers) {
    lines.push("Result tiers");
    lines.push("");
    (["low", "mid", "high"] as const).forEach((t) => {
      const tier = quiz.tiers?.[t];
      if (!tier) return;
      lines.push(`${t.toUpperCase()} — ${tier.name || ""}`);
      if (tier.description) lines.push(tier.description);
      lines.push("");
    });
  }
  lines.push("© 2026 LeadTree");
  return lines.join("\n");
}

interface Resource {
  icon: typeof BookOpen;
  title: string;
  description: string;
  filename: string;
  body: string;
}

const RESOURCES: Resource[] = [
  {
    icon: ClipboardList,
    title: "Challenge Planning Worksheet",
    description: "Define your audience, outcome, format, and daily structure on one page.",
    filename: "challenge-planning-worksheet.txt",
    body: `CHALLENGE PLANNING WORKSHEET\n\n1. Who is this challenge for?\n2. What outcome will participants get by the end?\n3. What is the challenge name?\n4. How many days will it run?\n5. What does each day look like?\n   - Day 1:\n   - Day 2:\n   - Day 3:\n6. How will you keep people accountable?\n7. What is the next step you offer at the end?`,
  },
  {
    icon: CheckSquare,
    title: "Challenge Mistakes Checklist",
    description: "The most common reasons first challenges flop — and how to avoid each one.",
    filename: "challenge-mistakes-checklist.txt",
    body: `CHALLENGE MISTAKES CHECKLIST\n\n[ ] Outcome is unclear\n[ ] Too many daily tasks\n[ ] No daily reminders\n[ ] No community or shared space\n[ ] No clear next step at the end\n[ ] Onboarding takes longer than 5 minutes\n[ ] No celebration of wins\n[ ] Promoted only once before launch`,
  },
  {
    icon: BookOpen,
    title: "Challenge Structure Guide",
    description: "A simple template for building a transformation-driven 3-day challenge.",
    filename: "challenge-structure-guide.txt",
    body: `CHALLENGE STRUCTURE GUIDE\n\nDay 1 — Belief Shift\n  Goal: Change how participants think about the problem.\n  Task: A small, fast win they can complete in <20 minutes.\n\nDay 2 — Skill Build\n  Goal: Give them a tool or framework to apply.\n  Task: Apply the tool to their own situation.\n\nDay 3 — Public Result\n  Goal: Help them ship something visible.\n  Task: Share their result with the group.`,
  },
  {
    icon: Rocket,
    title: "Challenge Launch Checklist",
    description: "Everything to have ready before doors open.",
    filename: "challenge-launch-checklist.txt",
    body: `CHALLENGE LAUNCH CHECKLIST\n\n[ ] Landing page live\n[ ] Signup form tested\n[ ] Welcome email written\n[ ] Daily prompts written\n[ ] Reminder messages scheduled\n[ ] Community space set up\n[ ] Kickoff post drafted\n[ ] Next-step offer ready\n[ ] Tracking in place for signups and completion`,
  },
];

const Resources = () => {
  const { state } = useAppState();
  const rawQuiz = state.challenge.aiOutputs?.day2_s2_quiz;

  const quizFallback = {
    quizTitle: "Lead Gen Quiz",
    questions: leadGenQuestions.map((q) => ({
      text: q.text,
      scoring: {
        low: q.options[0]?.label,
        mid: q.options[1]?.label,
      },
    })),
  };

  const downloadQuiz = async (format: "docx" | "gdoc") => {
    try {
      if (format === "docx") {
        await downloadQuizAsDocx(rawQuiz, quizFallback);
        toast.success("Downloaded");
      } else {
        await openQuizInGoogleDocs(rawQuiz, quizFallback);
        toast.success("Quiz copied. Paste (Ctrl/Cmd+V) into the new Google Doc.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Couldn't open Google Docs right now.");
    }
  };

  const quizPlainText = useMemo(() => {
    let parsed: any = null;
    if (rawQuiz) {
      try { parsed = typeof rawQuiz === "string" ? JSON.parse(rawQuiz) : rawQuiz; } catch {}
    }
    return buildQuizPlainText(parsed && Array.isArray(parsed.questions) && parsed.questions.length ? parsed : quizFallback);
  }, [rawQuiz]);

  const [quizCopied, setQuizCopied] = useState(false);
  const copyQuizText = async () => {
    try {
      await navigator.clipboard.writeText(quizPlainText);
      setQuizCopied(true);
      toast.success("Quiz copied to clipboard");
      setTimeout(() => setQuizCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the text and copy manually.");
    }
  };

  const download = (r: Resource) => {
    const blob = new Blob([r.body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">Resources</h1>
        <p className="mt-2 text-sm text-muted-foreground">Free guides and checklists to help you plan and run your first challenge.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:col-span-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-black text-foreground">Your Lead Gen Quiz</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Download your diagnostic quiz, or copy the plain text below to paste anywhere.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button onClick={() => downloadQuiz("docx")} variant="outline" className="w-full gap-2">
              <FileDown className="h-4 w-4" /> Word doc
            </Button>
            <Button onClick={() => downloadQuiz("gdoc")} variant="outline" className="w-full gap-2">
              <FileText className="h-4 w-4" /> Google Doc
            </Button>
            <Button onClick={copyQuizText} variant="outline" className="w-full gap-2">
              {quizCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {quizCopied ? "Copied" : "Copy plain text"}
            </Button>
          </div>
          <pre className="mt-4 max-h-72 overflow-auto rounded-xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono">
{quizPlainText}
          </pre>
        </article>

        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <article key={r.title} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">{r.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
              <Button onClick={() => download(r)} variant="outline" className="mt-4 w-full gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
            </article>
          );
        })}
      </div>
    </main>
  );
};

export default Resources;
