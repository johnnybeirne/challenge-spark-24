interface QuizQuestion {
  id?: number;
  text: string;
  scoring?: { low?: string; mid?: string; high?: string };
}

interface QuizTier {
  name: string;
  description: string;
}

interface QuizDraft {
  quizTitle?: string;
  heroProblemShort?: string;
  questions?: QuizQuestion[];
  tiers?: { low?: QuizTier; mid?: QuizTier; high?: QuizTier };
}

function parseQuiz(raw: string | undefined | null): QuizDraft | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as QuizDraft;
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildQuizContent(quiz: QuizDraft): { html: string; text: string } {
  const title = (quiz.quizTitle || "Your diagnostic quiz").trim();
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  htmlParts.push(`<h1>${escapeHtml(title)}</h1>`);
  textParts.push(title);
  textParts.push("");

  if (quiz.heroProblemShort) {
    htmlParts.push(`<p><i>${escapeHtml(quiz.heroProblemShort)}</i></p>`);
    textParts.push(quiz.heroProblemShort);
    textParts.push("");
  }

  htmlParts.push(`<h2>Questions</h2>`);
  textParts.push("Questions");
  textParts.push("");

  (quiz.questions || []).forEach((q, idx) => {
    htmlParts.push(
      `<p><b>${idx + 1}.</b> ${escapeHtml(q.text || "")}</p>`,
    );
    textParts.push(`${idx + 1}. ${q.text || ""}`);
    const opts: Array<["low" | "mid" | "high", string]> = [
      ["low", "A"],
      ["mid", "B"],
      ["high", "C"],
    ];
    const liItems: string[] = [];
    opts.forEach(([t, label]) => {
      const txt = q.scoring?.[t];
      if (!txt) return;
      liItems.push(`<li><b>${label}.</b> ${escapeHtml(txt)}</li>`);
      textParts.push(`   ${label}. ${txt}`);
    });
    if (liItems.length) htmlParts.push(`<ul>${liItems.join("")}</ul>`);
    textParts.push("");
  });

  if (quiz.tiers) {
    htmlParts.push(`<h2>Result tiers</h2>`);
    textParts.push("Result tiers");
    textParts.push("");
    (["low", "mid", "high"] as const).forEach((t) => {
      const tier = quiz.tiers?.[t];
      if (!tier) return;
      htmlParts.push(
        `<p><b>${t.toUpperCase()} — ${escapeHtml(tier.name || "")}</b></p>`,
      );
      textParts.push(`${t.toUpperCase()} — ${tier.name || ""}`);
      if (tier.description) {
        htmlParts.push(`<p>${escapeHtml(tier.description)}</p>`);
        textParts.push(tier.description);
      }
      textParts.push("");
    });
  }

  htmlParts.push(`<p>© 2026 LeadTree</p>`);
  textParts.push("© 2026 LeadTree");

  return { html: htmlParts.join(""), text: textParts.join("\n") };
}

/**
 * Copies the quiz to the clipboard as rich text and opens a blank Google Doc
 * in a new tab so the user can paste it. True .gdoc creation requires
 * per-user OAuth, which we don't have here.
 */
export async function openQuizInGoogleDocs(
  rawQuiz: string | undefined | null,
  fallback?: QuizDraft | null,
): Promise<void> {
  const quiz =
    parseQuiz(rawQuiz) ??
    (fallback &&
    Array.isArray(fallback.questions) &&
    fallback.questions.length > 0
      ? fallback
      : null);
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error("No quiz available yet.");
  }

  const { html, text } = buildQuizContent(quiz);

  // Open immediately so the popup isn't blocked (must happen in the user gesture).
  const win = window.open("https://docs.google.com/document/create", "_blank");

  try {
    if (
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard &&
      "write" in navigator.clipboard
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error("Clipboard not available");
    }
  } catch {
    if (!win) {
      throw new Error(
        "Allow popups and clipboard access to send the quiz to Google Docs.",
      );
    }
    throw new Error(
      "Couldn't copy automatically — paste manually into the new Google Doc.",
    );
  }
}
