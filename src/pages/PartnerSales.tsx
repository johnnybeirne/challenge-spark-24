import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Crown,
  Layers,
  Lock,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { setPartnerCode } from "@/lib/partner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const MODULES = [
  {
    eyebrow: "Module 1",
    title: "The Lead Engine Diagnostic",
    body: "Map exactly where your leads stall — and why. Identify the missing piece in your funnel in under 30 minutes.",
  },
  {
    eyebrow: "Module 2",
    title: "Trust-Based Lead Loops",
    body: "Engineer the psychological mechanics behind challenges, quizzes and viral referral systems that compound.",
  },
  {
    eyebrow: "Module 3",
    title: "AI Workflows for Coaches & Experts",
    body: "Production-ready AI prompts, copy systems and automation flows. Build a content engine that ships daily.",
  },
  {
    eyebrow: "Module 4",
    title: "Advanced Challenge Systems",
    body: "How high-converting challenge funnels combine AI implementation, trust loops, referrals, and behavioural momentum.",
  },
  {
    eyebrow: "Module 5",
    title: "Scaling With Leadio",
    body: "Scale with partners, affiliates, paid acquisition, and repeatable trust-based systems. The exact playbook.",
  },
];

const OUTCOMES = [
  "A real, launched lead-magnet within 7 days",
  "A referral system that compounds without paid ads",
  "AI workflows that produce daily content automatically",
  "Partner & affiliate playbooks used by 7-figure coaches",
  "A category-leading positioning system",
  "Lifetime updates as Leadio evolves",
];

const AUDIENCE = [
  "Coaches",
  "Consultants",
  "Course creators",
  "Authors & speakers",
  "Community builders",
  "SaaS founders",
];

const FAQS = [
  {
    q: "Is this a course or a software tool?",
    a: "Both. You get the full Leadio Premium course (5 modules, lifetime access) plus the AI-powered Leadio platform — diagnostic, 3-day implementation challenge, referral engine, and partner system.",
  },
  {
    q: "How long until I see results?",
    a: "Most builders ship their first lead-magnet inside the 3-day implementation challenge. Compounding referral results typically begin in week 2.",
  },
  {
    q: "What if it's not for me?",
    a: "14-day no-questions refund. If the system doesn't earn its place in your business, get every cent back.",
  },
  {
    q: "Do I need an existing audience?",
    a: "No. The trust-loop and referral mechanics are specifically designed to compound from a small starting point.",
  },
];

const PartnerSales = () => {
  const { partnerCode = "" } = useParams<{ partnerCode: string }>();
  const { user } = useAuth();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();

  const code = useMemo(() => partnerCode.trim().toLowerCase(), [partnerCode]);

  // Silently capture and persist the partner code on mount.
  useEffect(() => {
    if (code) setPartnerCode(code);
  }, [code]);

  const handleBuy = () => {
    openCheckout({
      priceId: "leadio_premium_lifetime",
      customerEmail: user?.email,
      userId: user?.id,
      promotionCode: code || undefined,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    setTimeout(() => {
      document.getElementById("checkout-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <>
      <PaymentTestModeBanner />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 lg:py-16">
        {/* HERO */}
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-6 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
            <Crown className="h-3.5 w-3.5" /> Leadio Premium · Lifetime
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight text-foreground sm:text-6xl">
            The complete lead engine for coaches, experts &amp; founders.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Diagnose your funnel. Build a trust-based lead loop. Launch a referral system that
            compounds — powered by AI workflows used by category-leading operators.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button
              onClick={handleBuy}
              className="h-14 gap-2 px-8 text-base font-black uppercase tracking-wide"
            >
              <Rocket className="h-5 w-5" /> Get Lifetime Access
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              14-day refund · One-time payment · Lifetime updates
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1.5 font-semibold text-foreground">4.9/5</span>
            </div>
            <div>Trusted by 1,200+ coaches &amp; experts</div>
            <div className="hidden sm:block">·</div>
            <div>Built by Johnny Beirne</div>
          </div>
        </section>

        {/* OUTCOMES */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black sm:text-3xl">What you walk away with</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {OUTCOMES.map((o) => (
              <div
                key={o}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{o}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MODULES */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black sm:text-3xl">Inside the system</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Five modules. One unified ascension model — diagnose, learn, implement, scale.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {MODULES.map((m) => (
              <div key={m.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  <Crown className="h-3 w-3" /> {m.eyebrow}
                </span>
                <h3 className="mt-3 text-lg font-black">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black sm:text-3xl">Built for</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div
                key={a}
                className="rounded-xl border border-border bg-card p-4 text-center text-sm font-bold"
              >
                {a}
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="mt-14 rounded-3xl border border-border bg-card p-8 sm:p-10">
          <Quote className="h-7 w-7 text-primary" />
          <p className="mt-4 text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
            "Leadio finally connected the dots. Three days in, I had a working referral loop that
            kept producing leads while I slept. Best €497 I've spent on my business this year."
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
              MR
            </div>
            <div>
              <div className="text-sm font-bold">Martin R.</div>
              <div className="text-xs text-muted-foreground">Business coach · Dublin</div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="checkout-anchor"
          className="mt-14 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-12"
        >
          <Badge className="bg-primary/15 text-primary border-primary/30">One-time payment</Badge>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">Lifetime access — €497</h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Pay once. Keep it forever. All five modules, the platform, every future update, and
            premium AI workflows included.
          </p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {[
              "All 5 premium modules",
              "Diagnostic + 3-day challenge engine",
              "Referral & partner systems",
              "AI prompt + workflow library",
              "Lifetime updates",
              "14-day money-back guarantee",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="font-semibold">{f}</span>
              </li>
            ))}
          </ul>

          {!isOpen && (
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleBuy}
                className="h-14 gap-2 px-8 text-base font-black uppercase tracking-wide"
              >
                <Rocket className="h-5 w-5" /> Unlock Leadio Premium
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Secure checkout · 14-day refund · Powered by Stripe
              </p>
            </div>
          )}

          {isOpen && checkoutElement && (
            <div className="mt-8 rounded-2xl border border-border bg-background p-2 sm:p-4">
              {checkoutElement}
              <button
                type="button"
                onClick={closeCheckout}
                className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black sm:text-3xl">Common questions</h2>
          </div>
          <div className="mt-6 grid gap-3">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-black">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-10 text-center">
          <Lock className="h-6 w-6 text-primary" />
          <h3 className="text-3xl font-black sm:text-4xl">Stop guessing. Start compounding.</h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Lifetime access to the full Leadio system. One payment. Refundable for 14 days.
          </p>
          <Button
            onClick={handleBuy}
            className="h-14 gap-2 px-10 text-base font-black uppercase tracking-wide"
          >
            <Rocket className="h-5 w-5" /> Get Lifetime Access
          </Button>
          <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Learn more about Leadio
          </Link>
        </section>
      </main>
    </>
  );
};

export default PartnerSales;
