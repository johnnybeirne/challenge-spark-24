import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardCheck, Compass, Eye, Gauge, HelpCircle, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import frustratedEntrepreneurLeads from "@/assets/frustrated-entrepreneur-leads.jpg";

const PageSection = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const SectionHeader = ({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) => (
  <div className="mx-auto max-w-3xl text-center">
    <p className="text-sm font-black uppercase text-primary">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">{title}</h2>
    {body && <p className="mt-5 text-lg leading-8 text-muted-foreground">{body}</p>}
  </div>
);

const Landing = () => {
  const navigate = useNavigate();

  const startQuiz = (section: string) => {
    trackEvent("landing_cta_clicked", { section });
    navigate("/assess");
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <HeroSection onStart={() => startQuiz("hero")} />
      <ProblemSection />
      <RevealSection />
      <ScorePreview />
      <HowItWorks />
      <BenefitsSection />
      <AuthoritySection />
      <CTASection onStart={() => startQuiz("bottom")} />
      <StickyQuizButton onStart={() => startQuiz("sticky")} />
    </main>
  );
};

const StickyQuizButton = ({ onStart }: { onStart: () => void }) => (
  <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-5 py-3 shadow-[0_-10px_30px_hsl(var(--foreground)/0.06)] backdrop-blur sm:px-6">
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-center text-sm font-semibold text-muted-foreground sm:text-left">
        Ready to find the gap in your lead flow?
      </p>
      <Button className="h-12 w-full max-w-xs gap-2 rounded-xl px-7 text-sm font-black uppercase shadow-lg shadow-primary/20 sm:w-auto" onClick={onStart}>
        Start the quiz
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const HeroSection = ({ onStart }: { onStart: () => void }) => (
  <section className="px-5 py-8 sm:px-6 md:py-12 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
      <div className="text-center lg:text-left">
        <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm lg:mx-0">
          Free lead-flow diagnostic
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-base font-black uppercase leading-6 text-primary lg:mx-0">
          Built for coaches, consultants, and authors who want more leads
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
          Find out why your leads are inconsistent
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
          Answer nine quick questions and get a recommended strategy based on your answers. Instantly
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Button className="h-14 w-full max-w-sm gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20 sm:w-auto" onClick={onStart}>
            Start the quiz
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium text-muted-foreground">No signup required to get your diagnosis.</p>
        </div>
      </div>

      <div className="relative">
        <img
          src={frustratedEntrepreneurLeads}
          alt="Frustrated entrepreneur trying to understand where leads are coming from"
          width={1280}
          height={960}
          className="aspect-[4/3] w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-foreground/10 lg:aspect-[5/6]"
        />
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <p className="text-xs font-black uppercase text-primary">The real question</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-foreground">Is your lead flow inconsistent because of attention, trust, conversion, or follow-up?</p>
        </div>
      </div>
    </div>
  </section>
);

const ProblemSection = () => {
  const problems = ["Some weeks bring enquiries. Other weeks go quiet.", "You post, message, tweak, and still cannot tell what caused the result.", "More effort can hide the real bottleneck instead of fixing it."];

  return (
    <PageSection className="border-y border-border bg-card/55">
      <SectionHeader eyebrow="The problem" title="Lead flow should not feel like guesswork" body="When leads are inconsistent, most people try to do more. The better move is to diagnose what is actually missing." />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {problems.map((problem) => (
          <div key={problem} className="rounded-xl border border-border bg-background p-6 shadow-sm transition-transform hover:-translate-y-1">
            <HelpCircle className="h-6 w-6 text-primary" />
            <p className="mt-5 font-semibold leading-7 text-foreground">{problem}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
};

const RevealSection = () => (
  <PageSection>
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div>
        <p className="text-sm font-black uppercase text-primary">What the quiz reveals</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">Your inconsistency usually has one primary cause</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["You are not getting enough of the right attention", "People notice you but do not trust the next step", "Interest exists but conversion is unclear", "Follow-up depends too heavily on manual effort"].map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <Search className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="font-semibold leading-7 text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  </PageSection>
);

const ScorePreview = () => (
  <PageSection className="border-y border-border bg-card/55">
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="mx-auto flex size-64 items-center justify-center rounded-full bg-[conic-gradient(hsl(var(--success))_0_76%,hsl(var(--muted))_76%_100%)] p-6 [animation:donut-fill_1.4s_ease-out_both] lg:mx-0">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
          <span className="text-5xl font-black leading-none text-foreground">76%</span>
          <span className="mt-3 max-w-[10rem] text-sm font-black uppercase leading-5 text-muted-foreground">System readiness</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-black uppercase text-primary">Your result</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">Get a clear diagnosis, then a recommended strategy</h2>
        <div className="mt-6 space-y-3">
          {["Where your leads are leaking", "What system gap matters most", "What to do next based on your answers"].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
              <p className="font-semibold leading-7 text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PageSection>
);

const HowItWorks = () => {
  const steps = [
    { icon: ClipboardCheck, title: "Answer", body: "Nine quick questions about how leads currently find, trust, and choose you." },
    { icon: Gauge, title: "Diagnose", body: "See what is driving the inconsistency instead of guessing from surface symptoms." },
    { icon: Compass, title: "Act", body: "Move into the next step with a strategy matched to your diagnosis." },
  ];

  return (
    <PageSection>
      <SectionHeader eyebrow="How it works" title="A simple path from quiz to next step" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-black uppercase text-muted-foreground">0{index + 1}</span>
            </div>
            <h3 className="mt-6 text-xl font-black text-foreground">{step.title}</h3>
            <p className="mt-3 leading-7 text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
};

const BenefitsSection = () => (
  <PageSection className="border-y border-border bg-card/55">
    <SectionHeader eyebrow="Why take it" title="Know what to fix before you spend more effort" />
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {["Replace vague advice with a diagnosis", "See whether effort or system is the issue", "Understand your next practical move", "Continue cleanly into the full flow"].map((benefit) => (
        <div key={benefit} className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="mt-4 font-semibold leading-7 text-foreground">{benefit}</p>
        </div>
      ))}
    </div>
  </PageSection>
);

const AuthoritySection = () => (
  <PageSection>
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-7 text-center shadow-sm md:p-10">
      <Eye className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-5 text-2xl font-black leading-tight text-foreground sm:text-3xl">Built for people who need leads, not another theory</h2>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">The quiz is designed for founders, creators, consultants, and experts who want to understand what is making their lead flow unpredictable.</p>
    </div>
  </PageSection>
);

const CTASection = ({ onStart }: { onStart: () => void }) => (
  <PageSection className="border-t border-border">
    <div className="mx-auto max-w-3xl text-center">
      <TrendingUp className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">Find the gap in your lead flow</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Start with the quiz, get your diagnosis, then move into the next step with clarity.</p>
      <Button className="mt-8 h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={onStart}>
        Start the quiz
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </PageSection>
);

export default Landing;
