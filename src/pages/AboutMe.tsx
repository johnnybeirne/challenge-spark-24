import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import johnnyPortrait from "@/assets/johnny-beirne.png";

const AboutMe = () => {
  return (
    <>
      <SEO
        title="About Johnny Beirne"
        description="Meet Johnny Beirne, creator of LeadTree — helping coaches, consultants and expert-led businesses turn knowledge into repeatable lead-generation systems."
        canonical="/about-me"
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <img
                  src={johnnyPortrait}
                  alt="Johnny Beirne — creator of LeadTree"
                  className="block aspect-[4/5] w-64 object-cover sm:w-72"
                  loading="eager"
                />
              </div>
              <Button asChild variant="default" className="mt-4 w-full gap-2">
                <a href={johnnyPortrait} download="johnny-beirne.png">
                  <Download className="h-4 w-4" />
                  Download photo
                </a>
              </Button>

            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-black uppercase tracking-widest text-primary">
                Founder &amp; Lead Strategist
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Johnny Beirne
              </h1>

              <div className="mt-6 space-y-4 text-base leading-7 text-muted-foreground">
                <p>
                  Johnny Beirne is the creator of LeadTree and the architect behind
                  ChallengeOS, a 3-day builder experience that turns coaches,
                  consultants and expert-led businesses into consistent lead
                  generators.
                </p>
                <p>
                  Over the last decade he has helped founders move away from
                  unpredictable outreach and into assessment-first funnels,
                  AI-guided challenges and trust-based referral loops. LeadTree is
                  the distillation of the systems, prompts and workflows that have
                  launched challenges, built referral engines and ascended offers
                  across dozens of niches.
                </p>
                <p>
                  When he is not building the next challenge, Johnny is usually
                  interviewing operators, refining the referral playbook or
                  testing a new way to make lead generation feel less like a chase
                  and more like a conversation.
                </p>
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  );
};

export default AboutMe;
