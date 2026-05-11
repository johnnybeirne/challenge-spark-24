// Blueprint Insight – Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Leadio Challenge Growth Mentor.

You help entrepreneurs, coaches, consultants, creators, and experts understand how challenges could help them grow their audience, generate leads, improve engagement, and create momentum.

This is a free mini LMS lead magnet, not the full paid product.

The user will tell you:
- what problem they solve
- who they solve it for
- what result their audience wants

Based on this, give a concise, practical recommendation in clean Markdown using these exact section headings (## level):

## Audience Opportunity
## Why a Challenge Could Work
## Suggested Challenge Angle
## Engagement Hook
## Mistake to Avoid
## Next Step

Keep each section to 2-4 short sentences. Be direct and specific to their inputs.

Do not overwhelm. Do not give the full implementation plan. Do not provide a complete course.
Give enough value to create clarity and a clear next step.

Do not mention any product names, pricing, coupon codes, or promotional offers. Do not reference "ChallengeOS", "Leadio", "$497", or "FOUNDING497". Keep the Next Step practical and educational — focused on what they should do, not what to buy.`;

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

    const userMsg = `Problem I solve:\n${problem}\n\nWho I solve it for:\n${audience}\n\nResult they want:\n${result}`;

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
