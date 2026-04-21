import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";

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
    { icon: Rocket, title: "Plan your challenge", desc: "Pick your idea. We'll shape it into a challenge." },
    { icon: Users, title: "Build with AI", desc: "Use AI to create your challenge flow & content." },
    { icon: TrendingUp, title: "Launch & grow", desc: "Share your challenge. It grows your audience for you." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Build an AI-powered challenge app that{" "}
                <span className="text-primary">grows your audience for you</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                In 3 days, create an app that attracts leads, guides users through a challenge, and grows through sharing.
              </p>
              <p className="text-base md:text-lg font-medium text-foreground/80">
                Build it once. Let it run and grow.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Cta label="Start building your app" section="hero" />
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
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      STEP {i + 1}
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

      {/* MOMENTUM */}
      <section className="px-6 py-20 md:py-24 border-t border-border">
        <Reveal className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Most people overthink building an app
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            The fastest builders don't plan for months — they ship. You'll shape your app as you go.
          </p>
        </Reveal>
      </section>

      {/* PROMISE */}
      <section className="px-6 py-16 md:py-20 bg-primary/5 border-y border-border">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="text-2xl md:text-4xl font-semibold tracking-tight leading-snug">
            In 3 days, you'll have an AI-powered challenge app that brings in new people{" "}
            <span className="text-primary">automatically.</span>
          </p>
        </Reveal>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Builders are launching apps right now
            </h2>
            <p className="text-muted-foreground">Live activity from the app builder community</p>
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
            Start building your app — it's free
          </h2>
          <p className="text-lg text-muted-foreground">
            Less than 30 seconds. No credit card. Just start building.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Cta label="Start building your app" section="bottom" />
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
    </div>
  );
};

export default Landing;
