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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePremium } from "@/hooks/usePremium";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { getPartnerCode } from "@/lib/partner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PREMIUM_MODULES = [
  {
    title: "Advanced Challenge Systems",
    eyebrow: "Module 4",
    body: "How high-converting challenge funnels combine AI implementation, trust loops, referrals, and behavioral momentum.",
  },
  {
    title: "Scaling With Leadio",
    eyebrow: "Module 5",
    body: "Scaling challenges with partners, affiliates, referrals, paid acquisition, and repeatable trust-based systems.",
  },
];

const PREMIUM_BENEFITS = [
  "Advanced AI prompts & workflows",
  "Partner & affiliate scaling systems",
  "Viral onboarding frameworks",
  "Trust-based growth loops",
  "Referral compounding systems",
  "Funnel implementation strategy",
];

const AUDIENCE = [
  "Coaches",
  "Experts",
  "Consultants",
  "Community builders",
  "SaaS founders",
  "Course creators",
];

const Upgrade = () => {
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();

  const handleBuy = () => {
    openCheckout({
      priceId: "leadio_premium_lifetime",
      customerEmail: user?.email,
      userId: user?.id,
      promotionCode: getPartnerCode(),
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    setTimeout(() => {
      document
        .getElementById("checkout-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <>
      <PaymentTestModeBanner />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 lg:py-14">
        {/* SECTION 1 — Hero */}
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            <Crown className="h-3.5 w-3.5" /> Leadio Premium
          </div>
          <h1 className="mt-4 text-3xl font-black text-foreground sm:text-5xl">
            Go beyond the free blueprint.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Unlock advanced challenge systems, scaling frameworks, referral growth mechanics, and
            implementation strategy.
          </p>

          {isPremium ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success">
              <Check className="h-4 w-4" /> Premium is active on this account
              <Button asChild size="sm" variant="outline" className="ml-3">
                <Link to="/blueprint/dashboard">Go to Course</Link>
              </Button>
            </div>
          ) : (
            <div
              id="checkout-anchor"
              className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-end"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-foreground">€497</span>
                  <Badge className="bg-primary/10 text-primary border-primary/30">Lifetime</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  One-time payment · Lifetime updates · 14-day refund.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Secure checkout · Powered by
                  Stripe
                </div>
              </div>

              {!isOpen && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleBuy}
                    className="h-12 gap-2 text-base font-black uppercase sm:px-8"
                  >
                    <Rocket className="h-4 w-4" /> Unlock Full Course
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Lifetime access · No recurring fees
                  </p>
                </div>
              )}
            </div>
          )}

          {!isPremium && isOpen && checkoutElement && (
            <div className="mt-6 rounded-2xl border border-border bg-background p-2 sm:p-4">
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

        {/* SECTION 2 — What's included */}
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black">What's included</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Two premium modules and the systems behind them.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {PREMIUM_MODULES.map((m) => (
              <div key={m.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  <Crown className="h-3 w-3" /> {m.eyebrow}
                </span>
                <h3 className="mt-3 text-lg font-black">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background p-5">
            <h3 className="text-sm font-black uppercase tracking-wide text-primary">
              Premium benefits
            </h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SECTION 3 — Who it's for */}
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black">Who it's for</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {/* SECTION 4 — Challenge connection */}
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black">How it fits together</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-5">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-base font-black">Mini Course</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Teaches the system — trust-based lead generation and referral loops.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <ArrowRight className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-base font-black">3-Day Challenge</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Helps you implement it — structure, build, and launch in three focused days.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-base font-black">Premium Course</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Helps you scale it — advanced systems, partners, and AI-driven growth loops.
              </p>
            </div>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            The premium course and the challenge are separate. You can do either, both, or in any
            order.
          </p>
        </section>

        {/* Footer CTA */}
        {!isPremium && (
          <section className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center">
            <h3 className="text-2xl font-black sm:text-3xl">Ready to go premium?</h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              Lifetime access · One-time payment · 14-day refund.
            </p>
            <Button onClick={handleBuy} className="h-12 gap-2 px-8 text-base font-black uppercase">
              <Rocket className="h-4 w-4" /> Unlock Full Course
            </Button>
          </section>
        )}
      </main>
    </>
  );
};

export default Upgrade;
