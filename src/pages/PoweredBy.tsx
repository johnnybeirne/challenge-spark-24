import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import ReferralGrowthNetwork from "@/components/ReferralGrowthNetwork";
import ReferralGrowthNetworkHorizontal from "@/components/ReferralGrowthNetworkHorizontal";
import { GraduationCap, Briefcase, Monitor, Mic } from "lucide-react";
import leadbeadLogo from "@/assets/leadbead-logo.png";

/** Fade-up on scroll via IntersectionObserver. */
function Reveal({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    transitionDelay: `${delay}ms`,
    transitionDuration: "600ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionProperty: "opacity, transform",
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(24px)",
    willChange: "opacity, transform",
  };

  // @ts-expect-error – dynamic tag ref typing
  return <As ref={ref} className={className} style={style}>{children}</As>;
}

const growthEngineOverlays = [
  {
    range: "0–25%",
    title: "You build your 3-day challenge.",
    body: "Define your audience, your result, and your experience. LeadBead guides every step.",
  },
  {
    range: "25–50%",
    title: "A quiz funnel brings people in.",
    body: "A personalised quiz attracts the right people and converts them into participants before they even start.",
  },
  {
    range: "50–75%",
    title: "Your challenge excites them to invite others.",
    body: "Participants who love your challenge share it. Every invite is powered by genuine enthusiasm.",
  },
  {
    range: "75–100%",
    title: "Their invites bring in more.",
    body: "Second and third level referrals compound automatically. Your challenge grows itself.",
  },
];

const stepCards = [
  {
    n: "01",
    title: "Lock in your audience",
    body: "Define who you help and the problem your challenge solves.",
  },
  {
    n: "02",
    title: "Build the experience",
    body: "Create the quiz and challenge flow that captures leads.",
  },
  {
    n: "03",
    title: "Launch and grow",
    body: "Share it with referral mechanics that help it spread.",
  },
];

const audience = [
  { Icon: GraduationCap, title: "A live lead-building challenge", body: "Not a theory or worksheet — a real app people can join." },
  { Icon: Briefcase, title: "A guided path for participants", body: "Each day moves people closer to the outcome they want." },
  { Icon: Monitor, title: "A built-in growth loop", body: "Referral prompts help your challenge keep spreading." },
  { Icon: Mic, title: "Built for experts", body: "Coaches, consultants, course creators, speakers, and authors who want leads without the grind." },
];

const tiers = [
  { name: "Starter", label: "Just getting started" },
  { name: "Builder", label: "Building momentum" },
  { name: "Growth Partner", label: "Actively growing" },
  { name: "Featured Creator", label: "Recognised contributor" },
  { name: "Strategic Partner", label: "Top of the network" },
];

