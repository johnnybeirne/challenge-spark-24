// AI Advisor Panel — generates 3 personalised, actionable insights for the
// user based on their assessment answers. Returns plain JSON for easy
// rendering on the client.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Leadio AI Advisor — a senior lead-generation strategist.

You will receive:
- The user's first name
- Their diagnostic score (0–100) and tier (Starter / Builder / Operator / Strategist)
- Their answers to a short lead-flow assessment, with the questions they answered "No" or weakly to

Your job: return exactly 3 short, personalised, actionable insights that speak directly to THIS person, tied to their weakest answers. Each insight should be ~2 sentences.

Output strict JSON only, no prose, in this exact shape:
{
  "insights": [
    { "title": "<5–8 word headline>", "body": "<1–2 sentence insight, second person, specific>" },
    { "title": "...", "body": "..." },
    { "title": "...", "body": "..." }
  ]
}

Rules:
- Speak in second person ("you").
- Reference their actual gaps, not generic advice.
- No marketing fluff, no emojis, no "as the Leadio AI Advisor" intros.
- Never mention pricing, products, or upsells.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const firstName: string = String(body.firstName || "there").slice(0, 40);
    const score: number = Number(body.score) || 0;
    const tier: string = String(body.tier || "Starter").slice(0, 40);
    const weakAnswers: Array<{ question: string; answer: string }> = Array.isArray(body.weakAnswers)
      ? body.weakAnswers.slice(0, 8)
      : [];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = `First name: ${firstName}
Diagnostic score: ${score}/100
Tier: ${tier}

Weakest answers:
${weakAnswers.map((w, i) => `${i + 1}. Q: ${w.question}\n   A: ${w.answer}`).join("\n") || "(none provided)"}

Return the JSON now.`;

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
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("advisor-insight gateway error", res.status, txt);
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
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { insights?: Array<{ title: string; body: string }> } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [];

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("advisor-insight error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
