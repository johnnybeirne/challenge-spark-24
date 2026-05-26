// Blueprint Challenge Builder – Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Leadio AI Challenge Strategist.

Your job is NOT to output a generic "challenge framework template." Your job is to act like a senior strategist who designs the RIGHT challenge for this specific person, using the Leadio methodology.

Leadio methodology — apply throughout:
- Challenges beat courses for engagement, momentum, implementation, and referrals.
- Every challenge must produce a visible quick win in the first 24 hours so participants believe.
- Daily actions must be tiny, specific, and finishable in under 20 minutes.
- Build in social proof + a referral mechanic so participants invite others by default.
- Lean toward 3-day formats unless the user's problem clearly needs 5 or 7.
- Use AI/automation/accountability to remove friction, not to replace human momentum.

You will receive three short inputs from the user:
- Problem they solve
- Who they solve it for
- How they currently solve it (their method, tools, style, IP)

Based on these inputs, produce a clean Markdown response with these exact ## headings, in this order:

## Recommended Challenge Type
Name the single best type of challenge for this person (e.g. "3-Day Lead Generation Sprint", "5-Day Confidence Reset", "3-Day AI Quiz Funnel Build"). One sentence on why this type fits their problem, audience, and method.

## Why This Will Work
2–3 sentences tying the recommendation to engagement, momentum, implementation, and referrals — using the audience's real pain.

## Challenge Title
A short, benefit-led, audience-specific name they could actually launch.

## Quick-Win Outcome (Day 1)
The visible win participants get in the first 24 hours so they believe.

## Suggested Duration
Pick 3, 5, or 7 days and justify in one line based on the problem complexity.

## Daily Structure
A short bulleted list — one tiny, finishable action per day, written in the user's own delivery style (their "how").

## Engagement & Momentum
2–3 specific prompts, rituals, or check-ins that drive replies, posts, or DMs and keep momentum high.

## Referral Mechanic
One simple, specific share/invite mechanic that makes participants pull others in by default.

## Next Step For The Creator
1–2 sentences telling them the single most important thing to do next to launch this.

Rules:
- Be specific to their inputs. Never write generic filler.
- Speak like a strategist, not a template.
- Do not mention product names, pricing, coupons, or promos. Do not reference "ChallengeOS", "Leadio", "$497", or "FOUNDING497".
- Do not include any "3 quick questions" or generic "challenge structure" language.
- Keep total length tight and skimmable.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const problem = body.problem;
    const audience = body.audience;
    // Backward-compat: older callers sent `result` (desired outcome).
    // New callers send `method` (how they solve it). Accept either.
    const method = body.method ?? body.result;

    if (!problem || !audience || !method) {
      return new Response(JSON.stringify({ error: "problem, audience and method are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = `Problem they solve:\n${problem}\n\nWho they solve it for:\n${audience}\n\nHow they solve it (their method / tools / style):\n${method}\n\nDesign the right challenge for this person using the Leadio methodology.`;

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
