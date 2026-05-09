import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Compass, Flag, Lock, MessageCircle, Rocket, Sparkles, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";

type ModuleEntry = {
  n: number;
  slug: string;
  icon: typeof Zap;
  eyebrow: string;
  title: string;
  body: string;
  locked: boolean;
};

const MODULES: ModuleEntry[] = [
  { n: 1, slug: "1", icon: Zap, eyebrow: "Foundations", title: "Why Most Lead Generation Fails",
    body: "See why traditional lead generation breaks down — and what to do instead.", locked: false },
  { n: 2, slug: "2", icon: Target, eyebrow: "Growth Opportunity", title: "Trust-Based Lead Generation",
    body: "Learn the model that turns attention into trust before any sales conversation.", locked: false },
  { n: 3, slug: "3", icon: Users, eyebrow: "Referral Loops", title: "Building Referral Loops",
    body: "Design referral loops into the experience so growth compounds naturally.", locked: false },
  { n: 4, slug: "4", icon: BookOpen, eyebrow: "Premium Module", title: "Advanced Challenge Systems",
    body: "Advanced systems behind high-converting challenge funnels and AI-guided implementation.", locked: true },
  { n: 5, slug: "5", icon: Rocket, eyebrow: "Premium Module", title: "Scaling With Leadio",
    body: "Scale with partners, referrals, paid offers, and repeatable Leadio growth loops.", locked: true },
];

const BlueprintDashboard = () => {
  const { state } = useAppState();
  const tasks = state.challenge.tasks;
  const insight = state.challenge.aiOutputs?.blueprint_insight;
  const freeModules = MODULES.filter((m) => !m.locked);
  const completed = freeModules.filter((m) => tasks[`blueprint_lesson_${m.n}`]).length;
  const pct = Math.round((completed / freeModules.length) * 100);
  const nextModule = freeModules.find((m) => !tasks[`blueprint_lesson_${m.n}`]) ?? freeModules[freeModules.length - 1];
  const firstName = state.user?.name?.split(" ")[0] || "there";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 lg:py-12">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Leadio Mini Course
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">Challenge Growth Blueprint</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Welcome back, {firstName}. Learn how challenges can create engagement, leads, referrals, and trust before you start building.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <span>Learning Progress</span><span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="h-12 gap-2 px-6 text-sm font-black uppercase">
            <Link to={`/blueprint/lesson/${nextModule.slug}`}>
              Continue Learning <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 gap-2 px-6 text-sm font-black uppercase">
            <Link to="/blueprint/insight">
              <Compass className="h-4 w-4" /> Get My Insight
            </Link>
          </Button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {MODULES.map(({ n, slug, icon: Icon, eyebrow, title, body, locked }) => {
          const done = !locked && tasks[`blueprint_lesson_${n}`];
          return (
            <Link
              key={n}
              to={locked ? `/blueprint/lesson/${slug}` : `/blueprint/lesson/${slug}`}
              className={`group relative rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                locked ? "border-primary/30 hover:border-primary/60" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${locked ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"}`}>
                  {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Module {n}
                  </span>
                )}
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-primary">{eyebrow}</p>
              <h3 className="mt-1 text-base font-black">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
              {locked && (
                <p className="mt-3 text-[11px] font-bold text-primary">Unlock Full Course →</p>
              )}
            </Link>
          );
        })}
      </section>

      {/* Implement-it CTA after free modules */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Ready to implement?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The mini course shows you how trust-based growth works. The 3-Day Challenge helps you build it.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/user-dashboard">Join the 3-Day Challenge</Link>
          </Button>
        </div>
      </section>

      {/* AI insight status */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black">My Insight</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {insight ? "Your personalised insight is ready." : "Answer three quick questions to generate your insight."}
            </p>
          </div>
          <Button asChild variant={insight ? "default" : "outline"} size="sm" className="shrink-0">
            <Link to="/blueprint/insight">
              {insight ? "View Insight" : "Get My Insight"}
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
              <h3 className="text-base font-black">Leadio Growth Mentor</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask questions about lead generation, trust-based growth, referrals, and challenge strategy.
              </p>
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
        <h3 className="text-xl font-black sm:text-2xl">Unlock the Full Course</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Premium Modules 4 & 5 cover advanced challenge systems and how to scale with Leadio.
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
      <Link to="/upgrade">Unlock Full Course</Link>
    </Button>
  </section>
);

export default BlueprintDashboard;
