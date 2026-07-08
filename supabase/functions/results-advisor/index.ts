// Results Advisor — answers a quiz taker's question on the Results page using
// the knowledge base, tailors framing to their archetype, and gently steers
// them toward the 3-Day Challenge.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KbDoc {
  slug: string;
  title: string;
  content: string;
}

function buildTsQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8)
    .join(" ");
}

const CONTEXT_CHAR_BUDGET = 6000;

function buildContext(docs: KbDoc[]): string {
  let out = "";
  for (const d of docs) {
    const block = `# ${d.title}\n${d.content}\n\n`;
    if (out.length + block.length > CONTEXT_CHAR_BUDGET) {
      const remaining = CONTEXT_CHAR_BUDGET - out.length;
      if (remaining > 200) out += block.slice(0, remaining);
      break;
    }
    out += block;
  }
  return out.trim();
}

const SYSTEM_PROMPT = `You are the Leadio Results Advisor, answering a quiz taker's question right after they see their diagnostic result.

Rules:
- Answer using only the provided knowledge base context. Do not invent facts that are not supported by the context.
- If the context does not cover the question, say so briefly and honestly, then point them to the 3-Day Challenge as the place to work it out properly.
- Tailor the framing to their archetype label (Pioneer, Architect, or Authority) so the advice is pitched at their stage.
  - Pioneer: early, still figuring out attention and offer. Speak to clarity, first traction, avoiding overwhelm.
  - Architect: has some traction, needs structure and repeatable flow. Speak to systems, sequencing, tightening the machine.
  - Authority: established, needs leverage and compounding. Speak to positioning, referrals, scaling what already works.
- Voice: warm, direct, plain-spoken. No corporate speak. No emojis. No exclamation marks unless truly natural. Do not use em dashes.
- Keep answers short and punchy: at most two short paragraphs, ideally three to five sentences total. No long multi-paragraph responses.
- Give one clear, useful insight that answers the question, then close with a single natural sentence steering them toward the 3-Day Challenge.
- Diagnose the issue and point the way forward rather than fully solving the problem. Be genuinely useful, but leave the depth for the challenge.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const question: string = String(body.question || "").trim().slice(0, 1000);
    const archetypeTier: string = String(body.archetypeTier || "low");
    const archetypeLabel: string = String(body.archetypeLabel || "Pioneer");

    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Retrieve KB context using the same approach as kb-search
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const tsq = buildTsQuery(question);
    let docs: KbDoc[] = [];

    if (tsq) {
      const { data, error } = await sb
        .from("kb_documents")
        .select("slug,title,content")
        .eq("is_active", true)
        .textSearch("search_tsv", tsq, { type: "websearch", config: "english" })
        .limit(3);
      if (error) console.error("results-advisor fts error:", error);
      docs = data ?? [];
    }

    if (docs.length === 0) {
      const { data } = await sb
        .from("kb_documents")
        .select("slug,title,content")
        .eq("is_active", true)
        .ilike("title", `%${question.split(" ")[0] ?? question}%`)
        .limit(3);
      docs = data ?? [];
    }

    const context = buildContext(docs);

    const userMsg = `Archetype tier: ${archetypeTier}
Archetype label: ${archetypeLabel}

Their question:
${question}

Knowledge base context:
${context || "(no matching context found)"}

Answer them now, following all the rules.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("results-advisor gateway error", res.status, txt);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gateway ${res.status}`);
    }

    const data = await res.json();
    const answer: string = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    return new Response(
      JSON.stringify({ answer, sources: docs.map((d) => ({ slug: d.slug, title: d.title })) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("results-advisor error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
