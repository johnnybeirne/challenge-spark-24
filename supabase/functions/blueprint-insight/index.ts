// Blueprint Challenge Builder – Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Leadio Mini Challenge Builder.

You help entrepreneurs, coaches, consultants, creators, and experts design a simple mini challenge framework that drives engagement, momentum, and quick wins for their audience.

This is a free mini LMS lead magnet, not the full paid product.

The user will tell you:
- the problem their audience wants to solve
- who the challenge is for
- the transformation or outcome the audience wants

Based on this, generate a clear, practical mini challenge framework in clean Markdown using these exact section headings (## level):

## Challenge Title
## Challenge Goal
## Quick-Win Outcome
## Suggested Duration
## Simple Daily Actions
## Engagement & Reflection Prompts
## Accountability Ideas
## Referral / Share Mechanic

Guidance per section:
- Challenge Title: a short, catchy, benefit-led name.
- Challenge Goal: 1-2 sentences on what the participant achieves by the end.
- Quick-Win Outcome: the small result they get on day 1 to build belief.
- Suggested Duration: pick a sensible length (e.g. 3, 5, or 7 days) and say why.
- Simple Daily Actions: a short bulleted list, one tiny action per day.
- Engagement & Reflection Prompts: 2-3 prompt ideas to spark replies, posts, or DMs.
- Accountability Ideas: lightweight ways to keep people on track (check-ins, streaks, partners).
- Referral / Share Mechanic: one simple idea that makes participants invite others.

Keep it concise, specific to their inputs, and easy to act on. Do not write a full course. Do not overwhelm.

Do not mention any product names, pricing, coupon codes, or promotional offers. Do not reference "ChallengeOS", "Leadio", "$497", or "FOUNDING497".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { problem, audience, result } = await req.json();
    if (!problem || !audience || !result) {
      return new Response(JSON.stringify({ error: "problem, audience and result are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = `Problem the audience wants to solve:\n${problem}\n\nWho the challenge is for:\n${audience}\n\nTransformation or outcome they want:\n${result}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
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
      console.error("Gateway error", res.status, txt);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gateway ${res.status}`);
    }

    const data = await res.json();
    const insight = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blueprint-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
