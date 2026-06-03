// Polish Promise – rewrites the assembled Day 1 Challenge Promise into clean,
// natural English while preserving the user's meaning and the
// "Help [who] move from [pain] to [result] through [method]." shape.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You polish a Challenge Promise into one clean, natural English sentence.

You will be given four fragments: WHO (audience), PAIN (current struggle), RESULT (desired outcome), METHOD (how).

Rules:
- Return ONE sentence in the shape: Help <who> move from "<pain>" to <result> through <method>.
- The PAIN fragment MUST be wrapped in straight double quotes ("...") exactly as the user phrased it (you may fix only obvious typos/casing inside the quotes, but keep their wording).
- Fix grammar, capitalisation, articles, pronouns and obvious typos in the rest of the sentence so it reads naturally.
- Preserve the user's meaning and voice. Do NOT invent new ideas, examples or details.
- Keep it concise — roughly the same length as the raw input combined.
- Lowercase the RESULT and METHOD fragments unless they contain a proper noun.
- Use "their" / "them" naturally if pronouns are inconsistent.
- Output the sentence ONLY. No markdown, no commentary, no prefix. Do NOT wrap the whole sentence in quotes — only the pain phrase.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { who, pain, result, method } = await req.json();
    const w = (who || "").toString().trim();
    const p = (pain || "").toString().trim();
    const r = (result || "").toString().trim();
    const m = (method || "").toString().trim();

    if (!w || !p || !r || !m) {
      return new Response(JSON.stringify({ error: "Missing fragments" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const fallback = `Help ${w} move from ${p} to ${r} through ${m}.`;

    const userMsg = `WHO: ${w}\nPAIN: ${p}\nRESULT: ${r}\nMETHOD: ${m}`;

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
      console.error("polish-promise gateway error", res.status, txt);
      if (res.status === 429 || res.status === 402) {
        return new Response(JSON.stringify({ text: fallback, error: res.status === 429 ? "rate_limited" : "payment_required" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ text: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let cleaned = (data?.choices?.[0]?.message?.content ?? "").trim();
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "").trim();
    if (!cleaned) cleaned = fallback;
    if (!/[.!?]$/.test(cleaned)) cleaned += ".";

    return new Response(JSON.stringify({ text: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("polish-promise error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
