import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import SignupChat from "@/components/auth/SignupChat";
import AddToCalendar from "@/components/AddToCalendar";
import { getEntryIntent } from "@/lib/entryIntent";

const ChallengeSignup = () => {
  const navigate = useNavigate();

  // Every challenge signup lands on the participant challenge dashboard
  // (Day 1 / Day 2 / Day 3 with Day Progress). The signup clock gate then
  // decides which day is open.
  const cameFromAssessment = getEntryIntent() === "challenge";
  const defaultRedirect = "/challenger-dashboard";

  const successHeadline = cameFromAssessment
    ? (first: string) => `Your 3-day challenge is ready, ${first}.`
    : (first: string) => `You're in, ${first}. Day 1 starts now.`;

  const successSubcopy = cameFromAssessment
    ? "Set aside 60 minutes each day to complete your challenge."
    : "Jump straight into Day 1 — about 15 minutes to your first win.";

  return (
    <>
      <SEO title="Join the Challenge" description="Start building your AI-powered challenge in 3 days. Create a challenge that attracts leads and grows through sharing." canonical="/challenge/join" />
    <SignupChat
      product="challenge"
      headline="Start building your AI-powered challenge"
      subcopy="In 3 days, you'll create a challenge that attracts leads, guides users through it, and grows through sharing."
      johnnyPrompts={{
        name: "Johnny here — what's your first and last name?",
        email: "Nice to meet you, {name}. What email should I use for your account?",
        password: "Pick a password (6+ characters) and you're in.",
      }}
      successHeadline={successHeadline}
      successSubcopy={successSubcopy}
      defaultRedirect={defaultRedirect}
      renderSuccessActions={({ firstName, goToRedirect }) =>
        cameFromAssessment ? (
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <AddToCalendar
                firstNameOverride={firstName || ""}
                className="h-12 bg-[#22C55E] text-white hover:bg-[#16A34A]"
              />
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
