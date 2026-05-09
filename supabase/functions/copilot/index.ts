import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_DEFAULT =
  "I don't have an answer for that yet. Try one of the suggested questions below.";

function withMemory(answer: string, memoryContext?: string): string {
  if (!memoryContext || !memoryContext.trim()) return answer;
  return `${memoryContext}\n\nHere’s the next step:\n\n${answer}`;
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
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8)
    .map((w) => `${w}:*`)
    .join(" | ");
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
  const source = top.source ?? "Leadio Blueprint";
  return `${top.content}\n\n_Answer powered by Leadio Blueprint — ${source}_`;
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
    try {
      const { data: cfg } = await sb
        .from("copilot_config")
        .select("fallback_message")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cfg?.fallback_message && typeof cfg.fallback_message === "string" && cfg.fallback_message.trim()) {
        fallback = cfg.fallback_message;
      }
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
    let source: "qa-exact" | "kb" | "qa" | "fallback" = "fallback";

    // 1. Exact (normalized) question match — highest confidence
    for (const r of rows ?? []) {
      if (normalize(r.question) === normPrompt) {
        answer = r.answer;
        source = "qa-exact";
        break;
      }
    }

    // 2. Knowledge-base retrieval — Leadio frameworks are the primary intelligence layer
    if (!answer) {
      const docs = await retrieveKb(sb, prompt, stage);
      if (docs.length > 0) {
        answer = formatKbAnswer(docs);
        source = "kb";
      }
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

    return new Response(
      JSON.stringify({
        response: withMemory(answer ?? fallback, memoryContext),
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
