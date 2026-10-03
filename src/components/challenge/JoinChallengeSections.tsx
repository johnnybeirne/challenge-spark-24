import { Fragment, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, HelpCircle, Quote, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/premium/cinematic";
import johnnyPortrait from "@/assets/johnny-beirne.png";
import { useUserRole } from "@/hooks/useUserRole";
import { getEmbedUrl, isDirectVideo } from "@/lib/trainingContent";
import { byPosition, renderDay, resolveSectionOrder, type ChallengeSalesContent } from "@/lib/challengeSalesContent";

const PageSection = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-14 sm:px-6 md:py-20 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const Header = ({ title, body }: { title: string; body?: string }) => (
  <div className="mx-auto max-w-3xl text-center">
    <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">{renderDay(title)}</h2>
    {body && <p className="mt-4 text-lg leading-8 text-muted-foreground">{renderDay(body)}</p>}
  </div>
);

/** The /challenge sections, restyled for the sign-up page. Hero and days are left out. */
const JoinChallengeSections = ({ c, onJoin }: { c: ChallengeSalesContent; onJoin: () => void }) => {
  const reduce = useReducedMotion();
  const { isAdmin } = useUserRole();
  const Fade = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) =>
    reduce ? <div className="h-full">{children}</div> : <Reveal className="h-full" delay={delay}>{children}</Reveal>;

  const paras = (items: { id: string; position: number; text: string }[]) =>
    byPosition(items).filter((p) => p.text.trim());
  const videoUrl = c.video.videoUrl.trim();
  const embed = videoUrl ? getEmbedUrl(videoUrl) : null;
  const testimonials = byPosition(c.testimonials.items).filter((t) => t.quote.trim());
  const guideParas = c.guide.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const blocks: Partial<Record<string, ReactNode>> = {
    video: c.video.show && (videoUrl || isAdmin) && (
      <PageSection>
        <div className="mx-auto max-w-3xl">
          {c.video.heading && <Header title={c.video.heading} />}
          <div className="mt-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
            {!videoUrl ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground">
                Video goes here. Add the link in the editor.
              </div>
            ) : isDirectVideo(videoUrl) ? (
              <video controls className="h-full w-full"><source src={videoUrl} /></video>
            ) : embed ? (
              <iframe src={embed} title={c.video.heading || "Video"} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex h-full items-center justify-center font-bold text-primary">Watch the video</a>
            )}
          </div>
        </div>
      </PageSection>
    ),
    liveObjection: c.liveObjection.show && (
      <PageSection className="border-y border-border bg-card/55">
        <div className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mt-4 text-3xl font-black leading-tight text-foreground sm:text-4xl">{renderDay(c.liveObjection.heading)}</h2>
          {c.liveObjection.body && <p className="mt-4 text-lg leading-8 text-muted-foreground">{renderDay(c.liveObjection.body)}</p>}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {byPosition(c.liveObjection.items).filter((x) => x.title.trim() || x.body.trim()).map((card, i) => (
            <Fade key={card.id} delay={i * 0.12}>
              <div className="h-full rounded-xl border border-border bg-background p-6 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <p className="mt-5 font-black leading-7 text-foreground">{renderDay(card.title)}</p>
                {card.body && <p className="mt-2 leading-7 text-muted-foreground">{renderDay(card.body)}</p>}
              </div>
            </Fade>
          ))}
        </div>
        {c.liveObjection.closing && <p className="mx-auto mt-10 max-w-3xl text-center text-lg font-bold leading-8 text-foreground">{renderDay(c.liveObjection.closing)}</p>}
      </PageSection>
    ),
    problem: c.problem.show && (
      <PageSection className="border-y border-border bg-card/55">
        <Header title={c.problem.heading} body={c.problem.body} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {byPosition(c.problem.cards).filter((x) => x.title.trim()).map((card, i) => (
            <Fade key={card.id} delay={i * 0.12}>
              <div className="h-full rounded-xl border border-border bg-background p-6 shadow-sm transition-transform hover:-translate-y-1">
                <HelpCircle className="h-6 w-6 text-primary" />
                <p className="mt-5 font-black leading-7 text-foreground">{renderDay(card.title)}</p>
                {card.body && <p className="mt-2 leading-7 text-muted-foreground">{renderDay(card.body)}</p>}
              </div>
            </Fade>
          ))}
        </div>
      </PageSection>
    ),
    fix: c.fix.show && (
      <PageSection>
        <Header title={c.fix.heading} body={c.fix.body} />
        {c.fix.items.length > 0 && (
          <ol className="mx-auto mt-10 max-w-2xl space-y-3">
            {paras(c.fix.items).map((it, i) => (
              <li key={it.id}>
                <Fade delay={i * 0.12}>
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{i + 1}</span>
                    <span className="pt-1 font-semibold leading-7 text-foreground">{renderDay(it.text)}</span>
                  </div>
                </Fade>
              </li>
            ))}
          </ol>
        )}
      </PageSection>
    ),
    imagine: c.imagine.show && (
      <PageSection className="border-y border-border bg-card/55">
        <Header title={c.imagine.heading} />
        <div className="mx-auto mt-6 max-w-3xl space-y-4 text-center">
          {paras(c.imagine.paragraphs).map((p) => <p key={p.id} className="text-lg leading-8 text-muted-foreground">{renderDay(p.text)}</p>)}
        </div>
      </PageSection>
    ),
    walkAway: c.walkAway.show && paras(c.walkAway.items).length > 0 && (
      <PageSection>
        <Header title={c.walkAway.heading} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paras(c.walkAway.items).map((b, i) => (
            <Fade key={b.id} delay={i * 0.12}>
              <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="mt-4 font-semibold leading-7 text-foreground">{renderDay(b.text)}</p>
              </div>
            </Fade>
          ))}
        </div>
      </PageSection>
    ),
    whoFor: c.whoFor.show && (
      <PageSection className="border-y border-border bg-card/55">
        <div className="grid gap-4 md:grid-cols-2">
          <Fade>
            <div className="h-full rounded-xl border border-border bg-background p-6 shadow-sm">
              <h3 className="text-xl font-black text-foreground">{renderDay(c.whoFor.forHeading)}</h3>
              <ul className="mt-4 space-y-3">
                {paras(c.whoFor.forItems).map((it) => (
                  <li key={it.id} className="flex gap-3 leading-7 text-foreground"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />{renderDay(it.text)}</li>
                ))}
              </ul>
            </div>
          </Fade>
          <Fade delay={0.12}>
            <div className="h-full rounded-xl border border-border bg-background p-6 shadow-sm">
              <h3 className="text-xl font-black text-foreground">{renderDay(c.whoFor.notForHeading)}</h3>
              <ul className="mt-4 space-y-3">
                {paras(c.whoFor.notForItems).map((it) => (
                  <li key={it.id} className="flex gap-3 leading-7 text-muted-foreground"><X className="mt-1 h-5 w-5 shrink-0" />{renderDay(it.text)}</li>
                ))}
              </ul>
            </div>
          </Fade>
        </div>
      </PageSection>
    ),
    guide: c.guide.show && (
      <PageSection>
        <div className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-border bg-background p-7 shadow-sm sm:grid-cols-[auto_1fr] sm:items-start md:p-10">
          <img
            src={c.guide.photoUrl || johnnyPortrait}
            alt={c.guide.heading}
            loading="lazy"
            className="mx-auto block aspect-[4/5] w-44 rounded-xl border border-border object-cover sm:mx-0 sm:w-52"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">{renderDay(c.guide.heading)}</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
              {guideParas.map((p, i) => <p key={i}>{renderDay(p)}</p>)}
            </div>
          </div>
        </div>
      </PageSection>
    ),
    testimonials: c.testimonials.show && testimonials.length > 0 && (
      <PageSection className="border-y border-border bg-card/55">
        <Header title={c.testimonials.heading} />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Fade key={t.id} delay={i * 0.12}>
              <figure className="h-full rounded-xl border border-border bg-card p-6 shadow-sm">
                <Quote className="h-6 w-6 text-primary" />
                <blockquote className="mt-4 leading-7 text-foreground">{renderDay(t.quote)}</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-black text-foreground">{renderDay(t.name)}</span>
                  {t.role && <span className="text-muted-foreground">, {renderDay(t.role)}</span>}
                </figcaption>
              </figure>
            </Fade>
          ))}
        </div>
      </PageSection>
    ),
    ifYouDont: c.ifYouDont.show && (
      <PageSection className="border-y border-border bg-card/55">
        <Header title={c.ifYouDont.heading} />
        <div className="mx-auto mt-6 max-w-3xl space-y-4 text-center">
          {paras(c.ifYouDont.paragraphs).map((p) => <p key={p.id} className="text-lg leading-8 text-muted-foreground">{renderDay(p.text)}</p>)}
        </div>
      </PageSection>
    ),
    faq: c.faq.show && c.faq.items.length > 0 && (
      <PageSection>
        <div className="mx-auto max-w-2xl">
          <Header title={c.faq.heading} />
          <Accordion type="single" collapsible className="mt-8">
            {byPosition(c.faq.items).map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-base font-bold">{renderDay(f.question)}</AccordionTrigger>
                <AccordionContent className="leading-7 text-muted-foreground">{renderDay(f.answer)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </PageSection>
    ),
    finalCall: c.finalCall.show && (
      <PageSection className="border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <TrendingUp className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">{renderDay(c.finalCall.heading)}</h2>
          {c.finalCall.body && <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{renderDay(c.finalCall.body)}</p>}
          <Button
            className="mt-8 h-auto min-h-14 w-full max-w-full gap-2 whitespace-normal rounded-xl px-6 py-4 text-center text-base font-black uppercase leading-snug shadow-lg shadow-primary/20 sm:w-auto sm:px-8"
            onClick={onJoin}
          >
            <span>{renderDay(c.finalCall.button)}<ArrowRight className="ml-2 inline h-4 w-4 align-[-2px]" /></span>
          </Button>
          {c.finalCall.underButton && <p className="mt-3 text-center text-base text-muted-foreground">{renderDay(c.finalCall.underButton)}</p>}
        </div>
      </PageSection>
    ),
  };

  return (
    <div className="w-full">
      {resolveSectionOrder(c.sectionOrder)
        .filter((k) => k !== "hero" && k !== "days")
        .map((k) => <Fragment key={k}>{blocks[k]}</Fragment>)}
    </div>
  );
};

export default JoinChallengeSections;
