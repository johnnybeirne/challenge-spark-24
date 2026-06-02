import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Check, AlertCircle } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-unsubscribe`;

type PageConfig = {
  ready_heading: string; ready_body: string; confirm_button_label: string;
  done_heading: string; done_body: string;
  already_heading: string; already_body: string;
  error_heading: string; error_body: string;
  feedback_enabled: boolean; feedback_prompt: string; feedback_placeholder: string;
  feedback_submit_label: string; feedback_skip_label: string;
  resubscribe_enabled: boolean; resubscribe_label: string; resubscribe_success: string;
};

const FALLBACK: PageConfig = {
  ready_heading: "Unsubscribe",
  ready_body: "Click below to stop receiving emails at {{email}}.",
  confirm_button_label: "Confirm unsubscribe",
  done_heading: "You're unsubscribed",
  done_body: "{{email}} won't receive any more emails from us.",
  already_heading: "Already unsubscribed",
  already_body: "{{email}} is already opted out.",
  error_heading: "Link error",
  error_body: "This unsubscribe link is invalid or has expired.",
  feedback_enabled: true,
  feedback_prompt: "Mind sharing why you're leaving? (optional)",
  feedback_placeholder: "Too many emails, not relevant, etc.",
  feedback_submit_label: "Send feedback",
  feedback_skip_label: "Skip",
  resubscribe_enabled: true,
  resubscribe_label: "Changed your mind? Resubscribe",
  resubscribe_success: "Welcome back — {{email}} is subscribed again.",
};

const interpolate = (s: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{{${k}}}`).join(v), s);

type State = "loading" | "ready" | "done" | "feedback" | "already" | "resubscribed" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [config, setConfig] = useState<PageConfig>(FALLBACK);

  useEffect(() => {
    if (!token) { setState("error"); setErrMsg(FALLBACK.error_body); return; }
    (async () => {
      try {
        const r = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`);
        const data = await r.json();
        if (data.config) setConfig({ ...FALLBACK, ...data.config });
        if (!data.ok) { setState("error"); setErrMsg(data.error || FALLBACK.error_body); return; }
        setEmail(data.email);
        setState(data.alreadyUnsubscribed ? "already" : "ready");
      } catch {
        setState("error"); setErrMsg("Could not verify link.");
      }
    })();
  }, [token]);

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    return r.json();
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      const data = await post({});
      if (data.ok) setState(config.feedback_enabled ? "feedback" : "done");
      else { setState("error"); setErrMsg(data.error || "Failed."); }
    } catch { setState("error"); setErrMsg("Network error."); }
    finally { setSubmitting(false); }
  };

  const sendFeedback = async (skip: boolean) => {
    setSubmitting(true);
    try {
      if (!skip && reason.trim()) await post({ reason: reason.trim() });
      setState("done");
    } finally { setSubmitting(false); }
  };

  const resubscribe = async () => {
    setSubmitting(true);
    try {
      const data = await post({ action: "resubscribe" });
      if (data.ok) setState("resubscribed");
      else { setState("error"); setErrMsg(data.error || "Failed."); }
    } catch { setState("error"); setErrMsg("Network error."); }
    finally { setSubmitting(false); }
  };

  const vars = { email };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          {state === "loading" && (
            <>
              <h1 className="text-xl font-bold">Checking your link...</h1>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </>
          )}

          {state === "ready" && (
            <>
              <h1 className="text-xl font-bold">{interpolate(config.ready_heading, vars)}</h1>
              <p className="text-sm text-muted-foreground">{interpolate(config.ready_body, vars)}</p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {config.confirm_button_label}
              </Button>
            </>
          )}

          {state === "feedback" && (
            <>
              <h1 className="text-xl font-bold">{interpolate(config.feedback_prompt, vars)}</h1>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={config.feedback_placeholder}
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={submitting} onClick={() => sendFeedback(true)}>
                  {config.feedback_skip_label}
                </Button>
                <Button className="flex-1" disabled={submitting || !reason.trim()} onClick={() => sendFeedback(false)}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {config.feedback_submit_label}
                </Button>
              </div>
            </>
          )}

          {state === "done" && (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">{interpolate(config.done_heading, vars)}</h1>
              <p className="text-sm text-muted-foreground">{interpolate(config.done_body, vars)}</p>
              {config.resubscribe_enabled && (
                <Button variant="outline" onClick={resubscribe} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {config.resubscribe_label}
                </Button>
              )}
            </>
          )}

          {state === "already" && (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">{interpolate(config.already_heading, vars)}</h1>
              <p className="text-sm text-muted-foreground">{interpolate(config.already_body, vars)}</p>
              {config.resubscribe_enabled && (
                <Button variant="outline" onClick={resubscribe} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {config.resubscribe_label}
                </Button>
              )}
            </>
          )}

          {state === "resubscribed" && (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">You're back in</h1>
              <p className="text-sm text-muted-foreground">{interpolate(config.resubscribe_success, vars)}</p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h1 className="text-xl font-bold">{config.error_heading}</h1>
              <p className="text-sm text-muted-foreground">{errMsg || config.error_body}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
