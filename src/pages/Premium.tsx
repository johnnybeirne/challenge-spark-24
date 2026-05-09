import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  Crown,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Lock,
  Megaphone,
  PieChart,
  Rocket,
  ShieldCheck,
  Share2,
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
import { Progress } from "@/components/ui/progress";
import { usePremium } from "@/hooks/usePremium";
import { setPremium, validateCoupon } from "@/lib/premium";
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
  { eyebrow: "Module 1", title: "Why Most Lead Generation Fails", body: "The hidden reasons funnels stall, and what high-trust offers do differently.", progress: 100 },
  { eyebrow: "Module 2", title: "Trust-Based Lead Generation", body: "Position expertise so the right buyers self-identify and ask to work with you.", progress: 80 },
  { eyebrow: "Module 3", title: "Building Referral Loops", body: "Engineer compounding word-of-mouth using built-in mechanics, not luck.", progress: 60 },
  { eyebrow: "Module 4", title: "Advanced Challenge Systems", body: "Design AI-guided challenges that drive completion, conversion, and case studies.", progress: 40, locked: true },
  { eyebrow: "Module 5", title: "Scaling With Leadio", body: "Partners, JV, affiliates, and paid acquisition layered on a referral-first base.", progress: 20, locked: true },
];

const AUDIENCE = ["Coaches", "Consultants", "Course creators", "Experts", "Community builders", "SaaS founders", "Agencies", "JV partners"];

const ASCENSION = [
  { label: "Assessment", icon: Target },
  { label: "Mini Course", icon: BookOpen },
  { label: "3-Day Challenge", icon: Workflow },
  { label: "Premium Course", icon: Crown },
  { label: "Coaching / Scale", icon: Rocket },
];

const PROBLEMS = [
  { icon: Flame, title: "Content burnout", body: "Posting endlessly and getting nothing back." },
  { icon: TrendingUp, title: "Expensive ads", body: "CPMs climb, conversions drop, ROAS shrinks." },
  { icon: Gauge, title: "Low conversions", body: "Cold traffic without trust never converts." },
  { icon: Users, title: "Passive audiences", body: "Followers who watch but never buy." },
  { icon: Activity, title: "Inconsistent leads", body: "Feast or famine — no compounding system." },
];

const ACTIVITY_FEED = [
  { who: "John", action: "invited Sarah", time: "2m" },
  { who: "Maya", action: "completed Day 2", time: "4m" },
  { who: "Devon", action: "unlocked Community", time: "7m" },
  { who: "Priya", action: "earned 3 referrals", time: "11m" },
];

