// day1-thread — Lovable AI calls for the two key threading moments in Day 1.
//
// Moment 1: "problem-reaction" — after the user describes the audience's problem,
//   Johnny returns ONE short sentence acknowledging it in their own words.
//
// Moment 2: "promise" — after all answers are captured, Johnny composes a 3-4
//   line summary + a single Challenge Promise sentence, using the user's exact
//   words. Returned as structured output via tool calling.
//
// Both moments fall back gracefully: on rate limit / payment / model error the
// client receives `{ fallback: true }` and uses the existing template copy so
// the flow is never blocked.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

// Johnny's voice — kept consistent across both moments.
const JOHNNY_VOICE = `You are Johnny Beirne, an Irish business coach guiding a builder through designing their 3-day challenge.
Voice: warm, direct, plain-spoken. No corporate speak. No emojis. No exclamation marks unless natural.
Never invent facts about the user, their audience, or their challenge. Use only what they told you.`;

interface ProblemInputs {
  firstName?: string;
  audience?: string;
  problem?: string;
}

interface PromiseInputs {
  firstName?: string;
  audience?: string; // step 1 — broad audience
  superpower?: string; // step 10 — what the builder does better than anyone
  topicHint?: string; // step 6 — trigger moment
  problem?: string;
  how?: string;
  outcome?: string;
  challengeTypeLabel?: string;
}

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
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function fallback(reason: string, status = 200): Response {
  return new Response(
    JSON.stringify({ fallback: true, reason }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handleProblemReaction(inputs: ProblemInputs): Promise<Response> {
  const audience = sanitise(inputs.audience);
  const problem = sanitise(inputs.problem);
  const firstName = sanitise(inputs.firstName, 40);

  if (!problem) return fallback("missing-problem");

  const userPrompt = [
    firstName ? `Builder's first name: ${firstName}` : null,
    audience ? `Their audience: ${audience}` : null,
    `The specific problem this audience faces, in the builder's own words:\n"""${problem}"""`,
    "",
    "Write ONE short reaction sentence (max 25 words) that:",
    "- quotes or closely paraphrases their exact pain language so they feel heard",
    "- acknowledges what makes it hard — without giving advice, solutions, or asking a question",
    "- sounds like Johnny said it out loud, not written copy",
    "",
    "Plain text only. No quotation marks around the whole reply. Do not start with the builder's name.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  if (resp.status === 429) return fallback("rate-limited", 200);
  if (resp.status === 402) return fallback("payment-required", 200);
  if (!resp.ok) {
    console.error("gateway error", resp.status, await resp.text());
    return fallback("gateway-error", 200);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return fallback("empty-response");

  // Strip wrapping quotes if the model added them.
  const cleaned = text.replace(/^["'`]+|["'`]+$/g, "").trim();
  return new Response(
    JSON.stringify({ text: cleaned }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handlePromise(inputs: PromiseInputs): Promise<Response> {
  const audience = sanitise(inputs.audience);
  const trigger = sanitise(inputs.topicHint);
  const superpower = sanitise(inputs.superpower);
  const problem = sanitise(inputs.problem);
  const how = sanitise(inputs.how);
  const outcome = sanitise(inputs.outcome);
  const firstName = sanitise(inputs.firstName, 40);
  const challengeTypeLabel = sanitise(inputs.challengeTypeLabel, 80);

  if (!audience || !problem || !how || !outcome) {
    return fallback("missing-inputs");
  }

  const userPrompt = [
    firstName ? `Builder's first name: ${firstName}` : null,
    `Audience (their words): ${audience}`,
    trigger ? `Trigger moment — what makes the 3 days the right time (their words): ${trigger}` : null,
    `Problem the audience is stuck on (their words): ${problem}`,
    `Process — how the builder takes them through it (their words): ${how}`,
    `Outcome — what they walk away with after Day 3 (their words): ${outcome}`,
    challengeTypeLabel ? `Challenge shape: ${challengeTypeLabel}` : null,
    "",
    "Use the compose_challenge_promise tool to return:",
    "1. summary: 3 to 4 short sentences in Johnny's voice that reflect what the builder told you back. Use their literal words for the audience, problem, process, and outcome — do not paraphrase the nouns. Address the builder as 'you'.",
    "2. promise: ONE sentence in this exact shape: 'Help [audience] move from [pain] to [outcome] by [process].' Use the builder's own words for each bracketed slot. Keep under 35 words. End with a full stop.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    tools: [
      {
        type: "function",
        function: {
          name: "compose_challenge_promise",
          description: "Compose the Day 1 challenge summary and one-line promise.",
          parameters: {
            type: "object",
            properties: {
              summary: {
                type: "array",
                items: { type: "string" },
                description: "3 to 4 short Johnny-voice sentences reflecting the builder's answers.",
                minItems: 3,
                maxItems: 4,
              },
              promise: {
                type: "string",
                description: "One-sentence Challenge Promise using the builder's own words.",
              },
            },
            required: ["summary", "promise"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "compose_challenge_promise" },
    },
  });

  if (resp.status === 429) return fallback("rate-limited", 200);
  if (resp.status === 402) return fallback("payment-required", 200);
  if (!resp.ok) {
    console.error("gateway error", resp.status, await resp.text());
    return fallback("gateway-error", 200);
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  const argsStr = toolCall?.function?.arguments;
  if (!argsStr) return fallback("no-tool-call");

  let parsed: { summary?: string[]; promise?: string };
  try {
    parsed = JSON.parse(argsStr);
  } catch (e) {
    console.error("tool args parse failed", e, argsStr);
    return fallback("tool-args-parse-failed");
  }

  const summary = Array.isArray(parsed.summary)
    ? parsed.summary.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 4)
    : [];
  const promise = typeof parsed.promise === "string" ? parsed.promise.trim() : "";

  if (summary.length < 2 || !promise) return fallback("incomplete-tool-output");

  return new Response(
    JSON.stringify({ summary, promise }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
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
    if (moment === "problem-reaction") {
      return await handleProblemReaction(inputs as ProblemInputs);
    }
    if (moment === "promise") {
      return await handlePromise(inputs as PromiseInputs);
    }
    return new Response(
      JSON.stringify({ error: `Unknown moment: ${moment}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("day1-thread fatal", err);
    return fallback("server-error", 200);
  }
});
