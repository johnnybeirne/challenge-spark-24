import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const REASONS: Record<string, string> = {
  not_found: "This private link is not recognised.",
  revoked: "This private link has been turned off.",
  expired: "This private link is no longer active.",
  used_up: "This private link has already been used.",
};

/**
 * /pass/:token
 * Secret owner issued guest pass. Redeems the token, then sends the visitor
 * into the signup flow flagged as an invited guest.
 */
const GuestPass = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError(REASONS.not_found);
        return;
      }
      const { data, error: rpcError } = await supabase.rpc("redeem_guest_pass", {
        _token: token,
      });
      if (cancelled) return;

      const result = (data ?? {}) as { valid?: boolean; reason?: string; label?: string };

      if (rpcError || !result.valid) {
        setError(REASONS[result.reason ?? ""] ?? "This private link is not valid.");
        return;
      }

      try {
        sessionStorage.setItem("leadtree_guest_pass", token);
        sessionStorage.setItem("leadtree_guest_pass_label", result.label ?? "");
      } catch {
        // ignore storage failures
      }
      navigate("/challenge/join?guest=1", { replace: true });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">Private link unavailable</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/")}>Back to the home page</Button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Checking your private link</p>
          </>
        )}
      </Card>
    </div>
  );
};

export default GuestPass;
