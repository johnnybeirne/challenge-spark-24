import { type ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  CHALLENGE_SALES_KEY,
  CHALLENGE_SALES_PAGE,
  CHALLENGE_SALES_SECTION,
  byPosition,
  parseChallengeSales,
  renderDay,
} from "@/lib/challengeSalesContent";

const Section = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-5xl">{children}</div>
  </section>
);

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-[var(--h1-size)] font-black leading-tight text-foreground">{children}</h2>
);

const ChallengeLanding = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { map, loaded } = useSiteContent(CHALLENGE_SALES_PAGE);
  const c = useMemo(
    () => parseChallengeSales(map[`${CHALLENGE_SALES_SECTION}.${CHALLENGE_SALES_KEY}`]),
    [map],
  );

  const join = (section: string) => {
    trackEvent("landing_cta_clicked", { section });
    navigate(`/challenge/join${search}`);
  };

  const Cta = ({ label, under, section }: { label: string; under: string; section: string }) => (
    <div className="flex flex-col items-center gap-3">
      <Button
        className="h-auto min-h-14 w-full max-w-full gap-2 whitespace-normal rounded-xl px-6 py-4 text-center text-[var(--body-size)] font-black uppercase leading-snug shadow-lg shadow-primary/20 sm:w-auto sm:px-8"
        onClick={() => join(section)}
      >
        <span>
          {label}
          <ArrowRight className="ml-2 inline h-4 w-4 align-[-2px]" />
        </span>
      </Button>
      {under && <p className="text-center text-[var(--body-size)] text-muted-foreground">{renderDay(under)}</p>}
    </div>
  );

  if (!loaded) return <main className="min-h-screen bg-background" />;

  const testimonials = byPosition(c.testimonials.items).filter((t) => t.quote.trim());

  return (
    <>
      <SEO title="Free 3-Day Challenge" description={c.hero.subheadline} canonical="/challenge" />
      <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {c.hero.show && (
          <Section className="pt-12 md:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-wide text-primary">{c.hero.kicker}</p>
              <h1 className="mt-5 text-[var(--h1-size)] font-black leading-[1.05] text-foreground">{c.hero.headline}</h1>
              <p className="mt-5 text-[var(--h2-size)] leading-8 text-muted-foreground">{c.hero.subheadline}</p>
              <div className="mt-8"><Cta label={c.hero.button} under={c.hero.underButton} section="challenge_hero" /></div>
            </div>
          </Section>
        )}

        {c.problem.show && (
          <Section className="border-y border-border bg-card/55">
            <div className="mx-auto max-w-3xl text-center">
              <H2>{c.problem.heading}</H2>
              <p className="mt-5 text-[var(--h2-size)] leading-8 text-muted-foreground">{c.problem.body}</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {byPosition(c.problem.cards).map((card) => (
                <div key={card.id} className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <h3 className="text-[var(--h2-size)] font-black text-foreground">{card.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{card.body}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {c.fix.show && (
          <Section>
            <div className="mx-auto max-w-3xl text-center">
              <H2>{c.fix.heading}</H2>
              <p className="mt-5 text-[var(--h2-size)] leading-8 text-muted-foreground">{c.fix.body}</p>
            </div>
          </Section>
        )}

        {c.days.show && (
          <Section className="border-y border-border bg-card/55">
            <div className="text-center"><H2>{c.days.heading}</H2></div>
            <div className="mt-10 space-y-4">
              {byPosition(c.days.items).map((d, i) => (
                <article key={d.id} className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{i + 1}</div>
                  <div>
                    <h3 className="text-[var(--h2-size)] font-black text-foreground">{d.title}</h3>
                    <p className="mt-2 leading-7 text-muted-foreground">{d.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        )}

        {c.walkAway.show && (
          <Section>
            <div className="mx-auto max-w-2xl">
              <div className="text-center"><H2>{c.walkAway.heading}</H2></div>
              <ul className="mt-8 space-y-3">
                {byPosition(c.walkAway.items).map((it) => (
                  <li key={it.id} className="flex items-start gap-3 text-[var(--h2-size)] leading-8">
                    <Check className="mt-1.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {c.whoFor.show && (
          <Section className="border-y border-border bg-card/55">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-6">
                <h3 className="text-[var(--h2-size)] font-black">{c.whoFor.forHeading}</h3>
                <ul className="mt-4 space-y-3">
                  {byPosition(c.whoFor.forItems).map((it) => (
                    <li key={it.id} className="flex gap-3 leading-7"><Check className="mt-1 h-5 w-5 shrink-0 text-primary" />{it.text}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-background p-6">
                <h3 className="text-[var(--h2-size)] font-black">{c.whoFor.notForHeading}</h3>
                <ul className="mt-4 space-y-3">
                  {byPosition(c.whoFor.notForItems).map((it) => (
                    <li key={it.id} className="flex gap-3 leading-7 text-muted-foreground"><X className="mt-1 h-5 w-5 shrink-0" />{it.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        )}

        {c.guide.show && (
          <Section>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center md:flex-row md:text-left">
              {c.guide.photoUrl && <img src={c.guide.photoUrl} alt={c.guide.heading} className="h-32 w-32 shrink-0 rounded-full object-cover" />}
              <div>
                <H2>{c.guide.heading}</H2>
                <p className="mt-4 text-[var(--h2-size)] leading-8 text-muted-foreground">{c.guide.body}</p>
              </div>
            </div>
          </Section>
        )}

        {c.testimonials.show && testimonials.length > 0 && (
          <Section className="border-y border-border bg-card/55">
            <div className="text-center"><H2>{c.testimonials.heading}</H2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-xl border border-border bg-background p-6">
                  <blockquote className="leading-7">"{t.quote}"</blockquote>
                  <figcaption className="mt-4 text-sm font-bold">{t.name}{t.role && <span className="font-normal text-muted-foreground">, {t.role}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {c.faq.show && c.faq.items.length > 0 && (
          <Section>
            <div className="mx-auto max-w-2xl">
              <div className="text-center"><H2>{c.faq.heading}</H2></div>
              <Accordion type="single" collapsible className="mt-8">
                {byPosition(c.faq.items).map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="text-left text-[var(--body-size)] font-bold">{f.question}</AccordionTrigger>
                    <AccordionContent className="leading-7 text-muted-foreground">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Section>
        )}

        {c.finalCall.show && (
          <Section className="border-t border-border">
            <div className="mx-auto max-w-3xl text-center">
              <H2>{c.finalCall.heading}</H2>
              <div className="mt-8"><Cta label={c.finalCall.button} under={c.finalCall.underButton} section="challenge_bottom" /></div>
            </div>
          </Section>
        )}
      </main>
    </>
  );
};

export default ChallengeLanding;
