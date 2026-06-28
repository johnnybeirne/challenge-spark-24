import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

type Tier = "low" | "mid" | "high";

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

export async function downloadQuizAsDocx(rawQuiz: string | undefined | null) {
  const quiz = parseQuiz(rawQuiz);
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error("No quiz available to download yet.");
  }

  const title = (quiz.quizTitle || "Your diagnostic quiz").trim();
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true })],
    }),
  );

  if (quiz.heroProblemShort) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: quiz.heroProblemShort, italics: true }),
        ],
        spacing: { after: 200 },
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "Questions", bold: true })],
    }),
  );

  quiz.questions.forEach((q, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true }),
          new TextRun({ text: q.text || "" }),
        ],
      }),
    );

    const tiers: Tier[] = ["low", "mid", "high"];
    tiers.forEach((t) => {
      const label = t === "low" ? "A" : t === "mid" ? "B" : "C";
      const optionText = q.scoring?.[t] ?? "";
      if (!optionText) return;
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${label}. `, bold: true }),
            new TextRun({ text: optionText }),
          ],
        }),
      );
    });
  });

  if (quiz.tiers) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320 },
        children: [new TextRun({ text: "Result tiers", bold: true })],
      }),
    );

    (["low", "mid", "high"] as Tier[]).forEach((t) => {
      const tier = quiz.tiers?.[t];
      if (!tier) return;
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({
              text: `${t.toUpperCase()} — ${tier.name || ""}`,
              bold: true,
            }),
          ],
        }),
      );
      if (tier.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: tier.description })],
          }),
        );
      }
    });
  }

  const doc = new Document({
    creator: "Leadio",
    title,
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(title)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
