// Challenge sales page (/challenge) content.
// Stored as ONE JSON row in site_content: page="challenge_sales", section="main", key="config".
// The page and the admin editor both read/write exactly this key.

export const CHALLENGE_SALES_PAGE = "challenge_sales";
export const CHALLENGE_SALES_SECTION = "main";
export const CHALLENGE_SALES_KEY = "config";

export type TextItem = { id: string; position: number; text: string };
export type CardItem = { id: string; position: number; title: string; body: string };
export type Testimonial = { id: string; position: number; quote: string; name: string; role: string };
export type FaqItem = { id: string; position: number; question: string; answer: string };

export type ChallengeSalesContent = {
  hero: { show: boolean; kicker: string; headline: string; subheadline: string; button: string; underButton: string };
  problem: { show: boolean; heading: string; body: string; cards: CardItem[] };
  fix: { show: boolean; heading: string; body: string };
  days: { show: boolean; heading: string; items: CardItem[] };
  walkAway: { show: boolean; heading: string; items: TextItem[] };
  whoFor: { show: boolean; forHeading: string; forItems: TextItem[]; notForHeading: string; notForItems: TextItem[] };
  guide: { show: boolean; photoUrl: string; heading: string; body: string };
  testimonials: { show: boolean; heading: string; items: Testimonial[] };
  faq: { show: boolean; heading: string; items: FaqItem[] };
  finalCall: { show: boolean; heading: string; button: string; underButton: string };
};

let n = 0;
export const newId = () => `i${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const t = (arr: string[]): TextItem[] => arr.map((text, i) => ({ id: `t${i}${text.length}`, position: i, text }));
const c = (arr: [string, string][]): CardItem[] => arr.map(([title, body], i) => ({ id: `c${i}${title.length}`, position: i, title, body }));

export const DEFAULT_CHALLENGE_SALES: ChallengeSalesContent = {
  hero: {
    show: true,
    kicker: "FOR COACHES, CONSULTANTS AND AUTHORS",
    headline: "Stop losing the leads you already have.",
    subheadline: "Join the free 3-day challenge. You'll build a challenge of your own that turns followers into leads, and leads into people who bring their friends.",
    button: "Join the free challenge",
    underButton: "Start today. Have yours ready by {day}.",
  },
  problem: {
    show: true,
    heading: "Posting more won't fix this",
    body: "Your audience already likes what you do. They read, they watch, they nod along. Then they scroll on, and you never hear from them.",
    cards: c([
      ["They see you, but never step forward.", "Nothing gives them a reason to raise their hand."],
      ["They step forward, but don't stay.", "A freebie gets downloaded and forgotten."],
      ["They stay, but nobody else hears about it.", "Your best people have no reason to bring a friend."],
    ]),
  },
  fix: {
    show: true,
    heading: "A challenge fixes all three",
    body: "People don't just read a challenge. They take part. Each day gives them a small win, so they keep coming back. And every win gives them a reason to invite someone.",
  },
  days: {
    show: true,
    heading: "What you'll build, day by day",
    items: c([
      ["Day 1, Lock in your audience", "We'll shape who your challenge is for, the promise it makes, and the result people walk away with."],
      ["Day 2, Build the experience", "We'll turn your idea into a ready quiz, landing page and email sequence."],
      ["Day 3, Launch and grow", "We'll share your link, switch on referrals, and bring your challenge to your audience."],
    ]),
  },
  walkAway: {
    show: true,
    heading: "What you'll have by the end",
    items: t([
      "A challenge with a clear promise your audience wants",
      "A quiz that shows people the problem you solve",
      "A landing page and email sequence ready to go",
      "A referral loop so participants bring their friends",
      "Your link live and shared",
    ]),
  },
  whoFor: {
    show: true,
    forHeading: "This is for you if",
    forItems: t([
      "You're a coach, consultant or author",
      "You have an audience but not enough leads",
      "You'd rather your people bring people than pay for every click",
    ]),
    notForHeading: "It's not for you if",
    notForItems: t(["You want it done for you without taking part", "You don't have an offer to sell yet"]),
  },
  guide: {
    show: true,
    photoUrl: "",
    heading: "Who's guiding you",
    body: "Johnny Beirne has spent over 30 years building online businesses. He co-wrote Rethink Remoting and builds challenge funnels for coaches, consultants and authors.",
  },
  testimonials: { show: true, heading: "What people say", items: [] },
  faq: {
    show: true,
    heading: "Questions",
    items: [
      ["Is it really free?", "Yes. Joining the challenge costs nothing."],
      ["Do I need to be technical?", "No. Each day walks you through it step by step."],
      ["What if I fall behind?", "Each day opens in turn. If you miss one, you can unlock it again by inviting friends or with a single payment."],
      ["What do I need to bring?", "Your expertise and a clear idea of who you help."],
    ].map(([question, answer], i) => ({ id: `f${i}`, position: i, question, answer })),
  },
  finalCall: {
    show: true,
    heading: "Your audience is already there. Let's turn them into leads.",
    button: "Join the free challenge",
    underButton: "Start today. Have yours ready by {day}.",
  },
};

/** Merge saved JSON over defaults so missing fields never break the page. */
export function parseChallengeSales(raw?: string | null): ChallengeSalesContent {
  const d = DEFAULT_CHALLENGE_SALES;
  if (!raw) return structuredClone(d);
  try {
    const s = JSON.parse(raw) ?? {};
    const out: any = {};
    for (const k of Object.keys(d) as (keyof ChallengeSalesContent)[]) out[k] = { ...d[k], ...(s[k] ?? {}) };
    return out;
  } catch {
    return structuredClone(d);
  }
}

export const byPosition = <T extends { position: number }>(arr: T[]) => [...arr].sort((a, b) => a.position - b.position);

/** {day} = today + 2, weekday name only. */
export function renderDay(text: string): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  return (text || "").replace(/\{day\}/g, day);
}
