// day2-thread — Lovable AI calls for Day 2's "What is quiz marketing" screen.
//
// Moment 1: "explain" — Johnny delivers a personalised explanation of quiz
//   marketing grounded in the app KB (Section 1 Purpose & Positioning and
//   Section 2 Core Psychology), weaving in the builder's first name, audience,
//   superpower and problem from Day 1.
//
// Moment 2: "positioning" — Johnny composes ONE positioning sentence specific
//   to the builder's audience and superpower that they can edit inline.
//
// Both moments fall back gracefully on rate-limit / payment / model errors so
// the UI is never blocked.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const JOHNNY_VOICE = `You are Johnny Beirne, an Irish business coach guiding a builder through Day 2 of their 3-day challenge.
Voice: warm, direct, plain-spoken. No corporate speak. No emojis. No exclamation marks unless natural.
Never invent facts about the user, their audience, or their challenge. Use only what they told you.`;

// Source material — Sections 1 and 2 from the Leadio Interactive Quiz &
// Assessment Marketing Blueprint. Used as the sole reference for the
// explanation so Johnny never drifts off-doctrine.
const KB_SECTIONS = `SECTION 1 — PURPOSE & POSITIONING
Good marketing joins a conversation somebody is already having with themselves. A great interactive assessment steps into that conversation at the right moment in the buying journey. In under three minutes, it listens, measures, and returns a personalised strategy with one clear action — no forks, no maze.
Traditional lead magnets are one-size-fits-all. A generic PDF tells someone what to do, gets saved with a dozen others, and sits forgotten in a downloads folder.
An interactive quiz shows your audience where they stand as individual people, why it matters, and exactly what to do next. It turns zero-party data into immediate empathy: "Here's what you told us. Here's what that means. Here's the next smart move for someone in your position."
B2B audiences are driven by optimisation, risk mitigation and competitive benchmarking — an assessment replaces discovery calls with instant clarity.
B2C audiences are driven by identity validation, self-discovery and curated recommendations — the assessment guides them to a tailored next step.
Why it works across markets: frictionless micro-commitments, hyper-individual results, asymmetrical insight from explicit choices, and motivational pull toward an achievable future.

SECTION 2 — CORE PSYCHOLOGY
Every decision is driven by three forces. When aligned, they produce clarity and conviction without sales pressure.
1. Present State (Pain): the participant's current reality — what they have right now that they no longer want. Uncovered through observable behaviours, not opinions.
2. Preferred Future (Pleasure): what success looks like in practical terms over the next 30 to 90 days. When mapped visually, engagement rises.
3. Pitfalls (Constraints): what is actually preventing progress — often without the participant realising it. The Expert Axis: people are qualified to describe their pain and their desired future, but not qualified to diagnose their own systemic problem. Your quiz reveals the pitfalls — that is where your authority lands.
Tension is the motivational pull created when someone sees their current reality, their desired reality and the obstacles in between. People invest to resolve tension, not stress. The quiz is the mirror that makes the next step feel achievable.
Belief shift mechanics: open with the mindset that mirrors the voice in their head; name the contrast between what they want and what they want to stop; handle objections by asking about them; anchor identity tiers with progress-oriented labels.`;

const sanitise = (s: unknown, max = 600): string => {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
};

async function callGateway(body: Record<string, unknown>): Promise<Response> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fallback(reason: string, status = 200): Response {
  return new Response(
    JSON.stringify({ fallback: true, reason }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

interface ExplainInputs {
  firstName?: string;
  audience?: string;
  superpower?: string;
  problem?: string;
}

async function handleExplain(inputs: ExplainInputs): Promise<Response> {
  const firstName = sanitise(inputs.firstName, 40);
  const audience = sanitise(inputs.audience);
  const superpower = sanitise(inputs.superpower);
  const problem = sanitise(inputs.problem);

  const userPrompt = [
    "Source material — use ONLY the ideas, language and frameworks below. Do not invent extra concepts:",
    KB_SECTIONS,
    "",
    "About the builder you are talking to:",
    firstName ? `- First name: ${firstName}` : null,
    audience ? `- Their audience (their words): ${audience}` : null,
    superpower ? `- Their superpower (their words): ${superpower}` : null,
    problem ? `- The problem their audience is stuck on (their words): ${problem}` : null,
    "",
    "Write a personalised explanation of what quiz marketing is and why it works specifically for THIS builder.",
    "Constraints:",
    "- 4 to 6 short paragraphs. Spoken-word rhythm, not bullet lists.",
    "- Open the FIRST paragraph by naturally using the first name once.",
    "- Weave the audience, superpower and problem through the explanation in their own words — do not paraphrase those nouns.",
    "- Anchor the substance in Section 1 (purpose & positioning) and Section 2 (present state, preferred future, pitfalls, tension, expert axis).",
    "- Land on why this beats a generic PDF for THEIR audience and THEIR superpower.",
    "- Plain text. No headings. No emojis. No exclamation marks unless natural. Do not wrap in quotes.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  if (resp.status === 429) return fallback("rate-limited");
  if (resp.status === 402) return fallback("payment-required");
  if (!resp.ok) {
    console.error("gateway error", resp.status, await resp.text());
    return fallback("gateway-error");
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return fallback("empty-response");
  const cleaned = text.replace(/^["'`]+|["'`]+$/g, "").trim();
  return new Response(
    JSON.stringify({ text: cleaned }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

interface PositioningInputs {
  firstName?: string;
  audience?: string;
  superpower?: string;
  problem?: string;
}

async function handlePositioning(inputs: PositioningInputs): Promise<Response> {
  const audience = sanitise(inputs.audience);
  const superpower = sanitise(inputs.superpower);
  const problem = sanitise(inputs.problem);

  if (!audience || !superpower) return fallback("missing-inputs");

  const userPrompt = [
    "Builder's audience (their words): " + audience,
    "Builder's superpower (their words): " + superpower,
    problem ? "Problem their audience is stuck on: " + problem : null,
    "",
    "Write ONE positioning sentence (max 30 words) in this shape:",
    "\"My quiz helps [audience] [diagnose / discover / see] [specific tension tied to the problem] so they can [preferred future], powered by [superpower].\"",
    "Use the builder's own words for audience and superpower — do not paraphrase those nouns.",
    "Plain text only. One sentence. Ends with a full stop. Do not wrap in quotes.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  if (resp.status === 429) return fallback("rate-limited");
  if (resp.status === 402) return fallback("payment-required");
  if (!resp.ok) {
    console.error("gateway error", resp.status, await resp.text());
    return fallback("gateway-error");
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return fallback("empty-response");
  const cleaned = text.replace(/^["'`]+|["'`]+$/g, "").trim();
  return new Response(
    JSON.stringify({ text: cleaned }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  let payload: { moment?: string; inputs?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const moment = payload?.moment;
  const inputs = (payload?.inputs ?? {}) as Record<string, unknown>;
  try {
    if (moment === "explain") return await handleExplain(inputs as ExplainInputs);
    if (moment === "positioning") return await handlePositioning(inputs as PositioningInputs);
    return new Response(
      JSON.stringify({ error: `Unknown moment: ${moment}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("day2-thread fatal", err);
    return fallback("server-error");
  }
});
