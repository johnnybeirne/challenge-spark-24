import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Users, TrendingUp, ArrowRight, Target, Magnet, Share2, Zap, Compass, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";
import HowItWorksScroll from "@/components/HowItWorksScroll";

const useReveal = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, shown };
};

const Reveal = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const useScrollDepth = () => {
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const fired = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement;
      const pct = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
      milestones.forEach((m) => {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          trackEvent("landing_scroll_depth", { depth: m });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
};

const Landing = () => {
  const navigate = useNavigate();
  useScrollDepth();

  useEffect(() => {
    trackEvent("landing_viewed");
  }, []);

  const Cta = ({
    label,
    section,
    className = "",
  }: {
    label: string;
    section: string;
    className?: string;
  }) => (
    <Button
      size="lg"
      className={`bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all font-semibold ${className}`}
      onClick={() => {
        trackEvent("landing_cta_clicked", { section });
        navigate("/join", { state: { mode: "signup" } });
      }}
    >
      {label}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );

  const steps = [
    { icon: Rocket, title: "Lock In Your Audience", desc: "Define who you help. Walk away with a ready-to-use lead-building challenge." },
    { icon: Users, title: "Get It Live in Minutes", desc: "AI-powered building does the heavy lifting. No overwhelm, no blank page." },
    { icon: TrendingUp, title: "Launch and Get Leads", desc: "Share once. Leads come in. Sharing is built in." },
  ];

  const whyPoints = [
    { icon: Target, title: "Attracts the right people", desc: "Built around a real problem your audience already wants solved." },
    { icon: Magnet, title: "Captures leads immediately", desc: "Every signup is a lead. No extra funnel needed." },
    { icon: Share2, title: "Grows through sharing", desc: "Participants invite others. Reach compounds on its own." },
  ];

  const outcomePoints = [
    { icon: Zap, title: "A live challenge that brings in leads", desc: "Up and running. Pulling people in from day one." },
    { icon: Compass, title: "A system that guides people", desc: "Each day moves them forward. You don't have to babysit it." },
    { icon: Repeat, title: "A built-in growth loop", desc: "Sharing is part of the experience. Reach keeps climbing." },
  ];

  const comparisonRows = [
    { old: "Post content every day and hope it converts", new: "Launch one AI-powered challenge that brings in leads continuously" },
    { old: "Build complex funnels that take weeks", new: "Get a simple challenge live in minutes" },
    { old: "Pay for traffic to get leads", new: "Let participants invite others and grow your leads organically" },
    { old: "Passive audience consuming content", new: "Active participants moving through a guided experience" },
    { old: "Growth stops when you stop posting", new: "Your challenge keeps growing as people share it" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* AUDIENCE STRIP */}
      <div className="border-b border-border bg-foreground/[0.03]">
        <p className="mx-auto max-w-6xl px-6 py-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">
          Built for <span className="text-foreground">coaches, consultants, and authors</span> who want more leads without relying on ads or social media
        </p>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Get more leads with an AI-powered challenge that{" "}
                <span className="text-primary">grows itself</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Launch an AI-powered challenge that pulls in leads and grows every time someone shares it.
              </p>
              <div className="space-y-2 pt-1">
                <p className="text-base md:text-lg font-semibold text-foreground">Launch in 3 days.</p>
                <p className="text-base md:text-lg font-semibold text-foreground">Leads come in on autopilot.</p>
                <p className="text-base md:text-lg font-semibold text-foreground">Every share brings more.</p>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Cta label="Start your challenge" section="hero" />
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold border-2 border-foreground"
                    onClick={() => {
                      trackEvent("landing_cta_clicked", { section: "hero_login" });
                      navigate("/join");
                    }}
                  >
                    Already started? Log in
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="md:pl-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                Join the 3-Day Challenge
              </div>
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-2xl md:text-3xl font-mono font-bold text-muted-foreground leading-none">
                      DAY {i + 1}
                    </span>
                    <h3 className="font-semibold text-foreground mt-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT ACTUALLY WORKS — scroll story */}
      <HowItWorksScroll />

      {/* WHY THIS WORKS */}
      <section className="px-6 py-20 md:py-24 border-t border-border">
        <Reveal className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Why this works
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Planning kills momentum. A live challenge gets you leads. Every shared link gets you more.
          </p>
          <ul className="grid sm:grid-cols-3 gap-5 pt-6 text-left">
            {whyPoints.map((p) => (
              <li
                key={p.title}
                className="group relative p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md mb-4">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* WHY THIS IS DIFFERENT */}
      <section className="px-6 py-20 md:py-24 border-t border-border">
        <Reveal className="mx-auto max-w-5xl space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Why this is different
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Most people try to grow with content, funnels, or ads. This works differently.
            </p>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-5 px-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Old way
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              New way
            </div>
          </div>

          <ul className="space-y-4">
            {comparisonRows.map((row) => (
              <li key={row.new} className="grid md:grid-cols-2 gap-4 md:gap-5">
                <div className="relative p-5 md:p-6 rounded-2xl border border-border bg-card/40">
                  <span className="md:hidden block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Old way
                  </span>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-muted-foreground/60 text-lg leading-none">✕</span>
                    <p className="text-muted-foreground line-through decoration-muted-foreground/30">
                      {row.old}
                    </p>
                  </div>
                </div>

                <div className="relative p-5 md:p-6 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/[0.03] shadow-sm">
                  <span className="md:hidden block text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
                    New way
                  </span>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                      ✓
                    </span>
                    <p className="font-semibold text-foreground">
                      {row.new}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* OUTCOME */}
      <section className="px-6 py-20 md:py-24 bg-primary/5 border-y border-border">
        <Reveal className="mx-auto max-w-5xl text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            What you will have in 3 days
          </h2>
          <ul className="grid sm:grid-cols-3 gap-5 pt-4 text-left">
            {outcomePoints.map((p, i) => (
              <li
                key={p.title}
                className="group relative p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all"
              >
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold shadow-md">
                  {i + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md mb-4">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Live right now
            </h2>
            <p className="text-muted-foreground">Builders launching challenges and getting leads</p>
          </Reveal>
          <Reveal>
            <ActivityFeed />
          </Reveal>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 py-20 md:py-28 border-t border-border">
        <Reveal className="mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Start your challenge, it is free
          </h2>
          <p className="text-lg text-muted-foreground">
            Live in minutes. No credit card. Just go.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Cta label="Start your challenge" section="bottom" />
            <Button
              size="lg"
              variant="outline"
              className="font-semibold border-2 border-foreground"
              onClick={() => {
                trackEvent("landing_cta_clicked", { section: "bottom_login" });
                navigate("/join");
              }}
            >
              Already started? Log in
            </Button>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 py-8">
        <p className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          © 2026 Leadio
        </p>
      </footer>
    </div>
  );
};

export default Landing;
