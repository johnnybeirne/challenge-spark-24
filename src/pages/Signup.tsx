import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import aiAvatar from "@/assets/ai-avatar.png";

const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";

type Mode = "signup" | "login";
type Step = "name" | "email" | "password";

const PROMPTS: Record<Step, { signup: string; login: string }> = {
  name: {
    signup: "Johnny here — what's your name?",
    login: "Welcome back. What's your email?",
  },
  email: {
    signup: "Nice to meet you, {name}. What email should I use for your account?",
    login: "And your password?",
  },
  password: {
    signup: "Pick a password (6+ characters) and you're in.",
    login: "",
  },
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
  const [step, setStep] = useState<Step>(mode === "login" ? "email" : "name");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, [step]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep(next === "login" ? "email" : "name");
    setPassword("");
  };

  const promptText = (() => {
    const t = PROMPTS[step][mode];
    return t.replace("{name}", name.trim() || "there");
  })();

  const canAdvance = (() => {
    if (step === "name") return name.trim().length > 0;
    if (step === "email") return email.trim().includes("@");
    if (step === "password") return password.length >= 6;
    return false;
  })();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvance || loading) return;

    if (mode === "signup") {
      if (step === "name") return setStep("email");
      if (step === "email") return setStep("password");
      // password — submit signup
      setLoading(true);
      let referredBy: string | null = null;
      let partnerRef: string | null = null;
      try {
        referredBy = sessionStorage.getItem(REF_SESSION_KEY);
        partnerRef = sessionStorage.getItem(PARTNER_REF_KEY);
      } catch {}
      const { error } = await signUp(email.trim().toLowerCase(), password, {
        name: name.trim(),
        ...(referredBy ? { referred_by: referredBy } : {}),
      });
      setLoading(false);
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          toast.info("Looks like you already have an account — sign in instead.");
          setMode("login");
          setStep("password");
          setPassword("");
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
      return;
    }

    // Login flow
    if (step === "email") return setStep("password");
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) return toast.error(error.message || "Login failed");
    navigate("/dashboard");
  };

  const inputProps = (() => {
    if (step === "name")
      return { type: "text", placeholder: "Type your name…", value: name, onChange: (e: any) => setName(e.target.value), autoComplete: "name", maxLength: 100 };
    if (step === "email")
      return { type: "email", placeholder: "you@example.com", value: email, onChange: (e: any) => setEmail(e.target.value), autoComplete: "email", maxLength: 255 };
    return { type: "password", placeholder: "••••••", value: password, onChange: (e: any) => setPassword(e.target.value), autoComplete: mode === "signup" ? "new-password" : "current-password", minLength: 6 };
  })();

  const stepIndex = step === "name" ? 1 : step === "email" ? (mode === "signup" ? 2 : 1) : (mode === "signup" ? 3 : 2);
  const totalSteps = mode === "signup" ? 3 : 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Mode picker — always visible at the top */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border-2 border-foreground bg-card mb-6">
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            Sign in
          </button>
        </div>

        {/* Step indicator */}
        <p className="text-xs text-muted-foreground text-center mb-6">
          Step {stepIndex} of {totalSteps}
        </p>

        {/* Conversation */}
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
            <TypingBubble key={`${mode}-${step}`} text={promptText} />
          </div>
        </div>

        {/* Echo previous answers as user bubbles */}
        {mode === "signup" && step !== "name" && name && (
          <div className="flex justify-end mb-3">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{name}</div>
          </div>
        )}
        {mode === "signup" && step === "password" && email && (
          <div className="flex justify-end mb-3">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{email}</div>
          </div>
        )}
        {mode === "login" && step === "password" && email && (
          <div className="flex justify-end mb-3">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{email}</div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleNext} className="flex gap-2 items-center mt-6">
          <Input
            key={`${mode}-${step}`}
            ref={inputRef}
            {...(inputProps as any)}
            className="h-12 rounded-xl text-base border-2 border-foreground"
          />
          <Button
            type="submit"
            disabled={!canAdvance || loading}
            className="h-12 w-12 rounded-xl shrink-0 p-0 border-2 border-foreground"
            aria-label="Continue"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
