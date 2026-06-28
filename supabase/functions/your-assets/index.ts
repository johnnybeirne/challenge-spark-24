// Your Assets — generates 3 archetype-specific strengths the user already has
// that will help them build an evergreen challenge.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You return strict JSON only. No prose, no markdown fences.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const archetype: string = String(body.archetype || "").slice(0, 80);
    const score: number = Number(body.score) || 0;

    if (!archetype) {
      return new Response(JSON.stringify({ error: "Missing archetype" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = `The user has completed a lead generation quiz. Their archetype is ${archetype} and their score is ${score}%. Based on this, identify 3 specific strengths they already have that will help them build an evergreen challenge. Each asset should have a short title (3-5 words) and one sentence explaining why this strength is an advantage for building a challenge, quiz entry point, or referral loop. Be specific and direct. Do not use generic business language. Return JSON only: {"assets":[{"title":"...","description":"..."}]}`;

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
      console.error("your-assets gateway error", res.status, txt);
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
    let parsed: { assets?: Array<{ title: string; description: string }> } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const assets = Array.isArray(parsed.assets) ? parsed.assets.slice(0, 3) : [];

    return new Response(JSON.stringify({ assets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("your-assets error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
