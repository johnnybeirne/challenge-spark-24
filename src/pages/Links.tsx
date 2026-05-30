import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";
import { SEO } from "@/components/SEO";

type Card = { title: string; route: string; description: string; badge?: string };

const ASSESSMENT_CARDS: Card[] = [
  { title: "Challenge Assessment", route: "/assessment", description: "Same Leadio assessment → routes users into the 3-Day Challenge after results.", badge: "challenge" },
  { title: "Free Training Assessment", route: "/free-assessment", description: "Same assessment → routes users into the Free Course after results.", badge: "free_training" },
  { title: "Premium Course Assessment", route: "/premium-assessment", description: "Same assessment → routes users into the Premium Growth Accelerator after results.", badge: "premium_course" },
  { title: "Premium Assessment with Coupon", route: "/premium-assessment?coupon=FOUNDING497", description: "Premium assessment with coupon preserved through results into checkout.", badge: "premium_course + coupon" },
];

const ENROLMENT_CARDS: Card[] = [
  { title: "Join the 3-Day Challenge", route: "/challenge/join", description: "Direct challenge signup." },
  { title: "Enrol in Free Training", route: "/free-training/enrol", description: "Direct free course enrolment." },
  { title: "Enrol in Premium", route: "/premium/enrol", description: "Direct premium course enrolment." },
];

const INTERNAL_CARDS: Card[] = [
  { title: "Product Overview", route: "/owner-console/overview?tab=audit", description: "Features, workflow, and route audit in one place.", badge: "admin" },
];

const Section = ({ title, cards }: { title: string; cards: Card[] }) => (
  <section className="mt-12">
    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <Link
          key={c.route}
          to={c.route}
          className="group flex items-start justify-between gap-4 rounded-2xl border-2 border-foreground bg-card p-5 transition-colors hover:bg-foreground hover:text-background"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black">{c.title}</h3>
              {c.badge && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-background/80">
                  {c.badge.includes("coupon") && <Tag className="h-3 w-3" />} {c.badge}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground group-hover:text-background/80">{c.description}</p>
            <p className="mt-2 font-mono text-xs text-muted-foreground group-hover:text-background/80">{c.route}</p>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
    </div>
  </section>
);

const Links = () => {
  const enableFreePreview = () => {
    import("@/lib/previewTier").then(({ setPreviewTier }) => {
      setPreviewTier("free");
      window.location.href = "/free-assessment?previewTier=free";
    });
  };
  const enablePaidPreview = () => {
    import("@/lib/previewTier").then(({ setPreviewTier }) => {
      setPreviewTier("paid");
      window.location.href = "/challenger-dashboard?previewTier=paid";
    });
  };
  const clearPreview = () => {
    import("@/lib/previewTier").then(({ setPreviewTier }) => {
      setPreviewTier(null);
      window.location.href = "/challenger-dashboard";
    });
  };
  return (
    <>
      <SEO title="Link Directory" description="One assessment, three entry URLs, three destinations. Use these to send the right traffic to the right funnel." canonical="/links" />
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black sm:text-4xl">Leadio link directory</h1>
        <p className="mt-2 text-base text-muted-foreground">
          One assessment, three entry URLs, three destinations. Use these to send the right traffic to the right funnel.
        </p>

        <Section title="Assessment entries" cards={ASSESSMENT_CARDS} />
        <Section title="Direct enrolment" cards={ENROLMENT_CARDS} />
        <Section title="Internal / Admin" cards={INTERNAL_CARDS} />

        <section className="mt-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preview Mode (Dev / Admin)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Temporarily simulate a tier without changing the real account or subscription. Session-only override — resolves before subscription state.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={enableFreePreview}
              className="rounded-2xl border-2 border-amber-500 bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-amber-950 transition-colors hover:bg-amber-400"
            >
              Free
            </button>
            <button
              onClick={enablePaidPreview}
              className="rounded-2xl border-2 border-emerald-500 bg-emerald-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Paid
            </button>
            <button
              onClick={clearPreview}
              className="rounded-2xl border-2 border-foreground bg-card px-5 py-3 text-sm font-black uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Clear Preview
            </button>
          </div>
        </section>
      </div>
    </main>
    </>
  );
};

export default Links;
