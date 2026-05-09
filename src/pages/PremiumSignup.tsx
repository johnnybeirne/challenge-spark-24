import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignupChat from "@/components/auth/SignupChat";
import { getAppliedCoupon } from "@/lib/premium";

const PremiumSignup = () => {
  const [coupon, setCoupon] = useState<string | null>(null);
  useEffect(() => {
    setCoupon(getAppliedCoupon());
  }, []);

  const subcopy = coupon
    ? `Coupon ${coupon} is applied to your enrollment. Create your account to continue to checkout.`
    : "Create your account to enroll in the Leadio Growth Accelerator and continue to checkout.";

  return (
    <SignupChat
      product="premium"
      headline="Enroll in Leadio Premium"
      subcopy={subcopy}
      johnnyPrompts={{
        name: "Welcome — let's set up your Premium account. What's your first and last name?",
        email: "Thanks {name}. What email should I use for your enrollment?",
        password: "Pick a password (6+ characters) and we'll continue to checkout.",
      }}
      successHeadline={(first) => `Account ready, ${first}.`}
      successSubcopy="Continue to complete your Premium enrollment."
      defaultRedirect="/premium"
      renderSuccessActions={({ goToRedirect }) => (
        <Button className="h-12 gap-2" onClick={goToRedirect}>
          <Crown className="h-4 w-4" /> Continue to checkout
        </Button>
      )}
    />
  );
};

export default PremiumSignup;
