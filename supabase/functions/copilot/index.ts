import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_DEFAULT =
  "I don't have an answer for that yet. Try one of the suggested questions below.";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
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
      return new Response(JSON.stringify({ response: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normPrompt = normalize(prompt);
    const promptTokens = new Set(tokenize(prompt));

    let answer: string | null = null;

    // 1. Exact (normalized) question match
    for (const r of rows ?? []) {
      if (normalize(r.question) === normPrompt) {
        answer = r.answer;
        break;
      }
    }

    // 2. Keyword scoring
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
        // Also score against question tokens
        for (const t of tokenize(r.question)) {
          if (promptTokens.has(t)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestAnswer = r.answer;
        }
      }
      if (bestScore >= 2) answer = bestAnswer;
    }

    return new Response(JSON.stringify({ response: answer ?? fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("copilot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
