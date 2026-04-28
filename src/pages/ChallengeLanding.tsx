import { type ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Compass, Magnet, Repeat, Rocket, Share2, Target, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActivityFeed from "@/components/ActivityFeed";
import { trackEvent } from "@/lib/analytics";

const Section = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-16 sm:px-6 md:py-24 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const flowSteps = [
  {
    icon: Rocket,
    day: "Day 1",
    title: "Lock in your audience",
    body: "Define who you help and the problem your challenge solves.",
  },
  {
    icon: Users,
    day: "Day 2",
    title: "Build the experience",
    body: "Create the quiz and challenge flow that captures leads.",
  },
  {
    icon: TrendingUp,
    day: "Day 3",
    title: "Launch and grow",
    body: "Share it with referral mechanics that help it spread.",
  },
];

const WordTypewriter = ({ text, active, delay = 0 }: { text: string; active: boolean; delay?: number }) => {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!active) return;

    setVisibleChars(0);
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisibleChars((current) => {
          if (current >= text.length) {
            if (interval) window.clearInterval(interval);
            return current;
          }

          return current + 1;
        });
      }, 45);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [active, delay, text.length]);

  if (!active) return <span className="opacity-0">{text}</span>;

  return (
    <span>
      {text.slice(0, visibleChars)}
      {visibleChars < text.length && <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 animate-pulse bg-primary" />}
    </span>
  );
};

const AnimatedDayCards = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="relative space-y-4">
      <div className="absolute left-11 top-16 hidden h-[calc(100%-8rem)] w-0.5 overflow-hidden rounded-full bg-border sm:block">
        <div
          className="w-full rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)] transition-[height] duration-[2100ms] ease-out"
          style={{ height: isVisible ? "100%" : "0%", transitionDelay: isVisible ? "650ms" : "0ms" }}
        />
      </div>

      {flowSteps.map((step, index) => {
        const cardDelay = [0, 3200, 6100][index];
        const textDelay = index === 0 ? 200 : index === 2 ? 220 : 0;
        const isFinal = index === 2;

        return (
          <article
            key={step.title}
            className={`relative z-10 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-lg ${
              isVisible ? "translate-y-0 scale-100 opacity-100" : `${isFinal ? "scale-95" : "translate-y-5"} opacity-0`
            }`}
            style={{ transitionDelay: isVisible ? `${cardDelay}ms` : "0ms" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-primary">{step.day}</p>
                <h2
                  className={`mt-1 text-xl font-black text-foreground transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
                  style={{ transitionDelay: isVisible ? `${cardDelay + textDelay}ms` : "0ms" }}
                >
                  {step.title}
                </h2>
                <p
                  className={`mt-2 min-h-[3.5rem] leading-7 text-muted-foreground transition-opacity duration-500 sm:min-h-0 ${isVisible ? "opacity-100" : "opacity-0"}`}
                  style={{ transitionDelay: isVisible ? `${cardDelay + textDelay + 120}ms` : "0ms" }}
                >
                  <WordTypewriter text={step.body} active={isVisible} delay={cardDelay + textDelay + 120} />
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const ChallengeLanding = () => {
  const navigate = useNavigate();

  const joinChallenge = (section: string) => {
    trackEvent("landing_cta_clicked", { section });
    navigate("/join", { state: { mode: "signup" } });
  };

  const startQuiz = () => {
    trackEvent("landing_cta_clicked", { section: "challenge_assessment" });
    navigate("/assess");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="px-5 py-10 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-black uppercase text-primary shadow-sm lg:mx-0">
              Free 3-day builder challenge
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
              Turn trust into a lead engine that grows itself
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
              Build a live challenge app with a quiz entry point, daily tasks, and referral loops designed to bring in qualified leads.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={() => joinChallenge("challenge_hero")}>Join the challenge<ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" className="h-14 rounded-xl px-8 text-base font-black uppercase" onClick={startQuiz}>Take the quiz first</Button>
            </div>
            <ActivityFeed title="Live builder activity" className="mx-auto mt-8 max-w-md text-left lg:mx-0" />
          </div>

          <AnimatedDayCards />
        </div>
      </section>

      <Section className="border-y border-border bg-card/55">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-primary">Why it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">People do not just consume content. They participate.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">The challenge gives your audience a clear next step, captures intent, and encourages sharing as part of the experience.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Target, title: "Attracts the right people", body: "Built around a real problem your audience already wants solved." },
            { icon: Magnet, title: "Captures leads immediately", body: "Every signup is a lead with clear context attached." },
            { icon: Share2, title: "Grows through sharing", body: "Participants invite others, so reach can compound." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 text-xl font-black text-foreground">{item.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: "A live lead-building challenge", body: "Not a theory or worksheet — a real app people can join." },
            { icon: Compass, title: "A guided path for participants", body: "Each day moves people closer to the outcome they want." },
            { icon: Repeat, title: "A built-in growth loop", body: "Referral prompts help your challenge keep spreading." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <item.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-5 text-xl font-black text-foreground">{item.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <Calendar className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">Start building your challenge</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Join the 3-day builder challenge, or take the quiz first if you want a recommended strategy.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={() => joinChallenge("challenge_bottom")}>Join the challenge<ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="h-14 rounded-xl px-8 text-base font-black uppercase" onClick={startQuiz}>Take the quiz</Button>
          </div>
        </div>
      </Section>
    </main>
  );
};

export default ChallengeLanding;
