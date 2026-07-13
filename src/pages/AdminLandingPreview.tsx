import { useMemo, useState } from "react";
import { ArrowRight, Calendar, CheckCircle2, Rocket, Target, TrendingUp, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAppState } from "@/context/AppContext";
import { getCompletionDayName } from "@/lib/utils";

const FALLBACKS = {
  challengeName: "Your 3-Day Challenge",
  audience: "people ready to make a change",
  outcome: "a clear result in three days",
  problem: "what is holding them back",
  day1: "Get clear on your goal and the exact result you want by the end of the challenge.",
  day2: "Put the plan into action with a guided step you can complete today.",
  day3: "Lock it in and set yourself up to keep going with confidence.",
};

const PreviewBanner = ({ onClose }: { onClose: () => void }) => (
  <div className="sticky top-0 z-50 w-full border-b border-amber-300 bg-amber-50 px-4 py-3">
    <div className="mx-auto flex max-w-4xl items-start gap-3">
      <div className="flex-1 rounded-lg border border-amber-300 bg-white/70 p-3 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
          Landing page preview
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-amber-900">
          This is a preview of your challenge landing page. Your participants will see this when they join.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss preview banner"
        className="mt-1 rounded-md p-1.5 text-amber-800 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const AdminLandingPreview = () => {
  const { state } = useAppState();
  const [bannerOpen, setBannerOpen] = useState(true);

  const { challengeName, audience, outcome, problem } = useMemo(() => {
    const mem = state.memory ?? ({} as any);
    const outputs = state.challenge?.aiOutputs ?? {};
    let setup: any = {};
    const raw = (outputs as any)["day1Setup"];
    if (raw) {
      try {
        setup = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        setup = {};
      }
    }
    const pick = (v: unknown, fb: string) => {
      const s = (v ?? "").toString().trim();
      return s || fb;
    };
    return {
      challengeName: pick(mem.challengeName, FALLBACKS.challengeName),
      audience: pick(setup.audience, FALLBACKS.audience),
      outcome: pick(setup.outcome, FALLBACKS.outcome),
      problem: pick(setup.problem, FALLBACKS.problem),
    };
  }, [state.memory, state.challenge]);

  const completionDayName = getCompletionDayName();

  const days = [
    { icon: Rocket, label: "Day 1", title: "Get clear", body: FALLBACKS.day1 },
    { icon: Users, label: "Day 2", title: "Take action", body: FALLBACKS.day2 },
    { icon: TrendingUp, label: "Day 3", title: "Lock it in", body: FALLBACKS.day3 },
  ];

  return (
    <>
      <SEO title={`${challengeName} — Preview`} description="Preview of your challenge landing page." canonical="/admin/landing-preview" />
      {bannerOpen && <PreviewBanner onClose={() => setBannerOpen(false)} />}
      <main className="min-h-screen bg-background text-foreground">
        {/* HERO */}
        <section className="px-5 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              3-Day Challenge
            </p>
            <h1 className="mt-5 text-[var(--h1-size)] font-black leading-[1.05] tracking-tight text-foreground">
              {challengeName}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[var(--h2-size)] leading-8 text-muted-foreground">
              For {audience} who want {outcome}.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                disabled
                className="h-14 gap-2 rounded-xl px-8 text-[var(--body-size)] font-black uppercase shadow-lg shadow-primary/20"
              >
                Join the challenge
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Start today and be set up by {completionDayName}.
              </p>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="border-y border-border bg-card/55 px-5 py-16 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              The problem
            </p>
            <h2 className="mt-4 text-[var(--h1-size)] font-black leading-tight text-foreground">
              If you're stuck on {problem}, you're not alone.
            </h2>
            <p className="mt-5 text-[var(--h2-size)] leading-8 text-muted-foreground">
              This 3-day challenge gives you a guided path to move past it and reach {outcome}.
            </p>
          </div>
        </section>

        {/* WHAT YOU GET / DAYS */}
        <section className="px-5 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-wider text-primary">
                What you'll do
              </p>
              <h2 className="mt-4 text-[var(--h1-size)] font-black leading-tight text-foreground">
                Three days. One clear result.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {days.map((d) => (
                <article
                  key={d.label}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <d.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase text-primary">{d.label}</p>
                  <h3 className="mt-1 text-[var(--h2-size)] font-black text-foreground">{d.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{d.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* OUTCOME */}
        <section className="border-t border-border px-5 py-16 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Target className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-5 text-[var(--h1-size)] font-black leading-tight text-foreground">
              By {completionDayName}, you'll have {outcome}.
            </h2>
            <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left">
              {[
                `A plan built around ${audience}.`,
                `A clear way past ${problem}.`,
                `Real progress toward ${outcome}.`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-[var(--body-size)] leading-7 text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-5 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Calendar className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-5 text-[var(--h1-size)] font-black leading-tight text-foreground">
              Ready to start {challengeName}?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[var(--h2-size)] leading-8 text-muted-foreground">
              Join today and be set up by {completionDayName}.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                disabled
                className="h-14 gap-2 rounded-xl px-8 text-[var(--body-size)] font-black uppercase shadow-lg shadow-primary/20"
              >
                Join the challenge
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AdminLandingPreview;
