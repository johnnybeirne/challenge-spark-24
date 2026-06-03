// day2-thread — Lovable AI calls for Day 2 Screen 1.
//
// Moment 1: "opener" — Johnny's two-sentence personalised opening message.
// Moment 2: "buttons" — five short button labels, each grounded in the
//   builder's own Day 1 data (audience / superpower / problem / how / outcome)
//   and directly related to quiz marketing.
// Moment 3: "insight" — a two-to-three sentence personalised insight
//   answering one button, sourced from the KB.
//
// All moments fall back gracefully on rate-limit / payment / model errors so
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

// Source material — Leadio Interactive Quiz & Assessment Marketing Blueprint,
// Sections 1 (Purpose & Positioning) and 2 (Core Psychology). All Day 2
// Screen 1 content must stay inside this doctrine.
const KB = `SECTION 1 — PURPOSE & POSITIONING
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

const stripQuotes = (s: string) => s.replace(/^["'`]+|["'`]+$/g, "").trim();

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

function fallback(reason: string, extra: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({ fallback: true, reason, ...extra }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

interface Day1Inputs {
  firstName?: string;
  audience?: string;
  superpower?: string;
  problem?: string;
  how?: string;
  outcome?: string;
  expertType?: unknown;
  expertTypePhrase?: string;
}

function formatExpertTypes(arr: string[]): string {
  const lower = arr.map((v) => v.toLowerCase());
  if (lower.length === 0) return "";
  if (lower.length === 1) return lower[0];
  if (lower.length === 2) return `${lower[0]} and ${lower[1]}`;
  return `${lower.slice(0, -1).join(", ")}, and ${lower[lower.length - 1]}`;
}

function builderProfile(inputs: Day1Inputs) {
  const rawExpert = Array.isArray(inputs.expertType)
    ? (inputs.expertType as unknown[]).map((v) => sanitise(v, 40)).filter(Boolean)
    : [];
  const expertPhrase = sanitise(inputs.expertTypePhrase, 200) || formatExpertTypes(rawExpert);
  return {
    firstName: sanitise(inputs.firstName, 40),
    audience: sanitise(inputs.audience),
    superpower: sanitise(inputs.superpower),
    problem: sanitise(inputs.problem),
    how: sanitise(inputs.how),
    outcome: sanitise(inputs.outcome),
    expertTypes: rawExpert,
    expertPhrase,
  };
}

// ---------- OPENER ----------
async function handleOpener(inputs: Day1Inputs): Promise<Response> {
  const { firstName, audience } = builderProfile(inputs);
  const fbText = `${firstName ? `${firstName}, ` : ""}here is the shift that changes everything about how you bring in ${audience || "your audience"}. Quiz marketing meets them inside the conversation they are already having with themselves, then hands them one clear next step.`;

  const prompt = [
    "Source material — only use these ideas:",
    KB,
    "",
    "Builder:",
    firstName ? `- First name: ${firstName}` : null,
    audience ? `- Their audience (their words): ${audience}` : null,
    "",
    "Write Johnny's spoken opener for Day 2 Screen 1.",
    "Constraints:",
    "- EXACTLY two sentences.",
    "- The FIRST sentence MUST begin with the first name followed by a comma.",
    "- Mention their audience using their own words (do not paraphrase that noun).",
    "- Set up that quiz marketing is about joining the conversation already in their audience's head.",
    "- Plain text. No headings. No emojis. No exclamation marks unless natural. Do not wrap in quotes.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
  });

  if (resp.status === 429) return fallback("rate-limited", { text: fbText });
  if (resp.status === 402) return fallback("payment-required", { text: fbText });
  if (!resp.ok) {
    console.error("opener gateway error", resp.status, await resp.text());
    return fallback("gateway-error", { text: fbText });
  }
  const data = await resp.json();
  const text = stripQuotes(data?.choices?.[0]?.message?.content?.trim() || "");
  if (!text) return fallback("empty-response", { text: fbText });
  return new Response(
    JSON.stringify({ text }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// ---------- BUTTONS ----------
const BUTTON_TOPICS = [
  { key: "audience_fit", anchor: "audience" },
  { key: "problem_gap", anchor: "problem" },
  { key: "share_trigger", anchor: "audience" },
  { key: "superpower_question", anchor: "superpower" },
  { key: "buy_decision", anchor: "audience" },
] as const;

function fallbackButtons(p: ReturnType<typeof builderProfile>) {
  const aud = p.audience || "your audience";
  const sp = p.superpower || "what you do best";
  const prob = p.problem || "the thing they are stuck on";
  return [
    { key: "audience_fit", label: `Why a quiz works for ${aud}` },
    { key: "problem_gap", label: `How a quiz reveals ${prob} they can't see` },
    { key: "share_trigger", label: `What makes ${aud} share their quiz result` },
    { key: "superpower_question", label: `How ${sp} becomes a quiz question` },
    { key: "buy_decision", label: `Why ${aud} invest after taking a quiz` },
  ];
}

async function handleButtons(inputs: Day1Inputs): Promise<Response> {
  const p = builderProfile(inputs);
  const fb = fallbackButtons(p);

  // If we don't have the core Day 1 nouns, return deterministic fallbacks
  // rather than asking the model to invent — that's where "(unknown)" leaked
  // into labels.
  if (!p.audience || !p.superpower || !p.problem) {
    return new Response(
      JSON.stringify({ buttons: fb, fallback: true, reason: "missing-day1-inputs" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const prompt = [
    "Source material — only use these ideas:",
    KB,
    "",
    "Builder's Day 1 data (use their own words verbatim — never write the word 'unknown'):",
    `- audience: ${p.audience}`,
    `- superpower: ${p.superpower}`,
    `- problem their audience is stuck on: ${p.problem}`,
    p.how ? `- how they deliver: ${p.how}` : null,
    p.outcome ? `- outcome they help create: ${p.outcome}` : null,
    "",
    "Write FIVE short button labels for a screen titled 'What is quiz marketing and why it will work for you'.",
    "Each label MUST:",
    "- be 5 to 9 words, sentence case, no trailing punctuation, no quotes",
    "- start with a question word (Why / How / What) when natural",
    "- reference something specific from the builder's Day 1 data (audience, problem, superpower, delivery method, or outcome) — use their own words for those nouns",
    "- relate that specific thing DIRECTLY to quiz marketing (not generic marketing)",
    "- be distinct from the other four (no overlap)",
    "- NEVER contain the literal word 'unknown' or any placeholder",
    "Anchors to cover, in this exact order:",
    "1) Why a quiz fits THEIR audience",
    "2) How a quiz exposes the specific problem their audience can't see",
    "3) What makes their audience share their quiz result",
    "4) How their superpower becomes a quiz question",
    "5) Why their audience invests after taking the quiz",
    "",
    "Return ONLY a JSON object in this exact shape, no prose, no markdown fences:",
    `{"labels":["label1","label2","label3","label4","label5"]}`,
  ].filter(Boolean).join("\n");


  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: prompt },
    ],
    temperature: 0.65,
    response_format: { type: "json_object" },
  });

  if (resp.status === 429) return fallback("rate-limited", { buttons: fb });
  if (resp.status === 402) return fallback("payment-required", { buttons: fb });
  if (!resp.ok) {
    console.error("buttons gateway error", resp.status, await resp.text());
    return fallback("gateway-error", { buttons: fb });
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content?.trim() || "";
  let labels: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.labels)) labels = parsed.labels;
  } catch {
    // try to salvage JSON inside ```...```
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        if (Array.isArray(parsed?.labels)) labels = parsed.labels;
      } catch { /* ignore */ }
    }
  }
  const clean = labels
    .filter((l) => typeof l === "string")
    .map((l) => stripQuotes(l).replace(/[.!]+$/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  if (clean.length !== 5) return fallback("bad-shape", { buttons: fb });
  // Reject any label that leaked the literal placeholder.
  if (clean.some((l) => /\bunknown\b/i.test(l))) {
    return fallback("placeholder-leaked", { buttons: fb });
  }

  const buttons = BUTTON_TOPICS.map((t, i) => ({ key: t.key, label: clean[i] }));
  return new Response(
    JSON.stringify({ buttons }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// ---------- INSIGHT ----------
const INSIGHT_BRIEFS: Record<string, string> = {
  audience_fit:
    "Why a quiz is the best lead magnet for experts like THIS builder specifically. Open by naming the builder's expert type(s) in the form 'As a {expert phrase},' (e.g. 'As a coach and course creator,'). Then explain — using Section 1 — why a quiz beats a generic PDF for an expert who sells expertise: it joins the conversation their audience is already having with themselves, returns a personalised next step in under three minutes, and turns zero-party data into immediate authority. Reference their audience in their own words.",
  problem_gap:
    "How a quiz exposes the specific problem the audience can't see in themselves. Anchor in Section 2 — Expert Axis: they can name pain and desired future but cannot diagnose their own systemic pitfall. The quiz reveals the pitfall, which is where the builder's authority lands.",
  share_trigger:
    "What makes this audience share their quiz result. Anchor in Section 1 (hyper-individual results, identity validation for B2C / benchmarking for B2B) and Section 2 (preferred future made visible, tension resolved into a clear next step).",
  superpower_question:
    "How the builder's superpower translates into a quiz question. The question must measure an observable behaviour tied to the present state (Section 2), not an opinion, and set up the pitfall their superpower resolves.",
  buy_decision:
    "Why this audience invests after taking the quiz. Anchor in Section 2 — tension between present state, preferred future and pitfalls is what people pay to resolve; the quiz is the mirror that makes the next step feel achievable.",
};

function fallbackInsight(key: string, p: ReturnType<typeof builderProfile>): string {
  const aud = p.audience || "your audience";
  const sp = p.superpower || "what you do best";
  const prob = p.problem || "what they're stuck on";
  const fn = p.firstName ? `${p.firstName}, ` : "";
  const expertOpener = p.expertPhrase ? `As a ${p.expertPhrase}, ` : fn;
  switch (key) {
    case "audience_fit":
      return `${expertOpener}you sell expertise — and ${aud} don't need another generic PDF, they need someone who can name where they actually stand. A quiz joins the private conversation they're already having about ${prob}, returns a personalised next step in under three minutes, and lets your authority land before any sales call.`;
    case "problem_gap":
      return `${aud} can describe ${prob} but cannot diagnose the system underneath it — that is the expert axis. Your quiz makes the hidden pitfall visible, which is exactly where your authority lands.`;
    case "share_trigger":
      return `${aud} share a quiz result when it names them more accurately than they could name themselves. Personalised results turn into identity statements, and identity statements travel.`;
    case "superpower_question":
      return `Your superpower — ${sp} — becomes a quiz question by measuring the observable behaviour it acts on, not the opinion behind it. That single question reveals the pitfall only you are positioned to resolve.`;
    case "buy_decision":
      return `${aud} invest when they can see their present state, their preferred future and the pitfall in between in one glance. The quiz is the mirror that turns that tension into a next step that feels achievable.`;
    default:
      return `${fn}quiz marketing works for ${aud} because it mirrors the conversation already in their head and hands them the next clear step.`;
  }
}

async function handleInsight(payload: { key?: string; label?: string; inputs?: Day1Inputs }): Promise<Response> {
  const key = sanitise(payload.key, 60);
  const label = sanitise(payload.label, 200);
  const p = builderProfile(payload.inputs || {});
  const brief = INSIGHT_BRIEFS[key];
  const fb = fallbackInsight(key, p);

  if (!brief) return fallback("unknown-key", { text: fb });

  const prompt = [
    "Source material — only use these ideas:",
    KB,
    "",
    "Builder's Day 1 data (use their own words verbatim):",
    p.firstName ? `- first name: ${p.firstName}` : null,
    p.audience ? `- audience: ${p.audience}` : null,
    p.superpower ? `- superpower: ${p.superpower}` : null,
    p.problem ? `- problem: ${p.problem}` : null,
    p.how ? `- how they deliver: ${p.how}` : null,
    p.outcome ? `- outcome: ${p.outcome}` : null,
    "",
    `Button the builder just clicked: "${label}"`,
    `Insight brief: ${brief}`,
    "",
    "Write Johnny's spoken answer.",
    "Constraints:",
    "- EXACTLY two or three sentences.",
    "- Use the audience and (where relevant) superpower / problem in the builder's own words — do not paraphrase those nouns.",
    "- Stay strictly inside the source material above.",
    "- Plain text. No headings. No bullet points. No emojis. No exclamation marks unless natural. Do not wrap in quotes.",
  ].filter(Boolean).join("\n");

  const resp = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: JOHNNY_VOICE },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  if (resp.status === 429) return fallback("rate-limited", { text: fb });
  if (resp.status === 402) return fallback("payment-required", { text: fb });
  if (!resp.ok) {
    console.error("insight gateway error", resp.status, await resp.text());
    return fallback("gateway-error", { text: fb });
  }
  const data = await resp.json();
  const text = stripQuotes(data?.choices?.[0]?.message?.content?.trim() || "");
  if (!text) return fallback("empty-response", { text: fb });
  return new Response(
    JSON.stringify({ text }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  let payload: { moment?: string; inputs?: Record<string, unknown>; key?: string; label?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const moment = payload?.moment;
  const inputs = (payload?.inputs ?? {}) as Day1Inputs;
  try {
    if (moment === "opener") return await handleOpener(inputs);
    if (moment === "buttons") return await handleButtons(inputs);
    if (moment === "insight") return await handleInsight({ key: payload.key, label: payload.label, inputs });
    return new Response(
      JSON.stringify({ error: `Unknown moment: ${moment}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("day2-thread fatal", err);
    return fallback("server-error");
  }
});