const Premium = () => {
  const { isPremium, coupon } = usePremium();
  const { user } = useAuth();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; finalPrice: number; originalPrice: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0.85]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.97]);

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
                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                  <Check className="h-4 w-4" /> Premium access confirmed.
                  <Button asChild size="sm" variant="outline" className="ml-2">
                    <Link to="/blueprint/dashboard">Open Course</Link>
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Right: floating preview cards + coupon */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Floating mini cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 -top-6 z-10 hidden rounded-2xl border border-primary/30 bg-card/90 px-3 py-2 text-xs font-bold shadow-xl shadow-primary/10 backdrop-blur sm:flex sm:items-center sm:gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI prompt ready
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-12 z-10 hidden rounded-2xl border border-success/30 bg-card/90 px-3 py-2 text-xs font-bold shadow-xl shadow-success/10 backdrop-blur sm:flex sm:items-center sm:gap-2"
              >
                <Users className="h-3.5 w-3.5 text-success" /> +3 referrals
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-2 z-10 hidden rounded-2xl border border-fuchsia-400/30 bg-card/90 px-3 py-2 text-xs font-bold shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2"
              >
                <Flame className="h-3.5 w-3.5 text-fuchsia-400" /> Day 2 streak
              </motion.div>

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

                <div className="mt-6 rounded-2xl border border-border bg-background p-4">
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

      {/* ============== SECTION 1 — THE PROBLEM ============== */}
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

      {/* ============== SECTION 2 — LEADIO SYSTEM PATH ============== */}
      <section className="relative overflow-hidden">
        <AuroraBackdrop className="opacity-60" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary">The Leadio system</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl lg:text-5xl">The operating system for trust-based growth.</h2>
            <p className="mt-3 text-muted-foreground">Every stage activates the next. A connected journey from cold visitor to scaled partner.</p>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-5">
            {ASCENSION.map((step, i) => (
              <Reveal key={step.label} delay={i * 0.08} className="relative">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className={`relative rounded-2xl border p-5 ${i === 3 ? "border-primary/50 bg-primary/10 shadow-xl shadow-primary/20" : "border-border bg-card"}`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${i === 3 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stage {i + 1}</div>
                  <div className="mt-1 text-base font-black">{step.label}</div>
                  {i === 3 && (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                      className="absolute -inset-px rounded-2xl ring-1 ring-primary/40"
                    />
                  )}
                </motion.div>
                {i < ASCENSION.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    className="absolute right-[-14px] top-1/2 hidden h-[2px] w-7 origin-left bg-gradient-to-r from-primary/60 to-transparent lg:block"
                  />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WHAT YOU BUILD (existing pillars, animated) ============== */}
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

      {/* ============== SECTION 3 — AI + CHALLENGE IMPLEMENTATION ============== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary">AI + Implementation</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">People are implementing — not just learning.</h2>
            <p className="mt-3 text-muted-foreground">AI guidance, daily structure, and live challenge mechanics produce real outputs by Day 3.</p>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* AI prompt card */}
            <Reveal delay={0.05}>
              <motion.div whileHover={{ y: -6 }} className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xl shadow-primary/10">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-3.5 w-3.5" /> AI Copilot</div>
                <div className="mt-4 rounded-2xl border border-border bg-background/80 p-4 text-sm">
                  <div className="text-xs font-bold text-muted-foreground">Day 2 prompt</div>
                  <div className="mt-2 leading-6">"Draft 3 hooks that frame your offer as a diagnostic, not a pitch."</div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} className="inline-block h-2 w-2 rounded-full bg-primary" /> Generating ideas…</div>
              </motion.div>
            </Reveal>

            {/* Challenge progress card */}
            <Reveal delay={0.1}>
              <motion.div whileHover={{ y: -6 }} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Workflow className="h-3.5 w-3.5" /> Challenge progress</div>
                <div className="mt-4 space-y-3">
                  {[{ d: "Day 1 — Setup", v: 100 }, { d: "Day 2 — Build", v: 70 }, { d: "Day 3 — Launch", v: 25 }].map((row) => (
                    <div key={row.d}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{row.d}</span><span className="text-muted-foreground">{row.v}%</span>
                      </div>
                      <Progress value={row.v} className="mt-1.5 h-2" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </Reveal>

            {/* Streak / unlock card */}
            <Reveal delay={0.15}>
              <motion.div whileHover={{ y: -6 }} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Flame className="h-3.5 w-3.5" /> Streak & unlocks</div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black"><CountUp to={3} /></span>
                  <span className="text-sm font-bold text-muted-foreground">day streak</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["Community", "Mentor", "Rewards"].map((u, i) => (
                    <div key={u} className={`rounded-xl border p-2 text-center text-[10px] font-black uppercase ${i < 2 ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground"}`}>{u}</div>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== SECTION 4 — REFERRAL ENGINE ============== */}
      <section className="relative overflow-hidden border-y border-border bg-gradient-to-b from-muted/20 via-background to-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Referral engine</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">A trust ecosystem that compounds while you sleep.</h2>
              <p className="mt-3 text-muted-foreground">Built-in invite mechanics, viral loops, and unlock progression turn customers into a distribution channel.</p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {["Invite flow", "Viral loops", "Trust sharing", "Unlock progression", "Reward cards", "Live participants"].map((t) => (
                  <li key={t} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold">
                    <Check className="h-4 w-4 text-success" /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Live activity feed */}
            <Reveal delay={0.1}>
              <div className="relative rounded-3xl border border-primary/20 bg-card/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Bell className="h-3.5 w-3.5" /> Live activity</div>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                  </motion.span>
                </div>
                <div className="mt-4 space-y-2">
                  {ACTIVITY_FEED.map((item, i) => (
                    <motion.div
                      key={item.who}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12, duration: 0.5 }}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">{item.who[0]}</div>
                        <div><span className="font-bold">{item.who}</span> <span className="text-muted-foreground">{item.action}</span></div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="text-lg font-black text-primary"><CountUp to={1284} /></div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Invites</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="text-lg font-black text-primary"><CountUp to={412} /></div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Joined</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="text-lg font-black text-primary"><CountUp to={98} suffix="%" /></div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Trust</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== MODULES (animated premium cards) ============== */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Course modules</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">5 modules. One coherent system.</h2>
            </div>
            <Layers className="hidden h-10 w-10 text-primary/50 sm:block" />
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <StaggerItem key={m.title}>
                <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className={`group relative h-full overflow-hidden rounded-2xl border p-6 ${m.locked ? "border-border bg-card" : "border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-lg shadow-primary/10"}`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Crown className="h-3 w-3" /> {m.eyebrow}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black leading-snug">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.body}</p>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <span>{m.locked ? "Locked" : "Preview"}</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${m.progress}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }} className="h-full bg-gradient-to-r from-primary to-fuchsia-400" />
                    </div>
                  </div>
                  {m.locked && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[10px] font-black text-muted-foreground backdrop-blur">
                      <Lock className="h-3 w-3" /> Premium
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== WHY DIFFERENT (kept) ============== */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Why this is different</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Education, AI, implementation, and referrals — connected.</h2>
              <p className="mt-4 text-muted-foreground">
                Most courses teach theory and stop. Leadio connects what you learn to AI-guided implementation, a working challenge funnel, and a referral system that compounds — so the things you build keep producing leads after the course ends.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
                <StaggerGroup className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: BookOpen, title: "Education", body: "Frameworks that explain why trust beats tactics." },
                    { icon: Sparkles, title: "AI Guidance", body: "Prompts and copilots tuned for your offer." },
                    { icon: Workflow, title: "Implementation", body: "A 3-day challenge format you can re-run." },
                    { icon: Users, title: "Referrals", body: "Loops that turn customers into a channel." },
                  ].map(({ icon: Icon, title, body }) => (
                    <StaggerItem key={title}>
                      <div className="rounded-2xl border border-border bg-background p-5">
                        <Icon className="h-5 w-5 text-primary" />
                        <h4 className="mt-3 text-sm font-black">{title}</h4>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== TRAINER (kept) ============== */}
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

      {/* ============== AUDIENCE (kept) ============== */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AUDIENCE.map((a) => (
              <StaggerItem key={a}>
                <div className="rounded-xl border border-border bg-card px-4 py-5 text-center text-sm font-bold">{a}</div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============== SECTION 6 — PARTNER / JV ============== */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Partner / JV ready</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Designed to be promoted.</h2>
              <p className="mt-3 text-muted-foreground">Coupon codes, partner attribution, assessment-first traffic, and a built-in challenge bridge make it easy to plug into an existing audience.</p>
              <div className="mt-6 flex gap-3">
                <Button asChild variant="outline"><Link to="/partners">Become a partner</Link></Button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Megaphone className="h-3.5 w-3.5" /> Partner flow</div>
                <div className="mt-5 space-y-2">
                  {[
                    { icon: Share2, label: "Partner landing page", v: 100 },
                    { icon: Tag, label: "Coupon applied", v: 88 },
                    { icon: Target, label: "Assessment completed", v: 64 },
                    { icon: Workflow, label: "Challenge started", v: 41 },
                    { icon: Crown, label: "Premium unlocked", v: 22 },
                  ].map((row, i) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="rounded-2xl border border-border bg-background/60 p-3"
                    >
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="inline-flex items-center gap-2"><row.icon className="h-4 w-4 text-primary" /> {row.label}</span>
                        <span className="text-xs text-muted-foreground">{row.v}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${row.v}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 + i * 0.08 }} className="h-full bg-gradient-to-r from-primary to-fuchsia-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== SECTION 7 — LIVE BUSINESS INTELLIGENCE ============== */}
      <section className="relative overflow-hidden">
        <AuroraBackdrop className="opacity-50" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Operator dashboard</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Run it like a real growth operation.</h2>
            <p className="mt-3 text-muted-foreground">The same intelligence layer used to track funnels, challenge participation, and referral compounding in real time.</p>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {[
              { icon: TrendingUp, label: "Active builders", v: 412 },
              { icon: BarChart3, label: "Conversion", v: 38, suf: "%" },
              { icon: PieChart, label: "Referral share", v: 64, suf: "%" },
              { icon: LineChart, label: "MRR growth", v: 21, suf: "%" },
            ].map((kpi, i) => (
              <Reveal key={kpi.label} delay={i * 0.06}>
                <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <span>{kpi.label}</span>
                    <kpi.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 text-3xl font-black text-primary">
                    <CountUp to={kpi.v} suffix={kpi.suf || ""} />
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Funnel velocity</div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Last 30 days</span>
                </div>
                {/* Inline animated bar chart */}
                <div className="mt-6 flex h-44 items-end gap-2">
                  {[28, 42, 36, 58, 49, 72, 64, 81, 70, 92, 88, 96].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.04, ease: "easeOut" }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 via-primary to-fuchsia-400/80"
                    />
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-3xl border border-border bg-card p-6">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Stage distribution</div>
                <div className="mt-5 space-y-3">
                  {[
                    { l: "Assessment", v: 100 },
                    { l: "Mini Course", v: 72 },
                    { l: "Challenge", v: 48 },
                    { l: "Premium", v: 24 },
                    { l: "Coaching", v: 9 },
                  ].map((row, i) => (
                    <div key={row.l}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{row.l}</span><span className="text-muted-foreground">{row.v}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${row.v}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.08 }} className="h-full bg-gradient-to-r from-primary to-cyan-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== PRICING (kept) ============== */}
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

      {/* ============== SECTION 8 — FINAL CTA ============== */}
      <section className="relative overflow-hidden border-t border-border">
        <AuroraBackdrop />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-24 text-center sm:py-32">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Final step
            </div>
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
    </main>
  );
};

export default Premium;
