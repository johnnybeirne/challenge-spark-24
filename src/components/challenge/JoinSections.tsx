import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, HelpCircle, Quote, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/premium/cinematic";
import johnnyPortrait from "@/assets/johnny-beirne.png";
import { byPosition, renderDay, type ChallengeSalesContent } from "@/lib/challengeSalesContent";

const PageSection = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const Header = ({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) => (
  <div className="mx-auto max-w-3xl text-center">
    {eyebrow && <p className="text-xs font-black uppercase tracking-widest text-primary">{renderDay(eyebrow)}</p>}
    <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">{renderDay(title)}</h2>
    {body && <p className="mt-4 text-lg leading-8 text-muted-foreground">{renderDay(body)}</p>}
  </div>
);

/** Quiz-landing-style sections shown under the challenge sign-up form. */
const JoinSections = ({ c, onJoin }: { c: ChallengeSalesContent; onJoin: () => void }) => {
  const cards = byPosition(c.joinProblem.cards).filter((x) => x.title.trim());
  const benefits = byPosition(c.joinBenefits.items).filter((x) => x.text.trim());
  const testimonials = byPosition(c.joinTestimonials.items).filter((x) => x.quote.trim());
  const paragraphs = c.joinAbout.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="w-full">
      {c.joinProblem.show && (
        <PageSection className="border-y border-border bg-card/55">
          <Header eyebrow={c.joinProblem.eyebrow} title={c.joinProblem.heading} body={c.joinProblem.body} />
          {cards.length > 0 && (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {cards.map((card, i) => (
                <Reveal key={card.id} delay={i * 0.12}>
                  <div className="h-full rounded-xl border border-border bg-background p-6 shadow-sm transition-transform hover:-translate-y-1">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <p className="mt-5 font-black leading-7 text-foreground">{renderDay(card.title)}</p>
                    {card.body && <p className="mt-2 leading-7 text-muted-foreground">{renderDay(card.body)}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </PageSection>
      )}

      {c.joinBenefits.show && benefits.length > 0 && (
        <PageSection>
          <Header eyebrow={c.joinBenefits.eyebrow} title={c.joinBenefits.heading} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.12}>
                <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="mt-4 font-semibold leading-7 text-foreground">{renderDay(b.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </PageSection>
      )}

      {c.joinAbout.show && (
        <PageSection className="border-y border-border bg-card/55">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-border bg-background p-7 shadow-sm sm:grid-cols-[auto_1fr] sm:items-start md:p-10">
            <img
              src={c.joinAbout.photoUrl || johnnyPortrait}
              alt={c.joinAbout.heading}
              loading="lazy"
              className="mx-auto block aspect-[4/5] w-44 rounded-xl border border-border object-cover sm:mx-0 sm:w-52"
            />
            <div className="text-center sm:text-left">
              {c.joinAbout.eyebrow && <p className="text-xs font-black uppercase tracking-widest text-primary">{renderDay(c.joinAbout.eyebrow)}</p>}
              <h2 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">{renderDay(c.joinAbout.heading)}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
                {paragraphs.map((p, i) => <p key={i}>{renderDay(p)}</p>)}
              </div>
            </div>
          </div>
        </PageSection>
      )}

      {c.joinTestimonials.show && testimonials.length > 0 && (
        <PageSection>
          <Header eyebrow={c.joinTestimonials.eyebrow} title={c.joinTestimonials.heading} />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.12}>
                <figure className="h-full rounded-xl border border-border bg-card p-6 shadow-sm">
                  <Quote className="h-6 w-6 text-primary" />
                  <blockquote className="mt-4 leading-7 text-foreground">{renderDay(t.quote)}</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-black text-foreground">{t.name}</span>
                    {t.role && <span className="text-muted-foreground">, {t.role}</span>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </PageSection>
      )}

      {c.joinFinal.show && (
        <PageSection className="border-t border-border">
          <div className="mx-auto max-w-3xl text-center">
            <TrendingUp className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">{renderDay(c.joinFinal.heading)}</h2>
            {c.joinFinal.body && <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{renderDay(c.joinFinal.body)}</p>}
            <Button
              className="mt-8 h-auto min-h-14 w-full max-w-full gap-2 whitespace-normal rounded-xl px-6 py-4 text-center text-base font-black uppercase leading-snug shadow-lg shadow-primary/20 sm:w-auto sm:px-8"
              onClick={onJoin}
            >
              <span>{renderDay(c.joinFinal.button)}<ArrowRight className="ml-2 inline h-4 w-4 align-[-2px]" /></span>
            </Button>
          </div>
        </PageSection>
      )}
    </div>
  );
};

export default JoinSections;
