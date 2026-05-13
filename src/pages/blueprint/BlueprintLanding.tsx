import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, Sparkles, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAppState } from "@/context/AppContext";

const BlueprintLanding = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const cta = state.user ? "/blueprint/dashboard" : "/blueprint-join?redirect=/blueprint/dashboard";

  return (
    <>
      <SEO title="Free Training" description="3 short lessons on how challenges create engagement, leads, and growth — with an AI-powered personalised insight." canonical="/free-training" />
      <main className="min-h-screen bg-background pb-24 text-foreground">
      {/* Hero */}
      <section className="px-5 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Discover How Challenges Could Grow Your Business
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            A free free training that helps you understand how challenges can create engagement, leads, accountability, and growth for your audience.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={() => navigate(cta)}>
              Get Free Access <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#whats-inside" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              See what's inside →
            </a>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section id="whats-inside" className="border-y border-border bg-card/50 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase text-primary">What you'll learn</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">3 short lessons. One personalised insight.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { n: 1, icon: Zap, title: "Why Challenges Work", body: "Understand why challenges create momentum, engagement, accountability, and action." },
              { n: 2, icon: Target, title: "The Challenge Growth Opportunity", body: "Learn how challenges turn attention into leads, trust, community, and sales conversations." },
              { n: 3, icon: Compass, title: "Your Challenge Fit", body: "Tell us what problem you solve and who you help, then get AI-powered recommendations." },
            ].map(({ n, icon: Icon, title, body }) => (
              <div key={n} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black uppercase text-muted-foreground">Lesson {n}</span>
                </div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">From curious to clarity in under 15 minutes</h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {["Sign up free and open your dashboard", "Read 3 short lessons (about 4 minutes each)", "Submit your problem & audience to get an AI insight"].map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-black uppercase text-muted-foreground">Step 0{i + 1}</span>
                <p className="mt-3 font-semibold leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Example AI insight */}
      <section className="border-y border-border bg-card/50 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-black uppercase text-primary">Example AI insight</p>
          <h2 className="mt-3 text-center text-3xl font-black sm:text-4xl">Personalised to your audience</h2>
          <div className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h3 className="text-base font-black">Suggested Challenge Angle</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              A 5-day "First Client Sprint" for new coaches — each day a tiny action that ends with one real outreach message sent. Public commitment + daily wins makes participants share and refer.
            </p>
            <h3 className="mt-5 text-base font-black">Engagement Hook</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              "Get your first paying client in 5 days — even if no one knows your name yet."
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Users className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">Built for coaches, consultants, creators, and experts</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            If you have an audience (or want one) and want a clearer way to turn attention into trust and leads, this free training will give you a fast, focused starting point.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <BookOpen className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-4 text-3xl font-black sm:text-4xl md:text-5xl">Get your Challenge Growth Blueprint</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">Free access. No credit card. Instant AI insight after Lesson 3.</p>
          <Button className="mt-8 h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={() => navigate(cta)}>
            Get Free Access <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
    </>
  );
};

export default BlueprintLanding;
