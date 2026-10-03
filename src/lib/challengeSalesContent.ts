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
  joinProblem: { show: boolean; eyebrow: string; heading: string; body: string; cards: CardItem[] };
  joinBenefits: { show: boolean; eyebrow: string; heading: string; items: TextItem[] };
  joinAbout: { show: boolean; photoUrl: string; eyebrow: string; heading: string; body: string };
  joinTestimonials: { show: boolean; eyebrow: string; heading: string; items: Testimonial[] };
  joinFinal: { show: boolean; heading: string; body: string; button: string };
  join: { kicker: string; headline: string; subheadline: string; button: string; underButton: string; showDays: boolean; daysHeading: string };
};

let n = 0;
export const newId = () => `i${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const t = (arr: string[]): TextItem[] => arr.map((text, i) => ({ id: `t${i}${text.length}`, position: i, text }));
const c = (arr: [string, string][]): CardItem[] => arr.map(([title, body], i) => ({ id: `c${i}${title.length}`, position: i, title, body }));

export const DEFAULT_CHALLENGE_SALES: ChallengeSalesContent = {
  hero: {
    "show": true,
    "kicker": "For coaches, consultants and authors",
    "headline": "Get leads who already trust you, invited by people who know you.",
    "subheadline": "Plant a lead tree in three days, and watch it grow. Done with you in a few minutes a day, not by yourself. No live sessions to host.",
    "button": "Join the free challenge",
    "underButton": "Start with Day 1. Have yours live by {day}."
  },
  problem: {
    "show": true,
    "heading": "You already know what you're doing isn't working as well as it should.",
    "body": "That's why you're here. Every one of these has the same flaw. The leads only come while you keep pushing.",
    "cards": [
      {
        "id": "c03",
        "position": 0,
        "title": "Ads",
        "body": "They cost more than the leads are worth."
      },
      {
        "id": "c17",
        "position": 1,
        "title": "Posting",
        "body": "Every day, to people who scroll past."
      },
      {
        "id": "c28",
        "position": 2,
        "title": "Partners",
        "body": "Chasing people to promote you."
      },
      {
        "id": "c315",
        "position": 3,
        "title": "Live challenges",
        "body": "They work, until you stop turning up. Then the leads stop too."
      }
    ]
  },
  fix: {
    "show": true,
    "heading": "The answer has been in front of you all along.",
    "body": "Get a few people started. Give them a real result. Excite them to invite. The trust comes from people inviting people.\nSomeone takes your challenge and gets a real win.\nThey're excited, and they're rewarded for inviting people like them.\nTheir friend joins, because someone they trust said it was worth it.\nThat friend gets a win, and invites the next one."
  },
  days: {
    "show": true,
    "heading": "Roots, trunk, branches",
    "items": [
      {
        "id": "d032",
        "position": 0,
        "title": "Day 1, the roots: your challenge",
        "body": "Nobody sees the roots, but everything grows from them. A challenge gets someone one real win, so they feel what working with you is like before they ever pay you. You answer a few questions and Johnny B AI builds yours with you. You finish with your challenge mapped and a promise you can say in one sentence."
      },
      {
        "id": "d127",
        "position": 1,
        "title": "Day 2, the trunk: your quiz",
        "body": "The trunk is the one way up. Your quiz holds up a mirror, so your audience sees for themselves where they stand on the result you promise. You don't tell them they need you. They tell themselves. You finish with a quiz that gets people saying yes to themselves."
      },
      {
        "id": "d242",
        "position": 2,
        "title": "Day 3, the branches: the people who invite",
        "body": "Your challengers are the branches, and branches grow branches. Someone gets a result and invites a friend, who arrives already trusting you. It runs evergreen, so you host no live sessions. You finish with your challenge live, your link in your hand and your referrals switched on."
      }
    ]
  },
  walkAway: {
    "show": true,
    "heading": "What you'll have by the end",
    "items": [
      {
        "id": "t067",
        "position": 0,
        "text": "Your challenge, mapped, with a promise you can say in one sentence."
      },
      {
        "id": "t141",
        "position": 1,
        "text": "Your quiz, written from your own answers."
      },
      {
        "id": "t240",
        "position": 2,
        "text": "Your challenge live, with your own link."
      },
      {
        "id": "t373",
        "position": 3,
        "text": "Your referrals switched on, so your challengers can invite the next ones."
      }
    ]
  },
  whoFor: {
    "show": true,
    "forHeading": "This is for you if",
    "forItems": [
      {
        "id": "t057",
        "position": 0,
        "text": "You're a coach, consultant or author with real expertise."
      },
      {
        "id": "t160",
        "position": 1,
        "text": "You're tired of leads that only come while you keep pushing."
      },
      {
        "id": "t244",
        "position": 2,
        "text": "You'd rather be recommended than advertised."
      },
      {
        "id": "t351",
        "position": 3,
        "text": "You can give it a few minutes a day for three days."
      }
    ],
    "notForHeading": "It's not for you if",
    "notForItems": [
      {
        "id": "t057",
        "position": 0,
        "text": "You want leads without giving anyone a real result first."
      },
      {
        "id": "t152",
        "position": 1,
        "text": "You want it all done for you. This is done with you."
      },
      {
        "id": "t269",
        "position": 2,
        "text": "You're looking for a trick. This grows the way a tree does, steadily."
      }
    ]
  },
  guide: {
    "show": true,
    "photoUrl": "",
    "heading": "Let me be straight with you",
    "body": "This is new. I don't have a wall of testimonials to show you yet, and I won't invent one. Here is what I do have. Thirty years in online business. I ran live challenges myself. They worked, and they wore me out. So I built the version that runs without me, and grows by people inviting people. And I have the challenge itself. You're about to go through the exact kind of challenge you'll build. If it works on you, you'll know it works."
  },
  testimonials: { show: true, heading: "What people say", items: [] },
  faq: {
    "show": true,
    "heading": "Questions",
    "items": [
      {
        "id": "f0",
        "position": 0,
        "question": "If I'm not there live, why would anyone finish it?",
        "answer": "Each day is open for a limited window on the challenger's own clock, then it locks. A named AI coach answers them by first name. They build something each day. And inviting others earns points and rewards. You get the urgency of a live challenge without being in it."
      },
      {
        "id": "f1",
        "position": 1,
        "question": "Will people really give me three days?",
        "answer": "It's a few minutes a day, not three full days. And they choose it themselves, because your quiz shows them where they stand."
      },
      {
        "id": "f2",
        "position": 2,
        "question": "Do I need a quiz, or can I send people straight to my challenge?",
        "answer": "Cold audience, put the quiz in front. Warm audience, send them straight in, and the quiz sits inside your challenge."
      },
      {
        "id": "f3",
        "position": 3,
        "question": "Do I have to build it all myself?",
        "answer": "No. It's done with you. Each day you see one idea, answer a few questions, and Johnny B AI builds your version with you."
      },
      {
        "id": "f4",
        "position": 4,
        "question": "Why would these leads trust me?",
        "answer": "Because someone they trust invited them. The trust comes from people inviting people."
      },
      {
        "id": "f5",
        "position": 5,
        "question": "What does it cost?",
        "answer": "Joining is free. Each day is open for a limited window. If you miss one, you can unlock it by inviting people or by paying."
      }
    ]
  },
  finalCall: {
    "show": true,
    "heading": "Plant your lead tree.",
    "button": "Join the free challenge",
    "underButton": "Start with Day 1. Have yours live by {day}."
  },
  joinProblem: {
    show: true,
    eyebrow: "Why a challenge",
    heading: "Your followers like you. They just don't do anything about it.",
    body: "More posts, more freebies and more ads all ask people to watch. A challenge asks them to take part, and people who take part become leads.",
    cards: c([
      ["Followers who never raise a hand", "Day 1 gives them a reason to step forward and join."],
      ["Leads who download and disappear", "Daily wins keep them coming back for three days in a row."],
      ["Fans who never bring a friend", "Built-in invites turn every participant into a referral."],
    ]),
  },
  joinBenefits: {
    show: true,
    eyebrow: "By the end of Day 3",
    heading: "You walk away with a challenge that's ready to launch",
    items: t([
      "A clear promise your audience wants",
      "A quiz that shows people the problem you solve",
      "A landing page and emails ready to go",
      "A referral loop so people bring their friends",
    ]),
  },
  joinAbout: {
    show: true,
    photoUrl: "",
    eyebrow: "Who's guiding you",
    heading: "About Johnny Beirne",
    body: "Johnny Beirne has spent over 30 years building online businesses. He co-wrote Rethink Remoting and builds challenge funnels for coaches, consultants and authors.\n\nIn this challenge he walks you through every step, one day at a time.",
  },
  joinTestimonials: { show: true, eyebrow: "What people say", heading: "From people who took part", items: [] },
  joinFinal: {
    show: true,
    heading: "Start Day 1 today",
    body: "It's free, it takes about an hour a day, and you'll have yours ready by {day}.",
    button: "Join the free challenge",
  },
  join: {
    kicker: "FREE 3-DAY CHALLENGE",
    headline: "Stop losing the leads you already have.",
    subheadline: "Create your free account and start Day 1 today. You'll build a challenge of your own that turns followers into leads.",
    button: "Join the free challenge",
    underButton: "Free. Have yours ready by {day}.",
    showDays: true,
    daysHeading: "What you'll build, day by day",
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
