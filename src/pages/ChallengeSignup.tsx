import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import SignupChat from "@/components/auth/SignupChat";
import AddToCalendar from "@/components/AddToCalendar";

const ChallengeSignup = () => {
  const navigate = useNavigate();

  return (
    <SignupChat
      product="challenge"
      headline="Start building your AI-powered challenge"
      subcopy="In 3 days, you'll create a challenge that attracts leads, guides users through it, and grows through sharing."
      johnnyPrompts={{
        name: "Johnny here — what's your first and last name?",
        email: "Nice to meet you, {name}. What email should I use for your account?",
        password: "Pick a password (6+ characters) and you're in.",
      }}
      successHeadline={(first) => `Your 3-day challenge is ready, ${first}.`}
      successSubcopy="Set aside 60 minutes each day to complete your challenge."
      defaultRedirect="/user-dashboard"
      renderSuccessActions={({ firstName, goToRedirect }) => (
        <>
          <AddToCalendar firstNameOverride={firstName || "there"} className="h-12" />
          <Button variant="secondary" className="h-12" onClick={goToRedirect}>Continue</Button>
        </>
      )}
    />
  );
};

export default ChallengeSignup;
