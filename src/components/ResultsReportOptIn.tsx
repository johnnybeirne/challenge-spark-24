import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { useSiteContent } from "@/hooks/useSiteContent";
import { setReportPreview } from "@/lib/reportPreview";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Please add your name" }).max(80, { message: "Name is too long" }),
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255, { message: "Email is too long" }),
});

/**
 * Alternative to joining the challenge: capture name + email and send a
 * sign-in link so the person can read their report inside their own area.
 */
const ResultsReportOptIn = () => {
  const navigate = useNavigate();
  const { sendEmailCode } = useAuth();
  const { t } = useSiteContent("results");
  const { state } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameError(null);
    setEmailError(null);
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "name") setNameError((prev) => prev ?? issue.message);
        if (issue.path[0] === "email") setEmailError((prev) => prev ?? issue.message);
      }
      return;
    }
    setSending(true);
    // Journey stages: append "got report" to the array the quiz completion
    // step wrote, keep it in session storage for later stages, and pass the
    // joined string to the account so the profile can record the path taken.
    let journeyStages: string[] = [];
    try {
      const raw = sessionStorage.getItem("journey_stages");
      const parsedStages = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsedStages)) journeyStages = parsedStages.filter((s) => typeof s === "string");
    } catch {
      journeyStages = [];
    }
    if (!journeyStages.includes("got report")) journeyStages.push("got report");
    sessionStorage.setItem("journey_stages", JSON.stringify(journeyStages));
    const journeyTag = journeyStages.join(", ");
    // Same Supabase auth system as the challenge join flow (one auth.users
    // account, one profiles row). The report_only markers tell the signup
    // trigger to skip the challenge progress row, so no clock starts and no
    // day is unlocked until the person actually joins the challenge.
    const { error: authError } = await sendEmailCode(parsed.data.email, {
      name: parsed.data.name,
      first_name: parsed.data.name.split(" ")[0],
      signup_product: "report",
      entry_intent: "report",
      journey_tag: journeyTag,
    });
    setSending(false);
    if (authError) {
      setError(authError.message ?? "We could not send the link. Please try again.");
      return;
    }
    trackEvent("results_report_optin" as any, {});
    // Client-side preview only - not a session. Lets the results page show a
    // logged-in-looking view until they enter the code from their email.
    setReportPreview(parsed.data.name, parsed.data.email);
    setSent(true);

    // Save this submission against a unique, non-guessable token and email the
    // link, so they can reopen this exact report later from any device.
    const { data, error: saveError } = await supabase.functions.invoke("quiz-report", {
      body: {
        action: "create",
        name: parsed.data.name,
        email: parsed.data.email,
        assessment: state.assessment ?? {},
        origin: window.location.origin,
      },
    });
    const token = (data as { token?: string } | null)?.token;
    if (!saveError && token) {
      navigate(`/r/${token}`);
      return;
    }
    // Fall back to the device-local report page if the link could not be made.
    navigate("/report");
  };


  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-primary" />
        <h3 className="text-[length:var(--h2-size)] font-semibold text-foreground">{t("report_optin.success_title", "Check your email")}</h3>
        <p className="mt-2 text-[var(--body-size)] text-muted-foreground">
          {t("report_optin.success_body", "We sent a 6-digit code to {email}. Enter it in the bar below to keep access to your report.").replace("{email}", email)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h3 className="text-[length:var(--h2-size)] font-semibold text-foreground">
            {t("report_optin.title", "Not ready for the challenge? Get your report instead")}
          </h3>
          <p className="mt-1 text-[var(--body-size)] text-muted-foreground">
            {t("report_optin.body", "Add your name and email and we will send you a link to read your full report in your own area.")}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="report-name">{t("report_optin.name_label", "Your name")}</Label>
          <Input
            id="report-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("report_optin.name_placeholder", "Jane Murphy")}
            autoComplete="name"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "report-name-error" : undefined}
          />
          {nameError && (
            <p id="report-name-error" className="text-[var(--body-size)] text-destructive">{nameError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-email">{t("report_optin.email_label", "Email")}</Label>
          <Input
            id="report-email"
            type="email"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("report_optin.email_placeholder", "you@example.com")}
            autoComplete="email"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "report-email-error" : undefined}
          />
          {emailError && (
            <p id="report-email-error" className="text-[var(--body-size)] text-destructive">{emailError}</p>
          )}
        </div>


        {error && <p className="text-[var(--body-size)] text-destructive">{error}</p>}

        <Button type="submit" className="h-12 w-full font-semibold bg-[#F57C00] text-white hover:bg-white hover:text-[#F57C00] hover:border hover:border-[#F57C00]" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("report_optin.sending_label", "Sending your link")}
            </>
          ) : (
            t("report_optin.button_label", "Send me my report")
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResultsReportOptIn;
