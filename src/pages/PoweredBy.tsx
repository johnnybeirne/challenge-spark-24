import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { GraduationCap, Briefcase, Monitor, Mic } from "lucide-react";

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

const stepCards = [
  {
    n: "01",
    title: "Take the quiz",
    body: "Visitors answer a short diagnostic quiz and receive a personalised result. They become a lead before they even start.",
  },
  {
    n: "02",
    title: "Complete the 3-day challenge",
    body: "Three days of guided action, AI coaching, and real momentum. Participants build something real and valuable.",
  },
  {
    n: "03",
    title: "Invite others to unlock rewards",
    body: "Every participant gets a unique referral link. Inviting others earns them points and unlocks bonuses. Your challenge grows automatically.",
  },
];

const audience = [
  { Icon: GraduationCap, title: "Coaches", body: "Turn your methodology into an evergreen challenge that attracts ideal clients." },
  { Icon: Briefcase, title: "Consultants", body: "Generate qualified B2B leads with a challenge built around a real business problem." },
  { Icon: Monitor, title: "Course creators", body: "Use a 3-day challenge as your top-of-funnel. Build trust before you sell." },
  { Icon: Mic, title: "Speakers and trainers", body: "Demonstrate your expertise and grow your list with every challenge you run." },
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
    <div className="min-h-screen bg-[#070708] text-white antialiased selection:bg-primary/40">
      <SEO
        title="LeadBead — The lead generation system that grows itself"
        description="LeadBead is an evergreen 3-day challenge for coaches, consultants, and experts. Build once. Grow through referrals. Generate leads automatically."
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
        @keyframes pb-orbit {
          0%   { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes pb-glow {
          0%,100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.35), 0 0 40px hsl(var(--primary) / 0.35); }
          50%     { box-shadow: 0 0 0 8px hsl(var(--primary) / 0.0),  0 0 60px hsl(var(--primary) / 0.55); }
        }
        .pb-dot {
          offset-path: path('M 150 30 L 280 240 L 20 240 Z');
          offset-rotate: 0deg;
          animation: pb-orbit 6s linear infinite;
        }
      `}</style>

      {/* SECTION 1 — HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary) / 0.35), transparent 70%)",
              animation: "pb-aurora 14s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-[-200px] right-[-100px] h-[700px] w-[700px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(24 90% 55% / 0.25), transparent 70%)",
              animation: "pb-aurora-alt 18s ease-in-out infinite",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#070708_75%)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <Reveal>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/50">
              Powered by LeadBead
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              The lead generation system{" "}
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                that grows itself.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/70 md:text-xl">
              LeadBead is an evergreen 3-day challenge for coaches, consultants, and experts.
              Build once. Grow through referrals. Generate leads automatically.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link to="/">Build your challenge free</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 2 — CORE IDEA */}
      <section className="relative px-6 py-32 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Your challenge teaches people{" "}
              <span className="text-primary">to run a challenge.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/70 md:text-xl">
              Every participant who joins yours learns how to build their own. And every one
              of them is rewarded for inviting others. The result is a lead generation system
              that compounds over time without you doing more work.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section className="relative border-t border-white/5 px-6 py-32">
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
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="mb-6 text-5xl font-semibold text-primary/80 md:text-6xl">
                  {s.n}
                </div>
                <h3 className="mb-3 text-xl font-semibold md:text-2xl">{s.title}</h3>
                <p className="text-white/65 leading-relaxed">{s.body}</p>
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — REFERRAL ENGINE */}
      <section className="relative border-t border-white/5 px-6 py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Built-in growth
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Every participant becomes a promoter.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                LeadBead challenges come with a referral engine built in. Participants earn
                points for inviting others. Points unlock rewards, content, and status. No ads
                required. No cold outreach. Just a system that rewards sharing.
              </p>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6">
              <svg viewBox="0 0 300 280" className="h-full w-full">
                <defs>
                  <linearGradient id="pb-line" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <path
                  d="M 150 30 L 280 240 L 20 240 Z"
                  fill="none"
                  stroke="url(#pb-line)"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
                {/* Nodes */}
                {[
                  { x: 150, y: 30, label: "You launch", anchor: "middle", dy: -16 },
                  { x: 280, y: 240, label: "Participants invite", anchor: "end", dy: 28 },
                  { x: 20, y: 240, label: "Challenge grows", anchor: "start", dy: 28 },
                ].map((n) => (
                  <g key={n.label}>
                    <circle cx={n.x} cy={n.y} r="10" fill="hsl(var(--primary))" />
                    <circle cx={n.x} cy={n.y} r="18" fill="none" stroke="hsl(var(--primary) / 0.3)" />
                    <text
                      x={n.x}
                      y={n.y + n.dy}
                      textAnchor={n.anchor}
                      fill="white"
                      fillOpacity="0.85"
                      fontSize="13"
                      fontWeight="500"
                    >
                      {n.label}
                    </text>
                  </g>
                ))}
              </svg>
              {/* Travelling dot along the triangle */}
              <div
                className="pb-dot absolute left-6 top-6 h-3 w-3 rounded-full bg-primary"
                style={{ animation: "pb-orbit 6s linear infinite, pb-glow 2s ease-in-out infinite" }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 5 — WHO IT'S FOR */}
      <section className="relative border-t border-white/5 px-6 py-32">
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
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <a.Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold md:text-2xl">{a.title}</h3>
                <p className="text-white/65 leading-relaxed">{a.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — POINTS & PROGRESSION */}
      <section className="relative border-t border-white/5 px-6 py-32">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
              Participants earn. You grow.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/70">
              LeadBead has a built-in points system. Participants earn points for completing
              challenge tasks and inviting others. Points never expire and unlock access to
              bonuses, content, and community. The more engaged your participants, the more
              they share.
            </p>
          </Reveal>

          <div className="relative mt-16">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent md:left-1/2" />
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
                          : "border-white/15 bg-[#0c0c10] text-white/70"
                      }`}
                      style={
                        highlight
                          ? { boxShadow: "0 0 40px hsl(var(--primary) / 0.55)" }
                          : undefined
                      }
                    >
                      {i + 1}
                    </div>
                    <div
                      className={`flex-1 rounded-xl border p-5 md:max-w-md ${
                        highlight
                          ? "border-primary/40 bg-primary/[0.06]"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-lg font-semibold">{t.name}</div>
                        <div className="text-sm text-white/55">{t.label}</div>
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
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-32 md:py-40">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary) / 0.35), transparent 70%)",
              animation: "pb-aurora 16s ease-in-out infinite",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Ready to build a challenge that grows itself?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-lg text-white/70 md:text-xl">
              Join LeadBead and launch your evergreen challenge in 3 days.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link to="/">Start building free</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-5 text-sm text-white/45">
              No credit card required. Your challenge. Your audience.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-white/5 px-6 py-10">
        <p className="text-center text-xs text-white/45">
          This challenge was built on{" "}
          <Link to="/powered-by" className="text-white/80 underline-offset-4 hover:underline">
            LeadBead
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
