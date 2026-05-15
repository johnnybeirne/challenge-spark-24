import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Check, AlertCircle } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-unsubscribe`;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ready" | "done" | "already" | "error">("loading");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("error"); setErrMsg("Missing token."); return; }
    (async () => {
      try {
        const r = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`);
        const data = await r.json();
        if (!data.ok) { setState("error"); setErrMsg(data.error || "Invalid link."); return; }
        setEmail(data.email);
        setState(data.alreadyUnsubscribed ? "already" : "ready");
      } catch {
        setState("error"); setErrMsg("Could not verify link.");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (data.ok) setState("done");
      else { setState("error"); setErrMsg(data.error || "Failed."); }
    } catch {
      setState("error"); setErrMsg("Network error.");
    } finally { setSubmitting(false); }
  };

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
              <h1 className="text-xl font-bold">Unsubscribe</h1>
              <p className="text-sm text-muted-foreground">
                Click below to stop receiving emails at <strong>{email}</strong>.
              </p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm unsubscribe
              </Button>
            </>
          )}

          {state === "done" && (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">You're unsubscribed</h1>
              <p className="text-sm text-muted-foreground"><strong>{email}</strong> won't receive any more emails from us.</p>
            </>
          )}

          {state === "already" && (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">Already unsubscribed</h1>
              <p className="text-sm text-muted-foreground"><strong>{email}</strong> is already opted out.</p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h1 className="text-xl font-bold">Link error</h1>
              <p className="text-sm text-muted-foreground">{errMsg}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
