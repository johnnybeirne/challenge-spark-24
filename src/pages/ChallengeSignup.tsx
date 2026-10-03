import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import SignupChat from "@/components/auth/SignupChat";
import AddToCalendar from "@/components/AddToCalendar";
import JoinChallengeSections from "@/components/challenge/JoinChallengeSections";
import { getEntryIntent } from "@/lib/entryIntent";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  CHALLENGE_SALES_KEY,
  CHALLENGE_SALES_PAGE,
  CHALLENGE_SALES_SECTION,
  byPosition,
  parseChallengeSales,
  renderDay,
} from "@/lib/challengeSalesContent";

const ChallengeSignup = () => {
  // Wording comes from the Challenge Sales Page editor (join section).
  const { map, loaded } = useSiteContent(CHALLENGE_SALES_PAGE);
  const c = useMemo(() => parseChallengeSales(map[`${CHALLENGE_SALES_SECTION}.${CHALLENGE_SALES_KEY}`]), [map]);

  const cameFromAssessment = getEntryIntent() === "challenge";
  const defaultRedirect = "/challenger-dashboard";

  const successHeadline = cameFromAssessment
    ? (first: string) => `Your 3-day challenge is ready, ${first}.`
    : (first: string) => `You're in, ${first}. Day 1 starts now.`;

  const successSubcopy = cameFromAssessment
    ? "Set aside 60 minutes each day to complete your challenge."
    : "Jump straight into Day 1, about 15 minutes to your first win.";

  if (!loaded) return <main className="min-h-screen bg-background" />;

  const days = byPosition(c.days.items).filter((d) => d.title.trim());
  const aside = c.join.showDays && days.length > 0 ? (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="mb-6 text-xl font-black text-foreground">{renderDay(c.join.daysHeading)}</h2>
      <ol className="space-y-5">
        {days.map((d, i) => (
          <li key={d.id} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{i + 1}</span>
            <div>
              <p className="font-bold text-foreground">{renderDay(d.title)}</p>
              {d.body && <p className="mt-1 text-sm text-muted-foreground">{renderDay(d.body)}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  ) : undefined;

  return (
    <>
      <SEO title="Join the free 3-day challenge" description="Create your free account and start Day 1 of the 3-day challenge today." canonical="/challenge/join" />
      <SignupChat
        product="challenge"
        variant="form"
        kicker={renderDay(c.join.kicker)}
        headline={renderDay(c.join.headline)}
        subcopy={renderDay(c.join.subheadline)}
        submitLabel={renderDay(c.join.button)}
        underButton={renderDay(c.join.underButton)}
        aside={aside}
        below={<JoinChallengeSections c={c} onJoin={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => document.getElementById("su-first")?.focus(), 500);
        }} />}
        johnnyPrompts={{ name: "", email: "", password: "" }}
        successHeadline={successHeadline}
        successSubcopy={successSubcopy}
        defaultRedirect={defaultRedirect}
        renderSuccessActions={({ firstName, goToRedirect }) =>
          cameFromAssessment ? (
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <AddToCalendar firstNameOverride={firstName || ""} className="h-12 bg-[#22C55E] text-white hover:bg-[#16A34A]" />
                <Button className="h-12 bg-[#F97316] text-white hover:bg-[#EA580C]" onClick={goToRedirect}>Continue</Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Adds a 1 hour block to your calendar each day for the next 3 days.
              </p>
            </div>
          ) : (
            <Button className="h-12" onClick={goToRedirect}>Go to your dashboard</Button>
          )
        }
      />
    </>
  );
};

export default ChallengeSignup;
