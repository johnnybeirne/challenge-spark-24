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
    <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground max-w-[85%]">
      {shown}
      <span className="inline-block w-1.5 h-4 bg-foreground/40 ml-0.5 animate-pulse align-middle" />
    </div>
  );
};


const Signup = () => {
  const { signUp, signIn } = useAuth();
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
  const [accountExistsNotice, setAccountExistsNotice] = useState(false);

  useEffect(() => {
    if (mode === "signup") {
      const t = setTimeout(() => signupInputRef.current?.focus(), 600);
      return () => clearTimeout(t);
    }
  }, [step, mode]);

  // ----- Signup handlers -----
  const promptText = SIGNUP_PROMPTS[step].replace("{name}", name.trim() || "there");

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
    navigate("/dashboard");
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

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "signup") setStep("name");
    if (next === "signup") setAccountExistsNotice(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md">
        

        {mode === "signup" ? (
          <>
            <p className="text-xs text-muted-foreground text-center mb-6">
              Step {step === "name" ? 1 : step === "email" ? 2 : 3} of 3
            </p>

            <div className="flex items-start gap-3 mb-4">
              <div className="relative shrink-0">
                <img
                  src={aiAvatar}
                  alt="Johnny B AI"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-foreground/10"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-xs text-muted-foreground mb-1.5">Johnny B AI</div>
                <TypingBubble key={step} text={promptText} />
              </div>
            </div>

            {step !== "name" && name && (
              <div className="flex justify-end mb-3">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{name}</div>
              </div>
            )}
            {step === "password" && signupEmail && (
              <div className="flex justify-end mb-3">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{signupEmail}</div>
              </div>
            )}

            <form onSubmit={handleSignupNext} className="flex gap-2 items-center mt-6">
              <Input
                key={step}
                ref={signupInputRef}
                {...(signupInputProps as any)}
                className="h-12 rounded-xl text-base border-2 border-foreground"
              />
              <Button
                type="submit"
                disabled={!canAdvanceSignup || loading}
                className="h-12 w-12 rounded-xl shrink-0 p-0 border-2 border-foreground"
                aria-label="Continue"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">Already have an account?</p>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <LogIn className="w-4 h-4" />
                Sign in instead
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Sign in to continue your challenge.
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
                <Label htmlFor="login-password">Password</Label>
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

              <Button
                type="submit"
                disabled={!canSubmitLogin || loading}
                className="w-full h-12 rounded-xl text-base gap-2 border-2 border-foreground"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Signing in…" : "Sign in"}
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
