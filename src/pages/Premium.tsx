import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Crown,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePremium } from "@/hooks/usePremium";
import { setPremium, validateCoupon } from "@/lib/premium";
import { toast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { getPartnerCode } from "@/lib/partner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import johnnyPortrait from "@/assets/johnny-beirne.png";

const VALUE_PILLARS = [
  {
    icon: Target,
    title: "Assessment-first funnel",
    body: "Convert cold traffic with a diagnostic that scores intent and pre-qualifies leads before any pitch.",
  },
  {
    icon: Workflow,
    title: "AI-guided challenge",
    body: "Run a 3-day implementation challenge with AI prompts, daily structure, and momentum mechanics.",
  },
  {
    icon: Users,
    title: "Referral trust engine",
    body: "Compounding referral loops that turn customers into a distribution channel without paid ads.",
  },
  {
    icon: Zap,
    title: "Premium growth path",
    body: "A clear ascension from free assessment to paid course, coaching, and partner-led scale.",
  },
];

const MODULES = [
  { eyebrow: "Module 1", title: "Why Most Lead Generation Fails", body: "The hidden reasons funnels stall, and what high-trust offers do differently." },
  { eyebrow: "Module 2", title: "Trust-Based Lead Generation", body: "Position expertise so the right buyers self-identify and ask to work with you." },
  { eyebrow: "Module 3", title: "Building Referral Loops", body: "Engineer compounding word-of-mouth using built-in mechanics, not luck." },
  { eyebrow: "Module 4", title: "Advanced Challenge Systems", body: "Design AI-guided challenges that drive completion, conversion, and case studies." },
  { eyebrow: "Module 5", title: "Scaling With Leadio", body: "Partners, JV, affiliates, and paid acquisition layered on a referral-first base." },
];

const AUDIENCE = [
  "Coaches", "Consultants", "Course creators", "Experts",
  "Community builders", "SaaS founders", "Agencies", "JV partners",
];

const ASCENSION = [
  { label: "Assessment", to: "/" },
  { label: "Free Mini Course", to: "/blueprint" },
  { label: "3-Day Challenge", to: "/challenge" },
  { label: "Premium Course", to: "/premium" },
  { label: "Coaching / Scale", to: "/partners" },
];

const Premium = () => {
  const { isPremium, coupon } = usePremium();
  const { user } = useAuth();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; finalPrice: number; originalPrice: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveApplied = useMemo(
    () => applied ?? (coupon ? { code: coupon, finalPrice: 0, originalPrice: 497, label: "Founding member" } : null),
    [applied, coupon],
  );

  const handleApply = () => {
    setError(null);
    const result = validateCoupon(code);
    if (result.ok !== true) {
      setError(result.reason);
      setApplied(null);
      return;
    }
    setApplied({ code: result.code, finalPrice: result.finalPrice, originalPrice: result.originalPrice, label: result.label });
    toast({ title: "Coupon applied", description: `${result.code} — ${result.label}` });
  };

  const handlePrimaryCta = () => {
    if (effectiveApplied) {
      setPremium(true, effectiveApplied.code);
      toast({
        title: "Premium access confirmed",
        description: "Your course area is being prepared.",
      });
      return;
    }
    // No coupon → open Stripe embedded checkout
    openCheckout({
      priceId: "leadio_premium_lifetime_usd",
      customerEmail: user?.email,
      userId: user?.id,
      promotionCode: getPartnerCode(),
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    setTimeout(() => {
      document.getElementById("checkout-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,hsl(var(--primary)/0.25),transparent_55%),radial-gradient(circle_at_85%_10%,hsl(var(--primary)/0.18),transparent_50%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                <Crown className="h-3.5 w-3.5" /> Leadio Growth Accelerator
              </div>
              <h1 className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Turn your expertise into a challenge-based growth engine.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Learn the full Leadio system for building assessment-first funnels, AI-guided
                challenges, referral loops, and trust-based lead generation.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={handlePrimaryCta}
                  className="h-12 gap-2 px-6 text-base font-black uppercase tracking-wide"
                >
                  <Rocket className="h-4 w-4" />
                  {effectiveApplied ? "Unlock With Coupon" : "Unlock the Premium Course"}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Lifetime access · One-time payment · 14-day refund
                </div>
              </div>

              {isPremium && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                  <Check className="h-4 w-4" /> Premium access confirmed.
                  <Button asChild size="sm" variant="outline" className="ml-2">
                    <Link to="/blueprint/dashboard">Open Course</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Course preview card + coupon */}
            <div id="coupon-anchor" className="rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-xl shadow-primary/5 backdrop-blur sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-primary">Course preview</div>
                  <div className="mt-2 text-lg font-black">Leadio Growth Accelerator</div>
                  <div className="mt-1 text-xs text-muted-foreground">5 modules · Lifetime updates</div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/30">Premium</Badge>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {MODULES.map((m) => (
                  <li key={m.title} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span><span className="font-bold">{m.title}</span></span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Apply Coupon Code
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="h-11 font-mono uppercase tracking-wider"
                  />
                  <Button onClick={handleApply} variant="secondary" className="h-11 font-black uppercase">
                    Apply
                  </Button>
                </div>
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                {effectiveApplied && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-success">
                    <Check className="h-3.5 w-3.5" /> Coupon applied — {effectiveApplied.code}
                  </p>
                )}

                <div className="mt-4 flex items-baseline gap-3">
                  {effectiveApplied ? (
                    <>
                      <span className="text-3xl font-black">${effectiveApplied.finalPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">${effectiveApplied.originalPrice}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-black">$497</span>
                  )}
                </div>

                <Button
                  onClick={handlePrimaryCta}
                  className="mt-4 h-12 w-full gap-2 text-base font-black uppercase"
                >
                  <Rocket className="h-4 w-4" />
                  {effectiveApplied ? "Unlock With Coupon" : "Unlock the Premium Course"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHECKOUT */}
      {isOpen && checkoutElement && (
        <section id="checkout-anchor" className="mx-auto w-full max-w-3xl px-4 py-10">
          <div className="rounded-3xl border border-primary/20 bg-card p-2 sm:p-4 shadow-xl shadow-primary/5">
            {checkoutElement}
            <button
              type="button"
              onClick={closeCheckout}
              className="mt-3 px-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* WHAT YOU BUILD */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-black uppercase tracking-widest text-primary">What you'll build</div>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">A complete growth engine, not another course.</h2>
          <p className="mt-3 text-muted-foreground">Four interlocking systems that compound on each other.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Course modules</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">5 modules. One coherent system.</h2>
            </div>
            <Layers className="hidden h-10 w-10 text-primary/50 sm:block" />
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <div key={m.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Crown className="h-3 w-3" /> {m.eyebrow}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-snug">{m.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-primary">Why this is different</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Education, AI, implementation, and referrals — connected.</h2>
            <p className="mt-4 text-muted-foreground">
              Most courses teach theory and stop. Leadio connects what you learn to AI-guided
              implementation, a working challenge funnel, and a referral system that compounds —
              so the things you build keep producing leads after the course ends.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: BookOpen, title: "Education", body: "Frameworks that explain why trust beats tactics." },
                { icon: Sparkles, title: "AI Guidance", body: "Prompts and copilots tuned for your offer." },
                { icon: Workflow, title: "Implementation", body: "A 3-day challenge format you can re-run." },
                { icon: Users, title: "Referrals", body: "Loops that turn customers into a channel." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-background p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h4 className="mt-3 text-sm font-black">{title}</h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRAINER BIO */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-2xl shadow-primary/10">
              <img
                src={johnnyPortrait}
                alt="Johnny Beirne — creator of Leadio"
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-primary">Your trainer</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Meet Johnny Beirne</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Creator of Leadio · Challenge-based growth strategist
            </p>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                Johnny has spent the last decade helping coaches, consultants, and expert-led
                businesses turn knowledge into repeatable lead-generation systems. Leadio is the
                distillation of everything that consistently worked — assessment-first funnels,
                AI-guided challenges, and trust-based referral loops.
              </p>
              <p>
                Inside the Growth Accelerator, you get the same playbook used to launch challenges,
                build referral engines, and ascend offers across niches — without paid ads as the
                primary growth lever.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { k: "10+", v: "Years in growth" },
                { k: "200+", v: "Challenges launched" },
                { k: "1:1", v: "Built with operators" },
              ].map((s) => (
                <div key={s.v} className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-2xl font-black text-primary">{s.k}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="text-xs font-black uppercase tracking-widest text-primary">Who it's for</div>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Built for operators who teach, sell, and serve.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AUDIENCE.map((a) => (
              <div key={a} className="rounded-xl border border-border bg-card px-4 py-5 text-center text-sm font-bold">
                {a}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ASCENSION PATH */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-xs font-black uppercase tracking-widest text-primary">Leadio ascension path</div>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">From first click to scale.</h2>
        <div className="mt-8 flex flex-wrap items-stretch gap-3">
          {ASCENSION.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${i === 3 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                {step.label}
              </div>
              {i < ASCENSION.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </section>

      {/* PARTNER / JV */}
      <section className="border-y border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Partner / JV ready</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Designed to be promoted.</h2>
              <p className="mt-3 text-muted-foreground">
                Leadio is built for partners and JV launches. Coupon codes, partner attribution,
                assessment-first traffic, and a built-in challenge bridge make it easy to plug into
                an existing audience.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild variant="outline"><Link to="/partners">Become a partner</Link></Button>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Coupon support",
                "Partner attribution ready",
                "Assessment-first traffic",
                "Challenge bridge",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-bold">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-20">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center shadow-xl shadow-primary/10 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
            <Crown className="h-3.5 w-3.5" /> Leadio Growth Accelerator
          </div>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            {effectiveApplied ? (
              <>
                <span className="text-5xl font-black">${effectiveApplied.finalPrice}</span>
                <span className="text-lg text-muted-foreground line-through">${effectiveApplied.originalPrice}</span>
              </>
            ) : (
              <span className="text-5xl font-black">$497</span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Lifetime access · One-time payment · Use coupon code <span className="font-mono font-bold text-foreground">FOUNDING497</span>
          </p>
          <Button onClick={handlePrimaryCta} className="mt-6 h-12 gap-2 px-8 text-base font-black uppercase">
            <Rocket className="h-4 w-4" />
            {effectiveApplied ? "Unlock With Coupon" : "Unlock the Premium Course"}
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            14-day refund · Secure checkout · No recurring fees
          </p>
        </div>
      </section>
    </main>
  );
};

export default Premium;
