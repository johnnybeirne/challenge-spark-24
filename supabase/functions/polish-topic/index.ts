// Polish Topic – turns the user's raw Day 1 problem (and optional audience / method)
// into a clean 2–4 word noun phrase used as the personalised challenge topic,
// e.g. "Lead Generation", "Client Outreach", "Course Launch".
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You name a 3-day builder challenge topic in 2 to 4 words.

You will receive a PROBLEM the builder solves, plus optional AUDIENCE and METHOD context.

Rules:
- Return a SHORT noun phrase, 2 to 4 words, in Title Case.
- It should read naturally as the blank in "Your ___ Challenge" (e.g. "Lead Generation", "Client Outreach", "Course Launch", "Sales Pipeline", "Email List Growth").
- Use real nouns. Do NOT start with a verb. Do NOT include filler words like "the", "a", "your".
- Do NOT include the word "Challenge" in your answer.
- Preserve the user's meaning. Do NOT invent new ideas.
- Output the phrase ONLY. No quotes, no markdown, no punctuation, no commentary.`;

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { problem, audience, method } = await req.json();
    const p = (problem || "").toString().trim();
    if (!p) {
      return new Response(JSON.stringify({ error: "Missing problem" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const parts = [
      `PROBLEM: ${p}`,
      audience ? `AUDIENCE: ${audience}` : "",
      method ? `METHOD: ${method}` : "",
    ].filter(Boolean).join("\n");

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
          { role: "user", content: parts },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("polish-topic gateway error", res.status, txt);
      return new Response(JSON.stringify({ topic: "" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let cleaned = (data?.choices?.[0]?.message?.content ?? "").trim();
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "").replace(/[.!?]+$/g, "").trim();
    // Strip stray "Challenge" suffix if model added it anyway.
    cleaned = cleaned.replace(/\s+challenge$/i, "").trim();
    // Clamp to 4 words.
    const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 4);
    const topic = titleCase(words.join(" "));

    return new Response(JSON.stringify({ topic }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("polish-topic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
