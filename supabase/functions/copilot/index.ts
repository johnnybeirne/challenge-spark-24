import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_DEFAULT =
  "I couldn't find a matching answer in my library. Try rephrasing your question or tap one of the suggestions below.";

const FORBIDDEN_FALLBACK_ENDING =
  "I don't have an answer for that yet. Try one of the suggested questions below.";

function withMemory(answer: string, memoryContext?: string): string {
  if (!memoryContext || !memoryContext.trim()) return answer;
  return `${memoryContext}\n\nHere’s the next step:\n\n${answer}`;
}

function ensureNoForbiddenFallback(response: string): string {
  const trimmed = response.trim();
  if (trimmed.endsWith(FORBIDDEN_FALLBACK_ENDING)) {
    return (
      trimmed.slice(0, -FORBIDDEN_FALLBACK_ENDING.length).trim() +
      "\n\n" +
      FALLBACK_DEFAULT
    );
  }
  return response;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter((w) => w.length > 2);
}

function buildTsQuery(q: string): string {
  // websearch_to_tsquery accepts plain words separated by spaces
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8)
    .join(" ");
}

async function retrieveKb(sb: any, query: string, stage?: string) {
  const tsq = buildTsQuery(query);
  const stageList = stage && stage !== "all" ? [stage, "all"] : null;
  if (!tsq) return [];
  let q = sb
    .from("kb_documents")
    .select("slug,title,content,tags,stage,source")
    .eq("is_active", true)
    .textSearch("search_tsv", tsq, { type: "websearch", config: "english" })
    .limit(2);
  if (stageList) q = q.in("stage", stageList);
  const { data, error } = await q;
  if (error) {
    console.error("kb retrieve error:", error);
    return [];
  }
  return data ?? [];
}

function formatKbAnswer(docs: any[]): string {
  if (!docs.length) return "";
  const top = docs[0];
  const source = top.source ?? "LeadTree Blueprint";
  return `${top.content}\n\n_Answer powered by LeadTree Blueprint — ${source}_`;
}

