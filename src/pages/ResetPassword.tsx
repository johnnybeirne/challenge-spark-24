import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoveryLink, setHasRecoveryLink] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    setHasRecoveryLink(hash.get("type") === "recovery" || query.get("type") === "recovery" || !!hash.get("access_token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Use at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) return toast.error(error.message || "Could not update password");
    toast.success("Password updated. You can sign in now.");
    navigate("/join", { state: { mode: "login" } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your ChallengeOS account.
        </p>

        {!hasRecoveryLink && !session && (
          <p className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Use the reset link from your email to open this page securely.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className="h-12 rounded-xl border-2 border-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className="h-12 rounded-xl border-2 border-foreground"
            />
          </div>
          <Button type="submit" disabled={loading || (!hasRecoveryLink && !session)} className="h-12 w-full rounded-xl border-2 border-foreground text-base">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;