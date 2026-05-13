import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import SignupChat from "@/components/auth/SignupChat";

const BlueprintSignup = () => (
  <>
    <SEO title="Get Free Training" description="3 short lessons on how challenges create engagement, leads, and growth — with a personalised AI insight. Free, no credit card." canonical="/blueprint-join" />
  <SignupChat
    product="blueprint"
    headline="Get your free Challenge Growth Blueprint"
    subcopy="3 short lessons + one personalised AI insight on how challenges can grow your business. Free, no credit card."
    johnnyPrompts={{
      name: "Welcome to the Blueprint — what's your first and last name?",
      email: "Great to meet you, {name}. Where should I send your lesson access?",
      password: "Set a password (6+ characters) and Lesson 1 is yours.",
    }}
    successHeadline={(first) => `You're in, ${first}. Lesson 1 is ready.`}
    successSubcopy="Three short lessons. One personalised AI insight at the end."
    defaultRedirect="/blueprint/dashboard"
    renderSuccessActions={({ goToRedirect }) => (
      <Button className="h-12" onClick={goToRedirect}>Open Lesson 1</Button>
    )}
    />
  </>
);

export default BlueprintSignup;
