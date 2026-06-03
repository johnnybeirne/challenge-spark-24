// Polish Audience – rewrites a messy audience answer (e.g. "speakers trainers
// authors coaches") into a clean, natural English noun phrase
// (e.g. "speakers, trainers, authors, and coaches").
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You polish a short "who I work with" answer into clean, natural English.

Rules:
- Return a SHORT noun phrase that names the audience the user serves.
- If the user listed multiple groups separated only by spaces, join them with proper commas and "and" (e.g. "speakers, trainers, authors, and coaches").
- Fix obvious typos, lowercase the words unless they are proper nouns.
- Preserve the user's meaning. Do NOT invent new audiences or examples.
- Keep it concise — usually under 12 words.
- Do NOT add a sentence, period, or any framing words like "I work with" or "my audience is".
- Output the phrase ONLY. No quotes, no markdown, no commentary, no trailing punctuation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audience, audienceType } = await req.json();
    const a = (audience || "").toString().trim();
    if (!a) {
      return new Response(JSON.stringify({ audience: "" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const typeContext =
      audienceType === "b2b"
        ? "Context: this audience is businesses or professionals."
        : audienceType === "b2c"
          ? "Context: this audience is individual consumers."
          : "";

    const userMsg = [typeContext, `RAW: ${a}`].filter(Boolean).join("\n");

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
      console.error("polish-audience gateway error", res.status, txt);
      return new Response(JSON.stringify({ audience: a }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let cleaned = (data?.choices?.[0]?.message?.content ?? "").trim();
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "").replace(/[.!?]+$/g, "").trim();
    if (!cleaned) cleaned = a;

    return new Response(JSON.stringify({ audience: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("polish-audience error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
