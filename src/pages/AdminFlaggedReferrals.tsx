import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = {
  id: string;
  referred_email: string | null;
  referrer_email: string | null;
  created_at: string;
  reason: string;
  status: string;
};

const AdminFlaggedReferrals = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("flagged_referrals")
      .select("id, referred_email, referrer_email, created_at, reason, status")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, approve: boolean) => {
    setBusy(id);
    const { error } = await (supabase.rpc as any)("admin_resolve_flagged_referral", { p_id: id, p_approve: approve });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Referral approved" : "Flag dismissed");
    load();
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Flagged referrals</h1>
      <p className="text-sm text-muted-foreground">Referrals held back because the new participant signed up from the same network as their referrer.</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No flagged referrals.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border bg-card p-4 text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="text-muted-foreground">New participant email</dt><dd>{r.referred_email || "Unknown"}</dd></div>
                <div><dt className="text-muted-foreground">Referrer email</dt><dd>{r.referrer_email || "Unknown"}</dd></div>
                <div><dt className="text-muted-foreground">Sign-up date</dt><dd>{new Date(r.created_at).toLocaleString()}</dd></div>
                <div><dt className="text-muted-foreground">Reason</dt><dd>{r.reason}</dd></div>
              </dl>
              <div className="mt-3 flex items-center gap-2">
                {r.status === "pending" ? (
                  <>
                    <Button size="sm" disabled={busy === r.id} onClick={() => resolve(r.id, true)}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => resolve(r.id, false)}>Dismiss</Button>
                  </>
                ) : (
                  <span className="text-muted-foreground">{r.status === "approved" ? "Approved" : "Dismissed"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFlaggedReferrals;
