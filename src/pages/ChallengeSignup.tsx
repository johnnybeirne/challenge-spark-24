import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import SignupChat from "@/components/auth/SignupChat";
import AddToCalendar from "@/components/AddToCalendar";
import { getEntryIntent } from "@/lib/entryIntent";

const ChallengeSignup = () => {
  const navigate = useNavigate();

  // Two onboarding paths share /join:
  // - Assessment funnel (entryIntent === "challenge"): land on the challenger
  //   dashboard so they see their tailored invitation/onboarding hub.
  // - Direct challenge signup (no intent): drop straight into Day 1.
  const cameFromAssessment = getEntryIntent() === "challenge";
  const defaultRedirect = cameFromAssessment ? "/challenger-dashboard" : "/day/1";

  const successHeadline = cameFromAssessment
    ? (first: string) => `Your 3-day challenge is ready, ${first}.`
    : (first: string) => `You're in, ${first}. Day 1 starts now.`;

  const successSubcopy = cameFromAssessment
    ? "Set aside 60 minutes each day to complete your challenge."
    : "Jump straight into Day 1 — about 15 minutes to your first win.";

  return (
    <>
      <SEO title="Join the Challenge" description="Start building your AI-powered challenge in 3 days. Create a challenge that attracts leads and grows through sharing." canonical="/join" />
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
          <>
            <AddToCalendar firstNameOverride={firstName || ""} className="h-12" />
            <Button variant="secondary" className="h-12" onClick={goToRedirect}>Continue</Button>
          </>
        ) : (
          <Button className="h-12" onClick={goToRedirect}>Start Day 1</Button>
        )
      }
    />
    </>
  );
};

export default ChallengeSignup;
