import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { QuizDownloadAssets } from "@/components/QuizDownloadAssets";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * Standalone "Your Assets" section on the challenge dashboard.
 * No archetype content of any kind. All participant facing copy is
 * owner editable via site_content (page "dashboard", section "assets").
 */
const DashboardAssetsSection = () => {
  const { state } = useAppState();
  const { t } = useSiteContent("dashboard");

  const rawQuiz = state.challenge?.aiOutputs?.day2_s2_quiz;

  const parse = (raw: unknown): any => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  };

  const clean = (s: string) =>
    s.trim().replace(/^they(['’]ll| will)?\s+/i, "").replace(/\.$/, "").trim();

  const resolvePromise = (): string => {
    const outputs = (state.challenge?.aiOutputs ?? {}) as Record<string, unknown>;

    // A valid promise must always read as a "from ... to ..." sentence.
    const isFromTo = (s: string) => /\bfrom\b[\s\S]*\bto\b/i.test(s);

    // 1. Participant edit, then polished, then stored promise.
    const candidates: string[] = [];

    const edited = outputs.day1_promise_user_edit;
    if (typeof edited === "string" && edited.trim()) candidates.push(edited.trim());

    const polished = outputs.day1_promise_polished;
    if (typeof polished === "string" && polished.trim()) candidates.push(polished.trim());

    const raw = outputs.day1_promise;
    if (typeof raw === "string" && raw.trim()) {
      const parsed = parse(raw);
      if (parsed && typeof parsed === "object" && typeof parsed.promise === "string") {
        candidates.push(parsed.promise.trim());
      } else {
        candidates.push(raw.trim());
      }
    }

    const stored = candidates.find((c) => isFromTo(c));
    if (stored) return stored;

    // 2. Fall back to the Day 1 answers already saved on the record and
    //    assemble the "from ... to ..." sentence ourselves.
    const setup = parse(outputs.day1Setup) ?? parse(outputs.day1Step) ?? {};
    const memory: any = state.memory || {};
    const who = clean(setup.audience || memory.audience || "");
    const pain = clean(setup.problem || memory.problem || "").toLowerCase();
    const result = clean(setup.outcome || memory.desiredOutcome || "").toLowerCase();
    const method = clean(setup.how || memory.method || "").toLowerCase();
    if (who && pain && result) {
      return method
        ? `Help ${who} move from "${pain}" to ${result} through ${method}.`
        : `Help ${who} move from "${pain}" to ${result}.`;
    }

    // 3. Nothing assembles into a from/to sentence, so show nothing.
    return "";
  };


  const promiseSentence = resolvePromise();

  const [openItem, setOpenItem] = useState<string>("");

  return (
    <Card id="your-assets" className="scroll-mt-24 border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">
          {t("assets.heading", "Your Assets")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "assets.intro",
            "Everything you build in the challenge lands here, ready to use."
          )}
        </p>


        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          className="mt-5 w-full"
        >
          {(() => {
            // Assets in sequence. The badge is derived from position within the
            // day, so numbering restarts at Asset 1 for each new day.
            const entries: { day: number; title: string; body: JSX.Element }[] = [];

            entries.push({
              day: 1,
              title: t("assets.asset1_title", "Your Roadmap"),
              body: (
                <>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {t(
                      "assets.asset1_copy",
                      "Your roadmap is your first asset and it was created on Day 1. It holds the three pillars your challenge is built on."
                    )}
                  </p>
                  <a
                    href="#your-roadmap"
                    onClick={() => setOpenItem("")}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    {t("assets.asset1_cta", "View your roadmap")} &rarr;
                  </a>
                </>
              ),
            });

            if (promiseSentence) {
              entries.push({
                day: 1,
                title: t("assets.promise_title", "Your Challenge Promise"),
                body: (
                  <p className="mt-1 text-sm leading-snug text-foreground">
                    {promiseSentence}
                  </p>
                ),
              });
            }

            entries.push({
              day: 2,
              title: t("assets.asset2_title", "Your Quiz"),
              body: rawQuiz ? (
                <>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {t("assets.asset2_ready_copy", "Your quiz is built and ready to download.")}
                  </p>
                  <div className="mt-3">
                    <QuizDownloadAssets rawQuiz={rawQuiz} />
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {t(
                      "assets.asset2_pending_copy",
                      "Your quiz is the next asset that joins your roadmap. You build it on Day 2."
                    )}
                  </p>
                  <Link
                    to="/challenge/day-2"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    {t("assets.asset2_pending_cta", "Build your quiz")} &rarr;
                  </Link>
                </>
              ),
            });

            const perDay: Record<number, number> = {};

            return entries.map((entry, i) => {
              perDay[entry.day] = (perDay[entry.day] ?? 0) + 1;
              const badge = `Day ${entry.day} · Asset ${perDay[entry.day]}`;
              const value = `asset-${entry.day}-${perDay[entry.day]}`;
              return (
                <AccordionItem
                  key={value}
                  value={value}
                  className="rounded-xl border border-border bg-background px-4 mb-3 data-[state=open]:border-primary"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {badge}
                      </span>
                      <span className="text-lg font-bold leading-tight text-foreground">
                        {entry.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>{entry.body}</AccordionContent>
                </AccordionItem>
              );
            });
          })()}
        </Accordion>

        <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

      </CardContent>
    </Card>
  );
};

export default DashboardAssetsSection;
