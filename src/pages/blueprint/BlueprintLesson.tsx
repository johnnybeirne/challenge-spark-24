import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Crown, Lock, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { toast } from "sonner";
import { UpgradeCard } from "./BlueprintDashboard";
import { usePremium } from "@/hooks/usePremium";

type ModuleSlug = "1" | "2" | "3" | "4" | "5";

type FreeModule = {
  n: 1 | 2 | 3;
  locked: false;
  eyebrow: string;
  title: string;
  intro: string;
  takeaways: string[];
  prompt: string;
};

type PremiumModule = {
  n: 4 | 5;
  locked: true;
  eyebrow: string;
  title: string;
  teaser: string;
  previewBullets: string[];
  intro: string;
  takeaways: string[];
  prompt: string;
};

type LockedModule = PremiumModule;

type ModuleContent = FreeModule | LockedModule;

const MODULES: Record<ModuleSlug, ModuleContent> = {
  "1": {
    n: 1,
    locked: false,
    eyebrow: "Foundations",
    title: "Why Most Lead Generation Fails",
    intro:
      "Most lead generation fails because it asks for trust before it earns any. Cold ads, gated PDFs, and one-off webinars all skip the part where someone actually experiences working with you. The result: low-quality leads, weak conversion, and a list that doesn't convert.",
    takeaways: [
      "People don't buy from brands they don't yet trust.",
      "Standalone lead magnets create curiosity — not commitment.",
      "Real lead generation needs an experience, not just an opt-in.",
    ],
    prompt: "Where in your current lead generation are you asking for trust before you've earned it?",
  },
  "2": {
    n: 2,
    locked: false,
    eyebrow: "Growth Opportunity",
    title: "Trust-Based Lead Generation",
    intro:
      "Trust-based lead generation flips the model. Instead of pushing people toward an offer, you guide them through a small, structured experience where they get a real result with you first. By the time you talk about your offer, you've already proven you can help them.",
    takeaways: [
      "Trust compounds when people experience a small, real win.",
      "A short, structured journey beats a long, passive one.",
      "When trust comes first, sales conversations get easier.",
    ],
    prompt: "What small, structured experience could let your audience feel a win with you before they buy?",
  },
  "3": {
    n: 3,
    locked: false,
    eyebrow: "Referral Loops",
    title: "Building Referral Loops",
    intro:
      "Referral loops are what turn one engaged person into many. When the people you help feel the win, they want others to feel it too — but only if you make it easy for them to share. Strong referral loops are built into the experience, not bolted on at the end.",
    takeaways: [
      "Referrals come from delight, not from asking too early.",
      "Make sharing feel generous — not transactional.",
      "Build the loop into the experience, not as an afterthought.",
    ],
    prompt: "What's the most natural moment in your customer journey for someone to want to share?",
  },
  "4": {
    n: 4,
    locked: true,
    eyebrow: "Premium Module",
    title: "Advanced Challenge Systems",
    teaser:
      "Learn how high-converting challenge funnels combine AI implementation, trust loops, referrals, and behavioral momentum.",
    previewBullets: [
      "Advanced onboarding",
      "Viral challenge mechanics",
      "AI-guided implementation systems",
      "Conversion architecture",
    ],
    intro:
      "Advanced challenge systems combine onboarding design, viral mechanics, and AI-guided implementation into a single trust-based engine. You'll learn how to engineer momentum from day one and convert engagement into committed action.",
    takeaways: [
      "Onboarding is the highest-leverage point in any challenge funnel.",
      "Viral mechanics work when sharing creates value for the sharer.",
      "AI removes friction between intention and implementation.",
    ],
    prompt: "Where does your current funnel lose momentum — and how could AI-guided implementation close that gap?",
  },
  "5": {
    n: 5,
    locked: true,
    eyebrow: "Premium Module",
    title: "Scaling With Leadio",
    teaser:
      "Learn how to scale challenges using partners, affiliates, referrals, paid acquisition, and repeatable trust-based systems.",
    previewBullets: [
      "Partner systems",
      "Referral scaling",
      "Offer ascension",
      "Audience compounding",
      "Monetisation systems",
    ],
    intro:
      "Scaling with Leadio is about compounding — partners, referrals, and offer ascension stacked on a trust-based foundation. You'll design the systems that turn one challenge into a repeatable growth engine.",
    takeaways: [
      "Partners and affiliates compound reach without compounding ad spend.",
      "Offer ascension lets each cohort fund the next stage.",
      "Repeatable systems beat one-off launches every time.",
    ],
    prompt: "Which scaling lever — partners, referrals, or ascension — would unlock the most growth for you next?",
  },
};

