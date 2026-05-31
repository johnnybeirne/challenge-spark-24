// Tidy Phrase – lightly cleans up grammar / capitalisation of a short user
// fragment so it reads well when echoed back inside a sentence. Preserves
// meaning, voice and length. Returns plain text only.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You lightly clean up short fragments of text so they read naturally inside a sentence.

Rules:
- Fix obvious grammar, spelling and missing apostrophes (e.g. "cant" -> "can't", "dont" -> "don't").
- Keep the user's exact meaning, voice and roughly the same length. Do NOT rewrite or embellish.
- Return a sentence FRAGMENT — no leading capital unless it's a proper noun, no trailing period.
- Do not add quotes, markdown, prefixes, explanations, or commentary.
- If the fragment is already fine, return it unchanged.
- Never add new ideas, examples, or words that aren't implied by the input.
- Output the cleaned fragment only. Nothing else.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, context } = await req.json();
    const raw = typeof text === "string" ? text.trim() : "";
    if (!raw) {
      return new Response(JSON.stringify({ text: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (raw.length > 200) {
      // Don't touch long sentences — only fragments.
      return new Response(JSON.stringify({ text: raw }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const ctx = typeof context === "string" && context ? `Context: ${context}\n\n` : "";
    const userMsg = `${ctx}Fragment to clean:\n${raw}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("tidy-phrase gateway error", res.status, txt);
      // Fail soft — return original so UI never breaks.
      return new Response(JSON.stringify({ text: raw }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let cleaned = (data?.choices?.[0]?.message?.content ?? "").trim();
    // Strip wrapping quotes and trailing punctuation that don't belong in a fragment.
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "").replace(/[.!?,;:]+$/g, "").trim();
    if (!cleaned) cleaned = raw;
    // Safety: never let the model balloon length.
    if (cleaned.length > raw.length * 2 + 20) cleaned = raw;

    return new Response(JSON.stringify({ text: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tidy-phrase error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
