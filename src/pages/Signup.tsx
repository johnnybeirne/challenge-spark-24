import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { defaultMemory, mergeMemory } from "@/lib/personalisation";
import AddToCalendar from "@/components/AddToCalendar";
import aiAvatar from "@/assets/ai-avatar.png";

const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";

type Mode = "signup" | "login";
type SignupStep = "name" | "email" | "password";

const SIGNUP_PROMPTS: Record<SignupStep, string> = {
  name: "Johnny here — what's your first and last name?",
  email: "Nice to meet you, {name}. What email should I use for your account?",
  password: "Pick a password (6+ characters) and you're in.",
};

const TypingBubble = ({ text }: { text: string }) => {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text]);
  return (
    <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-8 py-6 text-2xl text-foreground max-w-[85%]">
      {shown}
      <span className="inline-block w-3 h-8 bg-foreground/40 ml-1 animate-pulse align-middle" />
    </div>
  );
};


const Signup = () => {
  const { signUp, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode: Mode = (location.state as { mode?: Mode } | null)?.mode === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(initialMode);

  // Signup chat state
  const [step, setStep] = useState<SignupStep>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const name = `${firstName.trim()} ${lastName.trim()}`.trim();
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const signupInputRef = useRef<HTMLInputElement>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [emailAction, setEmailAction] = useState<"reset" | null>(null);
  const [accountExistsNotice, setAccountExistsNotice] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (mode === "signup") {
      const t = setTimeout(() => signupInputRef.current?.focus(), 600);
      return () => clearTimeout(t);
    }
  }, [step, mode]);

  // ----- Signup handlers -----
  const promptText = SIGNUP_PROMPTS[step].replace("{name}", firstName.trim() || "there");

  const canAdvanceSignup = (() => {
    if (step === "name") return firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === "email") return signupEmail.trim().includes("@");
    return signupPassword.length >= 6;
  })();

  const handleSignupNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvanceSignup || loading) return;
    if (step === "name") return setStep("email");
    if (step === "email") return setStep("password");

    try {
      const existing = JSON.parse(localStorage.getItem("challengeos_memory") || JSON.stringify(defaultMemory));
      localStorage.setItem("challengeos_memory", JSON.stringify(mergeMemory({ ...defaultMemory, ...existing }, { name })));
    } catch {}

    setLoading(true);
    let referredBy: string | null = null;
    let partnerRef: string | null = null;
    try {
      referredBy = sessionStorage.getItem(REF_SESSION_KEY);
      partnerRef = sessionStorage.getItem(PARTNER_REF_KEY);
    } catch {}
    const { error } = await signUp(signupEmail.trim().toLowerCase(), signupPassword, {
      name: name.trim(),
      ...(referredBy ? { referred_by: referredBy } : {}),
    });
    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setLoginEmail(signupEmail.trim().toLowerCase());
        setAccountExistsNotice(true);
        setMode("login");
        return;
      }
      return toast.error(error.message || "Signup failed");
    }
    if (partnerRef) {
      (supabase.rpc as any)("process_partner_referral", { p_partner_code: partnerRef }).then(() => {});
    }
    trackEvent("signup_completed");
    toast.success("You're in.");
    setSignupComplete(true);
  };

  const signupInputProps = (() => {
    if (step === "email")
      return { type: "email", placeholder: "you@example.com", value: signupEmail, onChange: (e: any) => setSignupEmail(e.target.value), autoComplete: "email", maxLength: 255 };
    return { type: "password", placeholder: "••••••", value: signupPassword, onChange: (e: any) => setSignupPassword(e.target.value), autoComplete: "new-password", minLength: 6 };
  })();

  // ----- Login handler -----
  const canSubmitLogin = loginEmail.trim().includes("@") && loginPassword.length >= 6;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitLogin || loading) return;
    setLoading(true);
    const { error } = await signIn(loginEmail.trim().toLowerCase(), loginPassword);
    setLoading(false);
    if (error) return toast.error(error.message || "Login failed");
    navigate("/dashboard");
  };

  const handlePasswordReset = async () => {
    if (!loginEmail.trim().includes("@") || loading || emailAction) {
      return toast.error("Enter your email first, then request the reset link.");
    }
    setEmailAction("reset");
    const { error } = await resetPassword(loginEmail.trim().toLowerCase());
    setEmailAction(null);
    if (error) return toast.error(error.message || "Could not send reset email");
    setResetSent(true);
    toast.success("Password reset instructions sent.");
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "signup") setStep("name");
    if (next === "signup") setAccountExistsNotice(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background relative">
      {mode === "signup" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-foreground text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Login
        </button>
      )}
      <div className="w-full max-w-2xl">
        

        {signupComplete ? (
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Your 3-day challenge is ready, {firstName}.</h1>
            <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Set aside 60 minutes each day to complete your challenge.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <AddToCalendar firstNameOverride={firstName || "there"} className="h-12" />
              <Button variant="secondary" className="h-12" onClick={() => navigate("/training")}>Continue to training</Button>
            </div>
          </div>
        ) : mode === "signup" ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
              Start building your AI-powered challenge
            </h1>
            <p className="text-base text-muted-foreground text-center mb-2 max-w-xl mx-auto">
              In 3 days, you'll create a challenge that attracts leads, guides users through it, and grows through sharing.
            </p>
            <p className="text-base text-muted-foreground text-center mb-12">
              Step {step === "name" ? 1 : step === "email" ? 2 : 3} of 3
            </p>

            <div className="flex items-start gap-6 mb-8">
              <div className="relative shrink-0">
                <img
                  src={aiAvatar}
                  alt="Johnny B AI"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-4 border-foreground/10"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full border-4 border-background" />
              </div>
              <div className="flex-1 pt-2">
                <div className="text-base text-muted-foreground mb-3">Johnny B AI</div>
                <TypingBubble key={step} text={promptText} />
              </div>
            </div>

            {step !== "name" && name && (
              <div className="flex justify-end mb-6">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-8 py-4 text-2xl">{name}</div>
              </div>
            )}
            {step === "password" && signupEmail && (
              <div className="flex justify-end mb-6">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-8 py-4 text-2xl">{signupEmail}</div>
              </div>
            )}

            <form onSubmit={handleSignupNext} className="flex gap-4 items-center mt-12">
              {step === "name" ? (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <Input
                    ref={signupInputRef}
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    maxLength={50}
                    className="h-24 rounded-2xl text-2xl px-6 border-4 border-foreground"
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    maxLength={50}
                    className="h-24 rounded-2xl text-2xl px-6 border-4 border-foreground"
                  />
                </div>
              ) : (
                <Input
                  key={step}
                  ref={signupInputRef}
                  {...(signupInputProps as any)}
                  className="h-24 rounded-2xl text-2xl px-6 border-4 border-foreground"
                />
              )}
              <Button
                type="submit"
                disabled={!canAdvanceSignup || loading}
                className="h-24 w-24 rounded-2xl shrink-0 p-0 border-4 border-foreground"
                aria-label="Continue"
              >
                <ArrowRight className="!w-10 !h-10" />
              </Button>
            </form>

            <div className="mt-16 pt-12 border-t border-border text-center">
              <p className="text-base text-muted-foreground mb-4">Already have an account?</p>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-3 text-base font-semibold text-primary hover:underline"
              >
                <LogIn className="w-5 h-5" />
                Sign in instead
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Sign in to keep building your challenge.
            </p>

            {accountExistsNotice && (
              <div className="flex items-start gap-3 mb-6 p-4 rounded-xl border-2 border-foreground bg-primary/5">
                <img
                  src={aiAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-foreground/10 shrink-0"
                />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-0.5">Johnny B AI</div>
                  <p className="text-sm text-foreground">
                    Looks like you've already got an account with that email. Pop your password in below and you're back in.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={255}
                  className="h-12 rounded-xl border-2 border-foreground"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="login-password">Password</Label>
                  <button type="button" onClick={handlePasswordReset} disabled={!!emailAction || loading} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                    {emailAction === "reset" ? "Sending reset…" : "Forgot password?"}
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  className="h-12 rounded-xl border-2 border-foreground"
                />
              </div>

              {resetSent && (
                <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                  Check your email for reset instructions. The link opens a secure page where you can choose a new password.
                </p>
              )}

              {magicLinkSent && (
                <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                  Check your email for a secure sign-in link. Use this if you do not remember your password.
                </p>
              )}

              <Button
                type="submit"
                disabled={!canSubmitLogin || loading}
                className="w-full h-12 rounded-xl text-base gap-2 border-2 border-foreground"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleMagicLink}
                disabled={!loginEmail.trim().includes("@") || loading || !!emailAction}
                className="w-full h-12 rounded-xl text-base border-2 border-foreground"
              >
                {emailAction === "link" ? "Sending link…" : "Email me a sign-in link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to create account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
