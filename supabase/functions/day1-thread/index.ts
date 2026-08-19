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

// Owner-editable prompts live in public.day1_ai_config (read at runtime, the
// same way day2-thread reads day2_ai_config). The constants below are only a
// last-resort guard if that row cannot be read.
const DEFAULT_VOICE = `You are Johnny Beirne, an Irish business coach guiding a builder through designing their 3-day challenge.
Voice: warm, direct, plain-spoken. No corporate speak. No emojis. No exclamation marks unless natural.
Never invent facts about the user, their audience, or their challenge. Use only what they told you.`;

interface Day1AiConfig {
  voice_prompt: string;
  reaction_prompt: string;
  promise_prompt: string;
}

async function loadAiConfig(): Promise<Day1AiConfig> {
  const empty = { voice_prompt: "", reaction_prompt: "", promise_prompt: "" };
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return empty;
    const resp = await fetch(
      `${url}/rest/v1/day1_ai_config?select=voice_prompt,reaction_prompt,promise_prompt&order=updated_at.desc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!resp.ok) return empty;
    const rows = await resp.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return empty;
    return {
      voice_prompt: typeof row.voice_prompt === "string" ? row.voice_prompt : "",
      reaction_prompt: typeof row.reaction_prompt === "string" ? row.reaction_prompt : "",
      promise_prompt: typeof row.promise_prompt === "string" ? row.promise_prompt : "",
    };
  } catch (e) {
    console.error("day1_ai_config load failed", e);
    return empty;
  }
}


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

  const cfg = await loadAiConfig();
  const reactionInstructions =
    cfg.reaction_prompt.trim() ||
    [
      "Write ONE short reaction sentence (max 25 words) that:",
      "- quotes or closely paraphrases their exact pain language so they feel heard",
      "- acknowledges what makes it hard, without giving advice, solutions, or asking a question",
      "- sounds like Johnny said it out loud, not written copy",
      "",
      "Plain text only. No quotation marks around the whole reply. Do not start with the builder's name.",
    ].join("\n");

  const userPrompt = [
    firstName ? `Builder's first name: ${firstName}` : null,
    audience ? `Their audience: ${audience}` : null,
    `The specific problem this audience faces, in the builder's own words:\n"""${problem}"""`,
    "",
    reactionInstructions,
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: cfg.voice_prompt.trim() || DEFAULT_VOICE },
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

// --- Knowledge base retrieval ------------------------------------------------
// Targeted single document load. Only the promise writing reference is read,
// and only for promise generation. It is method guidance, never output text.
const PROMISE_REFERENCE_SLUG = "promise-writing-reference";

async function fetchPromiseReference(): Promise<string> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return "";
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const sb = createClient(url, key);

    const { data, error } = await sb
      .from("kb_documents")
      .select("content")
      .eq("slug", PROMISE_REFERENCE_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data?.content) return "";
    return String(data.content).slice(0, 6000);
  } catch (e) {
    console.error("promise reference load failed", e);
    return "";
  }
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

  const reference = await fetchPromiseReference();

  const echoGuard = reference
    ? [
        "PRIVATE METHOD REFERENCE. The material below teaches you HOW to construct a four part transformation promise.",
        "It is method guidance you learn from. It is never text you repeat.",
        "You must build this promise fresh, from this specific participant's own answers.",
        "Never copy, quote, or lightly reword any example, phrase or line from the reference.",
        "Every example field in the reference is a pattern to learn from, not content to reuse.",
        "Never mention the reference and never hint that it exists.",
        "The participant's own audience, problem, outcome and method are the source of the actual words.",
        "",
        reference,
        "",
        "END OF PRIVATE METHOD REFERENCE.",
        "",
      ].join("\n")
    : null;

  const userPrompt = [
    echoGuard,
    firstName ? `Builder's first name: ${firstName}` : null,

    `Audience (their words): ${audience}`,
    superpower ? `Builder's superpower, what they do better than anyone (their words): ${superpower}` : null,
    trigger ? `Trigger moment, what makes the 3 days the right time (their words): ${trigger}` : null,
    `Problem the audience is stuck on (their words): ${problem}`,
    `Process, how the builder takes them through it (their words): ${how}`,
    `Outcome, what they walk away with after Day 3 (their words): ${outcome}`,
    challengeTypeLabel ? `Challenge shape: ${challengeTypeLabel}` : null,
    "",
    "Use the compose_challenge_promise tool to return:",
    "1. summary: 3 to 4 short sentences in Johnny's voice that reflect what the builder told you back. Use their literal words for the audience, problem, process, and outcome. Do not paraphrase the nouns. Address the builder as 'you'.",
    "2. fromState: the audience's current state with the problem, written in the builder's own words. A short phrase of 4 to 14 words. No quotation marks, no full stop, no dashes of any kind.",
    "3. toState: the audience's future state after the transformation, written in the builder's own words, reflecting the outcome and how the builder helps. A short phrase of 4 to 16 words. No quotation marks, no full stop, no dashes of any kind.",
    "4. soThat: the deeper payoff the audience gets from the transformation, one level below the surface result, written in the builder's own words. A short phrase of 4 to 16 words. No quotation marks, no full stop, no dashes of any kind.",
    "5. andStop: the pain that ends for the audience, ending with either the words 'from happening' or the words 'from continuing', whichever fits. Example shape only: quiet weeks from continuing. A short phrase of 4 to 16 words. No quotation marks, no full stop, no dashes of any kind.",
    "6. promise: the four parts joined as a single plain sentence in this exact shape: from [fromState] to [toState] so that [soThat] and stop [andStop]. Nothing before the word from and nothing after the andStop.",
    "All four parts describe the audience, never the builder. All four parts are always required and the and stop part is never omitted.",
    "Write fromState, toState, soThat and andStop in the third person, describing the audience as 'they' and 'their'. Never address the audience as 'you' or 'your' in those four parts.",

    "Hard rules: never use a hyphen, an en dash or an em dash anywhere in your output. Never use the word 'once'. No jargon, no buzzwords, no marketing speak. Plain, warm, human language written for this specific participant, using the answers they gave.",
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
              fromState: {
                type: "string",
                description: "The audience's current state with the problem, in the builder's own words. No quotes, no dashes.",
              },
              toState: {
                type: "string",
                description: "The audience's future state after the transformation, in the builder's own words. No quotes, no dashes.",
              },
              soThat: {
                type: "string",
                description: "The deeper payoff the audience gets, one level below the surface result, in the builder's own words. No quotes, no dashes.",
              },
              andStop: {
                type: "string",
                description: "The pain that ends for the audience, ending with 'from happening' or 'from continuing'. No quotes, no dashes.",
              },
              promise: {
                type: "string",
                description: "The four parts joined as: from [fromState] to [toState] so that [soThat] and stop [andStop].",
              },
            },
            required: ["summary", "fromState", "toState", "soThat", "andStop", "promise"],
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

  let parsed: { summary?: string[]; promise?: string; fromState?: string; toState?: string; soThat?: string; andStop?: string };
  try {
    parsed = JSON.parse(argsStr);
  } catch (e) {
    console.error("tool args parse failed", e, argsStr);
    return fallback("tool-args-parse-failed");
  }

  // Strip any dash characters the model may still emit, plus stray quotes.
  const tidy = (s: string) =>
    s
      .replace(/[\u2010-\u2015\u2212-]+/g, " ")
      .replace(/["'`]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\.$/, "")
      .trim();

  const summary = Array.isArray(parsed.summary)
    ? parsed.summary.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 4)
    : [];
  const fromState = typeof parsed.fromState === "string" ? tidy(parsed.fromState) : "";
  const toState = typeof parsed.toState === "string" ? tidy(parsed.toState) : "";
  const soThat = typeof parsed.soThat === "string" ? tidy(parsed.soThat) : "";
  let andStop = typeof parsed.andStop === "string" ? tidy(parsed.andStop) : "";
  // The and stop part always closes with one of the two allowed endings.
  if (andStop && !/\bfrom (happening|continuing)$/i.test(andStop)) {
    andStop = `${andStop} from continuing`;
  }

  if (summary.length < 2 || !fromState || !toState || !soThat || !andStop) {
    return fallback("incomplete-tool-output");
  }

  const promise = `from "${fromState}" to "${toState}" so that "${soThat}" and stop "${andStop}"`;

  return new Response(
    JSON.stringify({ summary, promise, fromState, toState, soThat, andStop }),
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
