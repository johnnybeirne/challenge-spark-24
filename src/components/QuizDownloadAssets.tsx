import { useMemo } from "react";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadQuizAsDocx } from "@/lib/downloadQuizDocx";
import { openQuizInGoogleDocs } from "@/lib/downloadQuizGdoc";

function parseQuizForDownload(raw: string | undefined | null): boolean {
  if (!raw) return false;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return !!(parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0);
  } catch {
    return false;
  }
}

export function QuizDownloadAssets({ rawQuiz }: { rawQuiz: string | undefined | null }) {
  const isValid = useMemo(() => parseQuizForDownload(rawQuiz), [rawQuiz]);
  if (!isValid) return null;

  const handleWord = async () => {
    try {
      await downloadQuizAsDocx(rawQuiz);
    } catch {
      toast.error("Generate your quiz first, then download it.");
    }
  };

  const handleGdoc = async () => {
    try {
      await openQuizInGoogleDocs(rawQuiz);
      toast.success("Quiz copied. Paste (Ctrl/Cmd+V) into the new Google Doc.");
    } catch {
      toast.error("Generate your quiz first, then download it.");
    }
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Your Quiz
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleWord}
          className="text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-2">
            <FileDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[14px] font-bold text-foreground">Your Quiz as a Word doc</p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Download your generated quiz as a Word document.
          </p>
        </button>
        <button
          type="button"
          onClick={handleGdoc}
          className="text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[14px] font-bold text-foreground">Your Quiz as a Google Doc</p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Copy your quiz straight into a new Google Doc.
          </p>
        </button>
      </div>
    </div>
  );
}

export default QuizDownloadAssets;
