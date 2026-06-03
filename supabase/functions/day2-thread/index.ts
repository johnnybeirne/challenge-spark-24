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
Belief shift mechanics: open with the mindset that mirrors the voice in their head; name the contrast between what they want and what they want to stop; handle objections by asking about them; anchor identity tiers with progress-oriented labels.

SECTION 3 — WHY A QUIZ BEATS OTHER LEAD MAGNETS
PDFs / cheatsheets / ebooks: one-size-fits-all, passive consumption, no diagnosis. They tell every reader the same thing and rely on the reader to self-apply. They produce downloads, not decisions. A quiz returns a tailored result and one specific next step, so the reader leaves with a verdict instead of homework.
Discovery calls: high friction, expensive on time, awkward for the prospect, and dependent on the expert being on the phone. A quiz delivers the diagnostic part of the call instantly and at scale — the prospect arrives at any later conversation already self-qualified, with context, and warmer.
Checklists: shallow engagement, gamified but generic, no personalisation, no insight. A quiz asks for explicit choices (zero-party data) and uses those answers to produce a result the reader could not have arrived at alone — that asymmetry is what creates engagement and shareability.
Webinars / live trainings: high commitment up front (45–90 minutes), require trust before the value is delivered. A quiz inverts that: it delivers personalised value in under three minutes, then earns the right to ask for the larger commitment. Trust is built by accurate reflection, not by airtime.
Pre-qualification: because a quiz captures the participant's present state, preferred future and primary pitfall, it segments leads automatically. The expert can route the right people into the right offer (challenge, call, programme) and politely route the rest away — so the next step (e.g. joining your 3-day challenge) is opted into by people who already match.`;

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
    p.expertPhrase ? `- expert type(s) (use verbatim as 'As a ${p.expertPhrase},' when the brief calls for it): ${p.expertPhrase}` : null,
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

