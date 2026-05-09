import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Compass, Flag, MessageCircle, Rocket, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";

const LESSONS = [
  {
    n: 1,
    slug: "1",
    icon: Zap,
    eyebrow: "Foundations",
    title: "Why Challenges Work",
    body: "Understand how challenges create momentum, engagement, accountability, and action.",
  },
  {
    n: 2,
    slug: "2",
    icon: Target,
    eyebrow: "Growth Opportunity",
    title: "The Challenge Growth Opportunity",
    body: "Learn how challenges turn attention into trust, leads, and sales conversations.",
  },
  {
    n: 3,
    slug: "3",
    icon: Compass,
    eyebrow: "Your Insight",
    title: "Your Personalised Insight",
    body: "Get AI-powered recommendations based on your audience and business.",
  },
];

const BlueprintDashboard = () => {
  const { state } = useAppState();
  const tasks = state.challenge.tasks;
  const insight = state.challenge.aiOutputs?.blueprint_insight;
  const completed = LESSONS.filter((l) => tasks[`blueprint_lesson_${l.n}`]).length;
  const pct = Math.round((completed / LESSONS.length) * 100);
  const nextLesson = LESSONS.find((l) => !tasks[`blueprint_lesson_${l.n}`]) ?? LESSONS[2];
  const firstName = state.user?.name?.split(" ")[0] || "there";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 lg:py-12">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Challenge Growth Blueprint
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">Welcome back, {firstName}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Explore how challenges can create engagement, leads, accountability, and growth for your business.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <span>Blueprint Progress</span><span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Button asChild className="mt-6 h-12 gap-2 px-6 text-sm font-black uppercase">
          <Link to={`/blueprint/lesson/${nextLesson.slug}`}>
            Continue Learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {LESSONS.map(({ n, slug, icon: Icon, eyebrow, title, body }) => {
          const done = tasks[`blueprint_lesson_${n}`];
          return (
            <Link
              key={n}
              to={`/blueprint/lesson/${slug}`}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
                )}
              </div>
              <h3 className="mt-4 text-base font-black">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
            </Link>
          );
        })}
      </section>

      {/* 3-Day Challenge link */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Your 3-Day Challenge</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Continue building your challenge, quiz, and AI-powered system.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/user-dashboard">Go to Challenge</Link>
          </Button>
        </div>
      </section>

      {/* AI insight status */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black">Your AI Insight</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {insight ? "Your personalised insight is ready." : "Complete the final lesson to generate your insight."}
            </p>
          </div>
          <Button asChild variant={insight ? "default" : "outline"} size="sm" className="shrink-0">
            <Link to={insight ? "/blueprint/insight" : "/blueprint/lesson/3"}>
              {insight ? "View Insight" : "Generate"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Mentor */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Ask the Mentor</h3>
              <p className="mt-1 text-sm text-muted-foreground">Have a question about your audience or business?</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0"><Link to="/mentor">Open</Link></Button>
        </div>
      </section>

      {/* Upgrade CTA */}
      <UpgradeCard />
    </main>
  );
};

export const UpgradeCard = () => (
  <section className="mt-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background p-6 sm:p-8">
    <div className="flex items-start gap-3">
      <Rocket className="h-6 w-6 text-primary" />
      <div>
        <h3 className="text-xl font-black sm:text-2xl">Want the Full Challenge Growth System?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You've found your opportunity. Now get the complete system to design, launch, and grow your challenge.
        </p>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
      <span className="text-3xl font-black">Free</span>
      <span className="text-sm text-muted-foreground line-through">$497 value</span>
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-success">with coupon</span>
    </div>
    <p className="mt-2 text-xs font-bold text-muted-foreground">Coupon: <span className="font-black text-primary">FOUNDING497</span></p>
    <Button asChild className="mt-5 h-12 w-full text-base font-black uppercase sm:w-auto sm:px-8">
      <Link to="/upgrade">Unlock the Full System</Link>
    </Button>
  </section>
);

export default BlueprintDashboard;
