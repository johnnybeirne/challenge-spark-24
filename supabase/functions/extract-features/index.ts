// extract-features — admin tool. Accepts a codebase manifest from the client
// (file path + truncated source), forwards it to Claude (Anthropic), and
// returns features categorized as Essential (core user flow) or Advanced
// (admin / CMS / mechanics).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior product engineer auditing the LeadBead / Leadio codebase.

You will receive a manifest of source files (path + truncated content) covering:
- React components (src/components)
- Hooks (src/hooks)
- Library/utility code (src/lib)
- Pages / routes (src/pages)
- Supabase edge functions (supabase/functions)

Your job: extract every distinct component-level feature you can identify, then categorize each one:
- "essential" = part of the core user flow (signup -> assessment -> day 1/2/3 completion -> referral / community unlock -> rewards). Anything an end-user touches to complete the 3-day challenge.
- "advanced" = admin, CMS, owner console, analytics, partner/JV ops, payouts, QA tools, internal mechanics that enable but are not part of the end-user flow.

For each feature provide:
- "name": short title (3-7 words), e.g. "72-Hour Challenge Countdown"
- "description": one sentence, plain English, what it does for the user/admin
- "category": "essential" | "advanced"
- "connects": array of 2-4 OTHER feature names from your own list that share state, data models, or user flow

Rules:
- Derive features ONLY from the manifest. Do not invent.
- 18-30 features total is ideal. Merge near-duplicates.
- "connects" must reference exact names you also output.
- Output STRICT JSON ONLY (no prose, no markdown fences), exactly this shape:
{
  "features": [
    { "name": "...", "description": "...", "category": "essential", "connects": ["...", "..."] }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { manifest } = await req.json();
    if (typeof manifest !== "string" || manifest.length < 200) {
      return new Response(JSON.stringify({ error: "Invalid manifest" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = manifest.length > 180_000 ? manifest.slice(0, 180_000) + "\n...[truncated]" : manifest;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Codebase manifest follows. Extract features now and return ONLY the JSON object described.\n\n${trimmed}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("extract-features anthropic error", res.status, txt);
      const msg =
        res.status === 429
          ? "Rate limit reached. Try again shortly."
          : res.status === 401
          ? "Invalid Anthropic API key."
          : `Anthropic error ${res.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text: string =
      (Array.isArray(data?.content) && data.content.map((b: any) => b?.text || "").join("")) || "";

    // Extract JSON object even if model wrapped it
    let parsed: any = { features: [] };
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (e) {
        console.error("extract-features parse error", e, text.slice(0, 500));
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-features error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