// ---------- SCREEN 2: OPENER ----------
async function handleOpenerS2(inputs: Day1Inputs): Promise<Response> {
  const p = builderProfile(inputs);
  const expertOpener = p.expertPhrase ? `as a ${p.expertPhrase}, ` : "";
  const fbText = `${p.firstName ? `${p.firstName}, ` : ""}${expertOpener}the lead magnet you choose is the first proof of how you think. A quiz lets ${p.audience || "your audience"} feel that judgement in under three minutes — no other format does that.`;

  const prompt = [
    "Source material — only use these ideas:",
    KB,
    "",
    "Builder:",
    p.firstName ? `- First name: ${p.firstName}` : null,
    p.expertPhrase ? `- Expert type(s) (use verbatim): ${p.expertPhrase}` : null,
    p.audience ? `- Audience (their words): ${p.audience}` : null,
    "",
    "Write Johnny's spoken opener for Day 2 Screen 2 — the screen that contrasts a quiz with PDFs, discovery calls, checklists and webinars.",
    "Constraints:",
    "- EXACTLY two sentences.",
    "- The FIRST sentence MUST begin with the first name followed by a comma, then weave in the expert type using the phrase 'as a {expert phrase},' if provided.",
    "- Set up that — compared to other lead magnets — a quiz returns a personalised verdict in under three minutes.",
    "- Reference their audience in their own words if provided.",
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
    console.error("opener_s2 gateway error", resp.status, await resp.text());
    return fallback("gateway-error", { text: fbText });
  }
  const data = await resp.json();
  const text = stripQuotes(data?.choices?.[0]?.message?.content?.trim() || "");
  if (!text) return fallback("empty-response", { text: fbText });
  return new Response(JSON.stringify({ text }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- SCREEN 2: INSIGHT ----------
const INSIGHT_BRIEFS_S2: Record<string, string> = {
  quiz_vs_pdf:
    "Why a quiz beats a PDF for an expert like THIS builder. Open by naming the builder's expert type(s) as 'As a {expert phrase},'. Anchor in Section 1 and Section 3 — PDFs are one-size-fits-all and sit forgotten; a quiz returns a personalised verdict and one clear next step in under three minutes, which is the only format that lets an expert's judgement land at scale.",
  quiz_vs_calls:
    "How a quiz replaces discovery calls for this builder's expert type. Anchor in Section 1 (B2B optimisation / risk mitigation) and Section 3 — discovery calls are high-friction and depend on the expert being on the phone; a quiz delivers the diagnostic part instantly and at scale, so prospects arrive at any later conversation already self-qualified.",
  quiz_vs_checklist:
    "Why this builder's audience engages more with a quiz than a checklist. Reference the audience in the builder's own words. Anchor in Section 3 — checklists are shallow and generic; a quiz asks for explicit choices (zero-party data) and produces a result the reader could not have reached alone, which is what creates real engagement.",
  quiz_prequalifies:
    "How a quiz pre-qualifies leads before they join the builder's 3-day challenge. Reference the audience in the builder's own words. Anchor in Section 2 (present state, preferred future, pitfall) and Section 3 — the quiz segments leads automatically so the people who opt into the challenge already match the profile.",
  quiz_vs_webinar:
    "Why a quiz builds more trust than a free webinar for this builder's expert type. Open by naming the builder's expert type(s) as 'As a {expert phrase},'. Anchor in Section 3 — a webinar asks for 45–90 minutes before any value is delivered; a quiz inverts that by delivering a personalised reflection in under three minutes, and trust is built by accurate reflection rather than airtime.",
};

function fallbackInsightS2(key: string, p: ReturnType<typeof builderProfile>): string {
  const aud = p.audience || "your audience";
  const expertOpener = p.expertPhrase ? `As a ${p.expertPhrase}, ` : "";
  switch (key) {
    case "quiz_vs_pdf":
      return `${expertOpener}a PDF tells every reader the same thing and sits forgotten in a downloads folder — it asks ${aud} to do the diagnostic work themselves. A quiz returns a personalised verdict and one clear next step in under three minutes, which is the only format that lets your judgement actually land at scale.`;
    case "quiz_vs_calls":
      return `${expertOpener}discovery calls are expensive on time and depend on you being on the phone before anything useful happens. A quiz delivers the diagnostic part instantly and at scale, so ${aud} arrive at any later conversation already self-qualified, with context, and warmer.`;
    case "quiz_vs_checklist":
      return `A checklist is shallow and generic — it gives ${aud} the same boxes everyone else gets and asks them to apply it themselves. A quiz asks for explicit choices and uses those answers to produce a result they could not have reached alone, and that asymmetry is what makes them lean in instead of skim.`;
    case "quiz_prequalifies":
      return `Because a quiz captures present state, preferred future and the pitfall in between, it segments ${aud} automatically before they ever land on your challenge page. The people who opt into the 3-day challenge already match the profile, so the room is warmer and the work is easier.`;
    case "quiz_vs_webinar":
      return `${expertOpener}a free webinar asks ${aud} for 45 to 90 minutes of attention before any personalised value is delivered — that is a big ask from a cold lead. A quiz inverts the trade: it returns an accurate reflection in under three minutes, and trust gets built by that accuracy, not by airtime.`;
    default:
      return `${expertOpener}compared to other lead magnets, a quiz returns a personalised next step for ${aud} in under three minutes — that is where the trust is earned.`;
  }
}

async function handleInsightS2(payload: { key?: string; label?: string; inputs?: Day1Inputs }): Promise<Response> {
  const key = sanitise(payload.key, 60);
  const label = sanitise(payload.label, 200);
  const p = builderProfile(payload.inputs || {});
  const brief = INSIGHT_BRIEFS_S2[key];
  const fb = fallbackInsightS2(key, p);

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
    p.expertPhrase ? `- expert type(s) (use verbatim as 'As a ${p.expertPhrase},' when the brief calls for it): ${p.expertPhrase}` : null,
    "",
    `Button the builder just clicked: "${label}"`,
    `Insight brief: ${brief}`,
    "",
    "Write Johnny's spoken answer.",
    "Constraints:",
    "- EXACTLY two or three sentences.",
    "- Use the audience and (where relevant) expert type in the builder's own words — do not paraphrase those nouns.",
    "- Stay strictly inside the source material above (Section 3 in particular).",
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
    console.error("insight_s2 gateway error", resp.status, await resp.text());
    return fallback("gateway-error", { text: fb });
  }
  const data = await resp.json();
  const text = stripQuotes(data?.choices?.[0]?.message?.content?.trim() || "");
  if (!text) return fallback("empty-response", { text: fb });
  return new Response(JSON.stringify({ text }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    if (moment === "opener_s2") return await handleOpenerS2(inputs);
    if (moment === "insight_s2") return await handleInsightS2({ key: payload.key, label: payload.label, inputs });
    return new Response(
      JSON.stringify({ error: `Unknown moment: ${moment}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("day2-thread fatal", err);
    return fallback("server-error");
  }
});