// Generates a genuine strategist answer via Lovable AI, grounded in the LeadTree
// knowledge base + Q&A library. Used when no stored answer matches, so distinct
// prompts no longer collapse to the same canned fallback.
async function generateAiAnswer(
  prompt: string,
  memoryContext: string | undefined,
  kbDocs: any[],
  qaRows: any[],
  configuredSystemPrompt?: string | null,
  maxTokens?: number | null,
): Promise<string | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  const kbContext = kbDocs
    .map((d) => `# ${d.title}\n${String(d.content).slice(0, 2000)}`)
    .join("\n\n");
  const qaContext = qaRows
    .slice(0, 25)
    .map((r) => `Q: ${r.question}\nA: ${String(r.answer).slice(0, 400)}`)
    .join("\n\n");

  const HARDCODED_FALLBACK_INSTRUCTIONS = [
    "You are the LeadTree challenge strategist. You coach people building a 3-day challenge.",
    "Answer only the specific question asked. Do not explain the whole system.",
    "Maximum 3 short paragraphs. One sentence per paragraph. No exceptions.",
    "Every sentence must be its own paragraph. Never put two sentences in the same paragraph. Always add a blank line between sentences.",
    "Never use bold markdown. Never use bullet points. Never use dashes for lists.",
    "Never say you don't have an answer. Give your best practical guidance.",
    "If you reference the knowledge base, pick one relevant point only. Do not summarise everything.",
  ];

  // Database value, when present, is the SOLE base instruction. It replaces the
  // hardcoded array entirely (never appended to it).
  const dbPrompt = typeof configuredSystemPrompt === "string" ? configuredSystemPrompt.trim() : "";
  const baseInstructions = dbPrompt ? [dbPrompt] : HARDCODED_FALLBACK_INSTRUCTIONS;
  const effectiveMaxTokens = typeof maxTokens === "number" && maxTokens > 0 ? maxTokens : 200;
  console.log(
    "copilot ai config:",
    JSON.stringify({
      systemPromptSource: dbPrompt ? "copilot_config" : "hardcoded-fallback",
      systemPromptChars: baseInstructions.join("\n").length,
      maxTokens: effectiveMaxTokens,
      maxTokensSource: typeof maxTokens === "number" && maxTokens > 0 ? "copilot_config" : "default",
    }),
  );

  const system = baseInstructions.concat([
    memoryContext ? `Context about this builder:\n${memoryContext}` : "",
    kbContext ? `One relevant excerpt from the LeadTree knowledge base:\n${kbContext}` : "",
  ]).filter(Boolean).join("\n\n");

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        max_tokens: effectiveMaxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("ai gateway error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.replace(/\*\*/g, "").trim() : null;
  } catch (e) {
    console.error("ai generate failed:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, memoryContext, stage } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase env not configured");
    }
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Load fallback message
    let fallback = FALLBACK_DEFAULT;
    let cfgSystemPrompt: string | null = null;
    let cfgMaxTokens: number | null = null;
    try {
      const { data: cfg } = await sb
        .from("copilot_config")
        .select("fallback_message, system_prompt, max_tokens")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cfg?.fallback_message && typeof cfg.fallback_message === "string" && cfg.fallback_message.trim()) {
        fallback = cfg.fallback_message;
      }
      if (cfg?.system_prompt && typeof cfg.system_prompt === "string") {
        cfgSystemPrompt = cfg.system_prompt;
      }
      if (cfg?.max_tokens) cfgMaxTokens = Number(cfg.max_tokens);
    } catch (e) {
      console.error("fallback fetch failed:", e);
    }

    // Load Q&A library
    const { data: rows, error: qaErr } = await sb
      .from("copilot_qa")
      .select("question, answer, keywords")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (qaErr) {
      console.error("qa fetch failed:", qaErr);
    }

    const normPrompt = normalize(prompt);
    const promptTokens = new Set(tokenize(prompt));

    let answer: string | null = null;
    let source: "qa-exact" | "kb" | "qa" | "ai" | "fallback" = "fallback";

    // 1. Exact (normalized) question match — highest confidence
    for (const r of rows ?? []) {
      if (normalize(r.question) === normPrompt) {
        answer = r.answer;
        source = "qa-exact";
        break;
      }
    }

    // 2. Knowledge-base retrieval — LeadTree frameworks are the primary intelligence layer
    const kbDocs = answer ? [] : await retrieveKb(sb, prompt, stage);
    if (!answer && kbDocs.length > 0) {
      answer = formatKbAnswer(kbDocs);
      source = "kb";
    }

    // 3. Keyword-scored QA fallback
    if (!answer) {
      let bestScore = 0;
      let bestAnswer: string | null = null;
      for (const r of rows ?? []) {
        const kws: string[] = Array.isArray(r.keywords) ? r.keywords : [];
        let score = 0;
        for (const kw of kws) {
          const k = normalize(String(kw));
          if (!k) continue;
          if (normPrompt.includes(k)) score += 2;
        }
        for (const t of tokenize(r.question)) {
          if (promptTokens.has(t)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestAnswer = r.answer;
        }
      }
      if (bestScore >= 2) {
        answer = bestAnswer;
        source = "qa";
      }
    }

    // 4. AI strategist — generate a real answer instead of repeating the fallback
    if (!answer) {
      const aiAnswer = await generateAiAnswer(prompt, memoryContext, kbDocs, rows ?? [], cfgSystemPrompt, cfgMaxTokens);
      if (aiAnswer) {
        answer = aiAnswer;
        source = "ai";
      }
    }

    const rawResponse = source === "ai"
      ? (answer as string)
      : withMemory(answer ?? fallback, memoryContext);
    const response = ensureNoForbiddenFallback(rawResponse);


    return new Response(
      JSON.stringify({
        response,
        source,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("copilot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
