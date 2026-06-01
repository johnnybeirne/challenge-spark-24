import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  Crown,
  Flame,
  Gauge,
  Rocket,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SEO } from "@/components/SEO";
import { usePremium } from "@/hooks/usePremium";
import { setPremium, validateCoupon, redeemCoupon } from "@/lib/premium";
import { toast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { getPartnerCode } from "@/lib/partner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import johnnyPortrait from "@/assets/johnny-beirne.png";
import {
  AuroraBackdrop,
  CountUp,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/premium/cinematic";

const VALUE_PILLARS = [
  { icon: Target, title: "Assessment-first funnel", body: "Convert cold traffic with a diagnostic that scores intent and pre-qualifies leads before any pitch." },
  { icon: Workflow, title: "AI-guided challenge", body: "Run a 3-day implementation challenge with AI prompts, daily structure, and momentum mechanics." },
  { icon: Users, title: "Referral trust engine", body: "Compounding referral loops that turn customers into a distribution channel without paid ads." },
  { icon: Zap, title: "Premium growth path", body: "A clear ascension from free assessment to paid course, coaching, and partner-led scale." },
];

const MODULES = [
  { eyebrow: "Module 1", title: "Why Most Lead Generation Fails", body: "The hidden reasons funnels stall, and what high-trust offers do differently." },
  { eyebrow: "Module 2", title: "Trust-Based Lead Generation", body: "Position expertise so the right buyers self-identify and ask to work with you." },
  { eyebrow: "Module 3", title: "Building Referral Loops", body: "Engineer compounding word-of-mouth using built-in mechanics, not luck." },
  { eyebrow: "Module 4", title: "Advanced Challenge Systems", body: "Design AI-guided challenges that drive completion, conversion, and case studies." },
  { eyebrow: "Module 5", title: "Scaling With Leadio", body: "Partners, JV, affiliates, and paid acquisition layered on a referral-first base." },
];

const AUDIENCE = ["Coaches", "Consultants", "Course creators", "Experts", "Community builders", "SaaS founders", "Agencies", "JV partners"];

const PROBLEMS = [
  { icon: Flame, title: "Content burnout", body: "Posting endlessly and getting nothing back." },
  { icon: TrendingUp, title: "Expensive ads", body: "CPMs climb, conversions drop, ROAS shrinks." },
  { icon: Gauge, title: "Low conversions", body: "Cold traffic without trust never converts." },
  { icon: Users, title: "Passive audiences", body: "Followers who watch but never buy." },
  { icon: Activity, title: "Inconsistent leads", body: "Feast or famine — no compounding system." },
];

const Premium = () => {
  const { isPremium, coupon } = usePremium();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; finalPrice: number; originalPrice: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessOpen, setAccessOpen] = useState(false);
  const [couponSuccessOpen, setCouponSuccessOpen] = useState(false);

  // Auto-open the access popup once when premium is detected
  useEffect(() => {
    if (!isPremium) return;
    try {
      const KEY = "leadio_premium_access_popup_seen";
      if (sessionStorage.getItem(KEY) === "1") return;
      sessionStorage.setItem(KEY, "1");
      setAccessOpen(true);
    } catch {
      setAccessOpen(true);
    }
  }, [isPremium]);

  // Auto-apply coupon from URL (?coupon=) or pending sessionStorage value
  useEffect(() => {
    const fromUrl = searchParams.get("coupon");
    let pending: string | null = null;
    try { pending = sessionStorage.getItem("leadio_pending_coupon"); } catch {}
    const candidate = (fromUrl || pending || "").trim().toUpperCase();
    if (!candidate || applied) return;
    setCode(candidate);
    (async () => {
      const result = await validateCoupon(candidate);
      if (result.ok === true) {
        setApplied({ code: result.code, finalPrice: result.finalPrice, originalPrice: result.originalPrice, label: result.label });
        try { sessionStorage.removeItem("leadio_pending_coupon"); } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0.85]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.97]);

  const effectiveApplied = useMemo(
    () => applied ?? (coupon ? { code: coupon, finalPrice: 0, originalPrice: 497, label: "Founding member" } : null),
    [applied, coupon],
  );

  const handleApply = async () => {
    setError(null);
    const result = await validateCoupon(code);
    if (result.ok !== true) {
      setError(result.reason);
      setApplied(null);
      return;
    }
    setApplied({ code: result.code, finalPrice: result.finalPrice, originalPrice: result.originalPrice, label: result.label });
    toast({ title: "Coupon applied", description: `${result.code} — ${result.label}` });
    if (result.finalPrice === 0) setCouponSuccessOpen(true);
  };

  const handlePrimaryCta = async () => {
    if (!user) {
      navigate("/join?redirect=/premium");
      return;
    }
    if (effectiveApplied) {
      const redemption = await redeemCoupon(effectiveApplied.code);
      if (redemption.ok !== true) {
        setError(redemption.reason);
        toast({ title: "Coupon could not be applied", description: redemption.reason, variant: "destructive" });
        return;
      }
      await setPremium(true, effectiveApplied.code);
      toast({ title: "Premium access confirmed", description: "Your course area is being prepared." });
      return;
    }
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

  const scrollToCoupon = () => {
    document.getElementById("coupon-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEO title="Growth Accelerator Course" description="The full Leadio system — assessment-first funnels, AI-guided challenges, referral loops, and trust-based lead generation." canonical="/premium" />
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PaymentTestModeBanner />

      {/* ============== HERO ============== */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden border-b border-border"
      >
        <AuroraBackdrop />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary backdrop-blur"
              >
                <Crown className="h-3.5 w-3.5" /> Leadio Growth Accelerator
              </motion.div>
              <h1 className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Turn your expertise into a{" "}
                <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  challenge-based growth engine.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                The full Leadio system — assessment-first funnels, AI-guided challenges, referral loops, and trust-based lead generation. Built to compound.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handlePrimaryCta} className="h-12 gap-2 px-6 text-base font-black uppercase tracking-wide shadow-lg shadow-primary/30">
                  <Rocket className="h-4 w-4" />
                  Enrol Here
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Lifetime access · One-time payment · 14-day refund
                </div>
              </div>

              {/* Live trust strip */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-10 grid max-w-lg grid-cols-3 gap-3"
              >
                {[
                  { v: 200, suf: "+", l: "Challenges" },
                  { v: 12, suf: "k+", l: "Builders" },
                  { v: 4.9, suf: "/5", l: "Rating", dec: 1 },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
                    <div className="text-xl font-black text-primary">
                      <CountUp to={s.v} suffix={s.suf} decimals={s.dec ?? 0} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </motion.div>

              {isPremium && (
                <button
                  type="button"
                  onClick={() => setAccessOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success shadow-sm transition hover:bg-success/15 hover:shadow-md"
                >
                  <Check className="h-4 w-4" />
                  Premium access confirmed — Open Course
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>

            {/* Right: floating preview cards + coupon */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div id="coupon-anchor" className="rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-primary">Course preview</div>
                    <div className="mt-2 text-lg font-black">Leadio Growth Accelerator</div>
                    <div className="mt-1 text-xs text-muted-foreground">5 modules · Lifetime updates</div>
                  </div>
                  <Badge className="border-primary/30 bg-primary/10 text-primary">Premium</Badge>
                </div>

                <ul className="mt-5 space-y-2 text-sm">
                  {MODULES.map((m) => (
                    <li key={m.title} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="font-bold">{m.title}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl border border-foreground bg-background p-4">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Apply Coupon Code
                  </label>
                  <div className="mt-2 flex gap-2">
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter coupon code" className="h-11 font-mono uppercase tracking-wider" />
                    <Button onClick={handleApply} variant="secondary" className="h-11 font-black uppercase">Apply</Button>
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

                  <Button onClick={handlePrimaryCta} className="mt-4 h-12 w-full gap-2 text-base font-black uppercase">
                    <Rocket className="h-4 w-4" />
                    Enrol Here
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ============== CHECKOUT ============== */}
      {isOpen && checkoutElement && (
        <section id="checkout-anchor" className="mx-auto w-full max-w-3xl px-4 py-10">
          <div className="rounded-3xl border border-primary/20 bg-card p-2 shadow-xl shadow-primary/5 sm:p-4">
            {checkoutElement}
            <button type="button" onClick={closeCheckout} className="mt-3 px-3 text-xs text-muted-foreground underline-offset-4 hover:underline">Cancel</button>
          </div>
        </section>
      )}

      {/* ============== THE PROBLEM ============== */}
      <section className="relative border-b border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary">The problem</div>
            <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Most lead generation systems fail because{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 to-primary bg-clip-text text-transparent">trust is missing.</span>
            </h2>
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROBLEMS.map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-full rounded-2xl border border-border bg-card p-5"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-black">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== WHAT YOU BUILD ============== */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary">What you'll build</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">A complete growth engine, not another course.</h2>
            <p className="mt-3 text-muted-foreground">Four interlocking systems that compound on each other.</p>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PILLARS.map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title}>
                <motion.div whileHover={{ y: -4 }} className="h-full rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== COURSE MODULES ============== */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Course modules</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">5 modules. One coherent system.</h2>
            </div>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <StaggerItem key={m.title}>
                <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="group relative h-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-lg shadow-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Crown className="h-3 w-3" /> {m.eyebrow}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black leading-snug">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== TRAINER ============== */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-2xl shadow-primary/10">
                <img src={johnnyPortrait} alt="Johnny Beirne — creator of Leadio" className="aspect-square w-full object-cover" loading="lazy" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="text-xs font-black uppercase tracking-widest text-primary">Your trainer</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Meet Johnny Beirne</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">Creator of Leadio · Challenge-based growth strategist</p>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
              <p>Johnny has spent the last decade helping coaches, consultants, and expert-led businesses turn knowledge into repeatable lead-generation systems. Leadio is the distillation of everything that consistently worked, assessment-first funnels, AI-guided challenges, and trust-based referral loops.</p>
              <p>Inside the Growth Accelerator, you get the same playbook used to launch challenges, build referral engines, and ascend offers across niches, without paid ads as the primary growth lever.</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[{ k: 10, suf: "+", v: "Years in growth" }, { k: 200, suf: "+", v: "Challenges launched" }, { k: 1, suf: ":1", v: "Built with operators" }].map((s) => (
                <div key={s.v} className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-2xl font-black text-primary"><CountUp to={s.k} suffix={s.suf} /></div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============== AUDIENCE ============== */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <Reveal className="mb-8">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Who it's for</div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AUDIENCE.map((a) => (
              <StaggerItem key={a}>
                <div className="rounded-xl border border-border bg-card px-4 py-5 text-center text-sm font-bold">{a}</div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== PRICING ============== */}
      <section className="mx-auto w-full max-w-3xl px-4 py-20 sm:py-24">
        <Reveal>
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
            <p className="mt-2 text-sm text-muted-foreground">Lifetime access · One-time payment</p>
            <Button onClick={handlePrimaryCta} className="mt-6 h-12 gap-2 px-8 text-base font-black uppercase">
              <Rocket className="h-4 w-4" />
              Enrol Here
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">14-day refund · Secure checkout · No recurring fees</p>
          </div>
        </Reveal>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="relative overflow-hidden border-t border-border">
        <AuroraBackdrop />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-24 text-center sm:py-32">
          <Reveal>
            <h2 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Build a{" "}
              <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">growth engine</span>{" "}
              instead of chasing leads.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Lifetime access to the full Leadio system. Assessment funnel, AI-guided challenge, referral engine, partner playbook — connected.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handlePrimaryCta} className="relative h-14 gap-2 px-8 text-base font-black uppercase shadow-2xl shadow-primary/40">
                  <motion.span animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }} className="absolute inset-0 -z-10 rounded-md bg-primary/30 blur-lg" />
                  <Rocket className="h-4 w-4" />
                  Enrol Here
                </Button>
              </motion.div>
              <Button onClick={scrollToCoupon} variant="outline" className="h-14 gap-2 px-6 text-sm font-black uppercase">
                <Tag className="h-4 w-4" /> Apply Partner Coupon
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> 14-day refund</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Secure checkout</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Lifetime updates</span>
              <span className="inline-flex items-center gap-1.5"><ArrowRight className="h-3.5 w-3.5 text-primary" /> Instant access</span>
            </div>
          </Reveal>
        </div>
      </section>

      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
              <Check className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-2xl font-black">Premium access confirmed</DialogTitle>
            <DialogDescription className="text-center">
              Your course area is ready. Jump in now to start the Premium Growth Accelerator.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2 font-black uppercase">
              <Link to="/blueprint/dashboard" onClick={() => setAccessOpen(false)}>
                Open Course
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => setAccessOpen(false)}>
              Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coupon success modal */}
      <Dialog open={couponSuccessOpen} onOpenChange={setCouponSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
              <Tag className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-2xl font-black">Coupon applied</DialogTitle>
            <DialogDescription className="text-center">
              Your access has been unlocked. Continue to enrol now.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gap-2 font-black uppercase"
              onClick={() => {
                setCouponSuccessOpen(false);
                handlePrimaryCta();
              }}
            >
              <Rocket className="h-4 w-4" />
              Continue to Enrol
            </Button>
            <Button variant="outline" size="lg" onClick={() => setCouponSuccessOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
    </>
  );
};

export default Premium;
