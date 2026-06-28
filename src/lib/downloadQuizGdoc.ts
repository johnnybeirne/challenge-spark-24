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

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "quiz"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Downloads quiz as an HTML file that Google Docs imports cleanly
 * when uploaded to Google Drive (auto-converts to Google Doc).
 */
export async function downloadQuizAsGoogleDoc(
  rawQuiz: string | undefined | null,
  fallback?: QuizDraft | null,
) {
  const quiz =
    parseQuiz(rawQuiz) ??
    (fallback &&
    Array.isArray(fallback.questions) &&
    fallback.questions.length > 0
      ? fallback
      : null);
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error("No quiz available to download yet.");
  }

  const title = (quiz.quizTitle || "Your diagnostic quiz").trim();
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(title)}</h1>`);
  if (quiz.heroProblemShort) {
    parts.push(`<p><em>${escapeHtml(quiz.heroProblemShort)}</em></p>`);
  }

  parts.push(`<h2>Questions</h2>`);
  quiz.questions.forEach((q, idx) => {
    parts.push(
      `<p><strong>${idx + 1}.</strong> ${escapeHtml(q.text || "")}</p>`,
    );
    const opts: Array<["low" | "mid" | "high", string]> = [
      ["low", "A"],
      ["mid", "B"],
      ["high", "C"],
    ];
    const items = opts
      .map(([t, label]) => {
        const txt = q.scoring?.[t];
        if (!txt) return "";
        return `<li><strong>${label}.</strong> ${escapeHtml(txt)}</li>`;
      })
      .filter(Boolean)
      .join("");
    if (items) parts.push(`<ul>${items}</ul>`);
  });

  if (quiz.tiers) {
    parts.push(`<h2>Result tiers</h2>`);
    (["low", "mid", "high"] as const).forEach((t) => {
      const tier = quiz.tiers?.[t];
      if (!tier) return;
      parts.push(
        `<p><strong>${t.toUpperCase()} — ${escapeHtml(tier.name || "")}</strong></p>`,
      );
      if (tier.description) {
        parts.push(`<p>${escapeHtml(tier.description)}</p>`);
      }
    });
  }

  parts.push(
    `<hr/><p style="text-align:center;color:#888;font-size:10pt;">© 2026 LeadTree</p>`,
  );

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
</head>
<body>
${parts.join("\n")}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