export default function PoweredBy() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-neutral-900 antialiased selection:bg-primary/40">
      <SEO
        title="LeadBead — Build your own lead generation system in 3 days"
        description="LeadBead teaches coaches, consultants, and experts how to build an evergreen 3-day challenge — with a quiz funnel that attracts leads and a referral loop that keeps it growing."
        canonical="/powered-by"
      />

      {/* Page-scoped keyframes (no Tailwind config edits) */}
      <style>{`
        @keyframes pb-aurora {
          0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .55; }
          50%     { transform: translate3d(2%, -2%, 0) scale(1.08); opacity: .8; }
        }
        @keyframes pb-aurora-alt {
          0%,100% { transform: translate3d(0,0,0) scale(1.05); opacity: .45; }
          50%     { transform: translate3d(-3%, 3%, 0) scale(1); opacity: .7; }
        }
      `}</style>

      {/* SECTION 1 — HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent 70%)",
              animation: "pb-aurora 14s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-[-200px] right-[-100px] h-[700px] w-[700px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(24 90% 55% / 0.12), transparent 70%)",
              animation: "pb-aurora-alt 18s ease-in-out infinite",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <Reveal>
            <img
              src={leadbeadLogo}
              alt="LeadBead"
              className="mx-auto mb-6 h-24 w-auto md:h-32"
            />
          </Reveal>
          <Reveal delay={25}>
            <ReferralGrowthNetworkHorizontal className="mx-auto mb-10 max-w-3xl" />
          </Reveal>
          <Reveal delay={50}>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Free 3-day builder challenge
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Turn trust into a lead engine{" "}
              <span className="text-primary">
                that grows itself.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-neutral-700 md:text-xl">
              Build a challenge in 3 days where people get a real result, and feel excited to
              invite others along the way.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SECTION 2 — GROWTH ENGINE */}
      <section className="relative border-t border-primary/10 bg-primary/[0.03] px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.25em] text-primary">
              The LeadBead growth engine
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mb-16 text-center text-3xl font-semibold tracking-tight md:text-5xl">
              How your challenge grows itself.
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {growthEngineOverlays.map((o, i) => (
              <Reveal
                key={o.range}
                delay={i * 100}
                className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white p-8"
              >
                <div className="mb-6 text-xs font-mono font-semibold uppercase tracking-wider text-primary/70">
                  {o.range}
                </div>
                <h3 className="mb-3 text-xl font-semibold leading-snug">{o.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{o.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="relative border-t border-primary/10 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-16 text-center text-3xl font-semibold tracking-tight md:text-5xl">
              How it works
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {stepCards.map((s, i) => (
              <Reveal
                key={s.n}
                delay={i * 100}
                className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-white p-8 transition-colors hover:border-primary/30"
              >
                <div className="mb-6 text-5xl font-semibold text-primary/80 md:text-6xl">
                  {s.n}
                </div>
                <h3 className="mb-3 text-xl font-semibold md:text-2xl">{s.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{s.body}</p>
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — REFERRAL ENGINE */}
      <section className="relative border-t border-primary/10 bg-primary/[0.03] px-6 py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Why it works
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                People do not just consume content. They participate.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-lg text-neutral-700 leading-relaxed">
                The challenge gives your audience a clear next step, captures intent, and
                encourages sharing as part of the experience.
              </p>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-primary/10 bg-white p-6">
              <ReferralGrowthNetwork />
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 5 — WHO IT'S FOR */}
      <section className="relative border-t border-primary/10 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-16 text-center text-3xl font-semibold tracking-tight md:text-5xl">
              Built for experts who want leads, not admin.
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {audience.map((a, i) => (
              <Reveal
                key={a.title}
                delay={i * 100}
                className="rounded-2xl border border-primary/10 bg-white p-8 transition-colors hover:border-primary/30"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <a.Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold md:text-2xl">{a.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{a.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — POINTS & PROGRESSION */}
      <section className="relative border-t border-primary/10 bg-primary/[0.03] px-6 py-32">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Built-in motivation
            </p>
          </Reveal>
          <Reveal delay={50}>
            <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
              Participants earn. You grow.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-700">
              LeadBead challenges come with a built-in points system. Participants earn points
              for completing tasks and inviting others. The more engaged they are, the more
              they share.
            </p>
          </Reveal>

          <div className="relative mt-16">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent md:left-1/2" />
            <ul className="space-y-5">
              {tiers.map((t, i) => {
                const highlight = i === 2;
                return (
                  <Reveal
                    key={t.name}
                    delay={i * 90}
                    as="li"
                    className="relative flex items-center gap-5 md:justify-center"
                  >
                    <div
                      className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        highlight
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/20 bg-white text-neutral-700"
                      }`}
                      style={
                        highlight
                          ? { boxShadow: "0 0 40px hsl(var(--primary) / 0.45)" }
                          : undefined
                      }
                    >
                      {i + 1}
                    </div>
                    <div
                      className={`flex-1 rounded-xl border p-5 md:max-w-md ${
                        highlight
                          ? "border-primary/40 bg-primary/[0.08]"
                          : "border-primary/10 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-lg font-semibold">{t.name}</div>
                        <div className="text-sm text-neutral-500">{t.label}</div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FINAL CTA */}
      <section className="relative overflow-hidden border-t border-primary/10 bg-primary px-6 py-32 text-primary-foreground md:py-40">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(255 255 255 / 0.18), transparent 70%)",
              animation: "pb-aurora 16s ease-in-out infinite",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Start building your challenge
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-lg text-primary-foreground/85 md:text-xl">
              Join the 3-day builder challenge, or take the quiz first if you want a
              recommended strategy.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-base">
                <Link to="/">Join the challenge</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-primary-foreground/40 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/assessment">Take the quiz</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-primary/10 bg-[#FAFAF7] px-6 py-10">
        <p className="text-center text-xs text-neutral-500">
          This challenge was built on{" "}
          <Link to="/powered-by" className="text-primary underline-offset-4 hover:underline">
            LeadBead
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
