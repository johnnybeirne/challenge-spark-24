import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Compass, Crown, Flag, Lock, MessageCircle, Rocket, Sparkles, Target, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/AppContext";
import { usePremium } from "@/hooks/usePremium";
import { useUserState } from "@/hooks/useUserState";

export const PREMIUM_LOCK_MESSAGE =
  "This is a premium module. Upgrade to unlock Advanced Challenge Systems and the full Leadio growth system.";

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
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const tasks = state.challenge.tasks;
  const insight = state.challenge.aiOutputs?.blueprint_insight;
  const freeModules = MODULES.filter((m) => !m.locked);
  const completed = freeModules.filter((m) => tasks[`blueprint_lesson_${m.n}`]).length;
  const pct = Math.round((completed / freeModules.length) * 100);
  const nextModule = freeModules.find((m) => !tasks[`blueprint_lesson_${m.n}`]) ?? freeModules[freeModules.length - 1];
  const firstName = state.user?.name?.split(" ")[0] || "there";

  const handleLockedClick = () => {
    toast.message("Premium module locked", { description: PREMIUM_LOCK_MESSAGE });
    navigate("/upgrade");
  };

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
          const isLocked = locked && !isPremium;
          const done = !isLocked && tasks[`blueprint_lesson_${n}`];
          const cardInner = (
            <>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isLocked ? <Lock className="h-5 w-5" /> : locked ? <Crown className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {locked ? "Premium" : `Module ${n}`}
                  </span>
                )}
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-primary">
                {locked && isPremium ? "Premium · Unlocked" : eyebrow}
              </p>
              <h3 className="mt-1 text-base font-black">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
              {isLocked && (
                <p className="mt-3 text-[11px] font-bold text-primary">Unlock Full Course →</p>
              )}
            </>
          );

          if (isLocked) {
            return (
              <button
                key={n}
                type="button"
                onClick={handleLockedClick}
                aria-label={`${title} — premium module locked`}
                title={PREMIUM_LOCK_MESSAGE}
                className="group relative rounded-2xl border border-primary/30 bg-card p-5 text-left shadow-sm opacity-70 transition-all hover:opacity-100 hover:border-primary/60 hover:shadow-md"
              >
                {cardInner}
              </button>
            );
          }

          return (
            <Link
              key={n}
              to={`/blueprint/lesson/${slug}`}
              className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
            >
              {cardInner}
            </Link>
          );
        })}
      </section>

      {/* Implement-it CTA after free modules — state aware */}
      <ImplementCta />


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

const ImplementCta = () => {
  const { hasJoinedChallenge, isPremiumUser } = useUserState();

  const { title, body, ctaLabel, ctaHref } = hasJoinedChallenge
    ? {
        title: "Your 3-Day Challenge is in progress",
        body: "Pick up where you left off and keep building your trust-based growth system.",
        ctaLabel: "Continue Your Challenge",
        ctaHref: "/user-dashboard",
      }
    : isPremiumUser
    ? {
        title: "Apply this in the 3-Day Challenge",
        body: "Take the premium frameworks and put them into action with the guided 3-day build.",
        ctaLabel: "Start the 3-Day Challenge",
        ctaHref: "/blueprint/bridge",
      }
    : {
        title: "Ready to implement?",
        body: "The mini course shows you how trust-based growth works. The 3-Day Challenge helps you build it.",
        ctaLabel: "Start the 3-Day Challenge",
        ctaHref: "/blueprint/bridge",
      };

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        <Button asChild variant={hasJoinedChallenge ? "default" : "outline"} size="sm" className="shrink-0">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
};

export const UpgradeCard = () => {
  const { isPremium } = usePremium();
  if (isPremium) {
    return (
      <section className="mt-6 rounded-3xl border border-success/30 bg-success/5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Crown className="h-6 w-6 text-success" />
          <div>
            <h3 className="text-xl font-black sm:text-2xl">Premium Unlocked</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You have full access to Modules 4 & 5 — Advanced Challenge Systems and Scaling With Leadio.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-5 h-11 gap-2">
          <Link to="/blueprint/lesson/4">Open Module 4 <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </section>
    );
  }
  return (
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
};

export default BlueprintDashboard;