const isFree = (m: ModuleContent): m is FreeModule => !m.locked;

const BlueprintLesson = () => {
  const { day } = useParams();
  const slug = (day ?? "") as ModuleSlug;
  const lesson = MODULES[slug] ?? null;
  if (!lesson) return <Navigate to="/blueprint/dashboard" replace />;

  const { state, setState } = useAppState();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const taskKey = `blueprint_lesson_${lesson.n}`;
  const completed = !!state.challenge.tasks[taskKey];
  const unlocked = !lesson.locked || isPremium;

  const markComplete = () => {
    const stamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: { ...prev.challenge.tasks, [taskKey]: true },
        aiOutputs: {
          ...prev.challenge.aiOutputs,
          [`${taskKey}_completed_at`]: stamp,
        },
      },
    }));
    toast.success(`Module ${lesson.n} complete`);
    if (lesson.n === 3) {
      // Bridge experience — do not auto-redirect, navigate intentionally.
      navigate("/blueprint/bridge");
    }
  };

  const nextHref = lesson.n < 5 ? `/blueprint/lesson/${lesson.n + 1}` : "/blueprint/dashboard";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <Link to="/blueprint/dashboard" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Course Home
      </Link>

      <header className="mt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          {lesson.locked ? <Lock className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          Module {lesson.n} · {lesson.eyebrow}
        </span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{lesson.title}</h1>
      </header>

      {isFree(lesson) ? (
        <>
          <article className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-base leading-8 text-foreground">{lesson.intro}</p>
          </article>

          <section className="mt-6 rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-primary">3 Key Takeaways</h2>
            <ul className="mt-4 space-y-3">
              {lesson.takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm leading-6 text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-primary">Reflect</h2>
            <p className="mt-3 text-base leading-7 text-foreground">{lesson.prompt}</p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {completed ? (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            ) : (
              <Button onClick={markComplete} className="h-11 px-6 text-sm font-black uppercase">
                Complete Module
              </Button>
            )}
            <Button asChild variant="outline" className="h-11 gap-2">
              <Link to={nextHref}>Next Module <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          {/* After Module 3, show challenge CTA */}
          {lesson.n === 3 && (
            <section className="mt-10 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
              <h3 className="text-xl font-black sm:text-2xl">You understand the system. Now implement it.</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The mini course shows you how trust-based growth works. The 3-Day Challenge helps you build it.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="h-12 gap-2 px-6 text-sm font-black uppercase">
                  <Link to="/blueprint/bridge">
                    Continue to Implementation <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-6 text-sm font-black uppercase">
                  <Link to="/blueprint/lesson/4">Keep Learning</Link>
                </Button>
              </div>
            </section>
          )}
        </>
      ) : (
        <LockedModuleView teaser={lesson.teaser} />
      )}

      <UpgradeCard />
    </main>
  );
};

const LockedModuleView = ({ teaser }: { teaser: string }) => (
  <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-card">
    <div className="relative">
      <div className="pointer-events-none select-none p-8 blur-sm">
        <p className="text-base leading-8 text-foreground">{teaser}</p>
        <div className="mt-6 space-y-2">
          <div className="h-3 w-5/6 rounded bg-muted" />
          <div className="h-3 w-4/6 rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <p className="max-w-md text-sm leading-6 text-foreground">{teaser}</p>
        <p className="text-xs font-bold text-muted-foreground">
          Use coupon code <span className="font-black text-primary">FOUNDING497</span>
        </p>
        <Button asChild className="h-12 gap-2 px-6 text-sm font-black uppercase">
          <Link to="/upgrade">
            <Rocket className="h-4 w-4" /> Unlock Full Course
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default BlueprintLesson;
