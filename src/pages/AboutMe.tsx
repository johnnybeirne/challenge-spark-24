import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useSiteContent } from "@/hooks/useSiteContent";
import johnnyPortrait from "@/assets/johnny-beirne.png";

const AboutMe = () => {
  const { t } = useSiteContent("about-me");

  return (
    <>
      <SEO
        title="About Johnny Beirne"
        description="Meet Johnny Beirne — helping coaches, consultants and expert-led businesses turn knowledge into repeatable lead-generation systems."
        canonical="/about-me"
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <img
                  src={johnnyPortrait}
                  alt="Johnny Beirne — founder and lead strategist"
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
                  {t(
                    "bio.paragraph_1",
                    "Johnny Beirne is the founder of the Digital Business Institute and a fractional AI advisor. His focus is the practical, everyday use of AI."
                  )}
                </p>
                <p>
                  {t(
                    "bio.paragraph_2",
                    "Working alongside clients across three continents, he turns their hard-won expertise into AI-powered tools that work the way they do. The knowledge is theirs; the results are theirs. Clients move from idea to finished tool, freeing them to do more of what they do best; and to be more productive and profitable."
                  )}
                </p>
                <p>
                  {t(
                    "bio.paragraph_3",
                    "Johnny is also the co-author of the best-selling Rethink Remoting, a speaker, and an educator who makes powerful technology feel within reach."
                  )}
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
