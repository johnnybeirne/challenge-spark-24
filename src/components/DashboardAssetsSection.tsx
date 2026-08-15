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

  // The promise is a four part transformation statement. Newer promises store
  // the parts separately so display controls the quotes and weight.
  // Older promises are a single plain string and render as they are.
  const noDash = (s: string) =>
    s
      .replace(/[\u2010-\u2015\u2212-]+/g, " ")
      .replace(/["'`]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\.$/, "")
      .trim();

  const withStopEnding = (s: string) =>
    !s ? "" : /\bfrom (happening|continuing)$/i.test(s) ? s : `${s} from continuing`;

  const resolvePromise = ():
    | { fromState: string; toState: string; soState?: string; andStop?: string }
    | { text: string }
    | null => {
    const outputs = (state.challenge?.aiOutputs ?? {}) as Record<string, unknown>;

    const raw = outputs.day1_promise;
    const parsed = typeof raw === "string" ? parse(raw) : parse(raw);
    if (parsed && typeof parsed === "object") {
      const f = typeof parsed.fromState === "string" ? noDash(parsed.fromState) : "";
      const tS = typeof parsed.toState === "string" ? noDash(parsed.toState) : "";
      const sT = typeof parsed.soThat === "string" ? noDash(parsed.soThat) : "";
      const aS = typeof parsed.andStop === "string" ? withStopEnding(noDash(parsed.andStop)) : "";
      if (f && tS) return { fromState: f, toState: tS, soState: sT || undefined, andStop: aS || undefined };
    }

    // Older stored promises: a single plain string, shown as stored.
    const candidates: string[] = [];
    const edited = outputs.day1_promise_user_edit;
    if (typeof edited === "string" && edited.trim()) candidates.push(edited.trim());
    const polished = outputs.day1_promise_polished;
    if (typeof polished === "string" && polished.trim()) candidates.push(polished.trim());
    if (parsed && typeof parsed === "object" && typeof parsed.promise === "string" && parsed.promise.trim()) {
      candidates.push(parsed.promise.trim());
    } else if (typeof raw === "string" && raw.trim() && !parsed) {
      candidates.push(raw.trim());
    }
    const isFromTo = (s: string) => /\bfrom\b[\s\S]*\bto\b/i.test(s);
    const stored = candidates.find((c) => isFromTo(c));
    if (stored) return { text: stored };

    // Assemble the parts from the Day 1 answers already saved.
    const setup = parse(outputs.day1Setup) ?? parse(outputs.day1Step) ?? {};
    const memory: any = state.memory || {};
    const pain = clean(setup.problem || memory.problem || "").toLowerCase();
    const result = clean(setup.outcome || memory.desiredOutcome || "").toLowerCase();
    const method = clean(setup.how || memory.method || "").toLowerCase();
    const superpower = clean(setup.superpower || memory.superpower || "").toLowerCase();
    if (pain && result) {
      const soState = superpower ? noDash(superpower) : (result ? noDash(`they ${result}`) : undefined);
      return {
        fromState: noDash(pain),
        toState: noDash(method ? `${result} with ${method}` : result),
        soState,
        andStop: withStopEnding(noDash(pain)),
      };
    }

    return null;
  };


  const promiseValue = resolvePromise();


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

            if (promiseValue) {
              entries.push({
                day: 1,
                title: t("assets.promise_title", "Your Challenge Promise"),
                body: (
                  <div className="mt-1 text-sm leading-snug text-foreground">
                    <p className="mb-3 text-sm text-muted-foreground">
                      {t(
                        "assets.promise_heading",
                        "This is the promise your challenge makes to the people who take your challenge."
                      )}
                    </p>
                    {"fromState" in promiseValue ? (
                      <div className="space-y-3">
                        {[
                          { label: "FROM", value: promiseValue.fromState, bold: true },
                          { label: "TO", value: promiseValue.toState, bold: true },
                          ...(promiseValue.soState ? [{ label: "SO THAT", value: promiseValue.soState, bold: true }] : []),
                          ...(promiseValue.andStop ? [{ label: "AND STOP", value: promiseValue.andStop, bold: false }] : []),
                        ].map((part) => (
                          <div key={part.label}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                              {part.label}
                            </p>
                            <p className={`mt-0.5 text-base leading-snug text-foreground ${part.bold ? "font-bold" : "font-normal"}`}>
                              &ldquo;{part.value}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      promiseValue.text
                    )}
                  </div>


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
