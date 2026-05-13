import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getStoredAttribution,
  resolveAttributionPartner,
  bindAttributionToUser,
  clearAttribution,
  captureAttribution,
  type StoredAttribution,
} from "@/lib/attribution";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface AttribRow {
  id: string;
  user_id: string;
  partner_id: string;
  partner_slug: string;
  parent_partner_id: string | null;
  landing_path: string | null;
  landing_query: any;
  source: string;
  first_touch_at: string;
  bound_at: string;
}

interface DupRow { user_id: string; n: number }

const DebugAttribution = () => {
  const { user } = useAuth();
  const [stored, setStored] = useState<StoredAttribution | undefined>();
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [myRows, setMyRows] = useState<AttribRow[]>([]);
  const [recent, setRecent] = useState<AttribRow[]>([]);
  const [dups, setDups] = useState<DupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [forceSlug, setForceSlug] = useState("");
  const [msg, setMsg] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setStored(getStoredAttribution());

    const partner = await resolveAttributionPartner();
    setResolvedName(partner?.display_name ?? null);
    setResolvedSlug(partner?.slug ?? null);

    if (user?.id) {
      const { data } = await (supabase.from("referral_attributions") as any)
        .select("*").eq("user_id", user.id).order("bound_at", { ascending: false });
      setMyRows((data as AttribRow[]) ?? []);
    } else {
      setMyRows([]);
    }

    const { data: r } = await (supabase.from("referral_attributions") as any)
      .select("*").order("bound_at", { ascending: false }).limit(20);
    setRecent((r as AttribRow[]) ?? []);

    // Duplicate detection (admin-only readable; otherwise empty)
    const { data: all } = await (supabase.from("referral_attributions") as any)
      .select("user_id");
    if (Array.isArray(all)) {
      const counts = new Map<string, number>();
      (all as { user_id: string }[]).forEach(r => counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
      setDups([...counts.entries()].filter(([, n]) => n > 1).map(([user_id, n]) => ({ user_id, n })));
    }

    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const handleSimulate = () => {
    if (!forceSlug.trim()) return;
    clearAttribution();
    captureAttribution(forceSlug.trim(), { source: "query_param", path: "/debug/attribution", query: { ref: forceSlug.trim() } });
    setMsg(`Captured ${forceSlug.trim()} (first-touch reset).`);
    refresh();
  };

  const handleBindNow = async () => {
    if (!user?.id) { setMsg("Sign in first."); return; }
    await bindAttributionToUser(user.id);
    setMsg("Bind attempted. See your rows below.");
    refresh();
  };

  const myCount = myRows.length;
  const expected = stored?.slug ? 1 : 0;
  const ok = user?.id ? myCount === expected || (myCount === 1 && expected === 0) : null;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Attribution Debug</h1>
      <p className="text-sm text-muted-foreground">
        Verifies that first-touch <code>?ref=</code> creates exactly one <code>referral_attributions</code> row per user after signup.
      </p>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Stored first-touch (this browser)</h2>
        {stored ? (
          <div className="text-sm space-y-1">
            <div><b>slug:</b> {stored.slug}</div>
            <div><b>source:</b> {stored.source}</div>
            <div><b>path:</b> {stored.path || "—"}</div>
            <div><b>captured:</b> {stored.ts ? new Date(stored.ts).toISOString() : "—"}</div>
            <div><b>resolves to partner:</b> {resolvedSlug ? <Badge>{resolvedName || resolvedSlug}</Badge> : <Badge variant="destructive">unresolved</Badge>}</div>
          </div>
        ) : <p className="text-sm text-muted-foreground">No attribution stored.</p>}
        <div className="flex gap-2 pt-2">
          <Input placeholder="slug to simulate (e.g. jv_abc123)" value={forceSlug} onChange={e => setForceSlug(e.target.value)} />
          <Button onClick={handleSimulate} variant="outline">Simulate ?ref=</Button>
          <Button onClick={() => { clearAttribution(); refresh(); }} variant="ghost">Clear</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">My referral_attributions rows</h2>
          {user?.id ? (
            ok ? <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> {myCount} row(s) — OK</Badge>
               : <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> {myCount} row(s) — expected {expected}</Badge>
          ) : <Badge variant="outline">Not signed in</Badge>}
        </div>
        {!user?.id && <p className="text-sm text-muted-foreground">Sign in to verify per-user binding.</p>}
        {user?.id && (
          <>
            <Button size="sm" onClick={handleBindNow} variant="outline" className="gap-1">
              <RefreshCw className="w-3 h-3" /> Bind now
            </Button>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(myRows, null, 2)}</pre>
          </>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Duplicate check (any user with &gt;1 row)</h2>
          {dups.length === 0
            ? <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> none</Badge>
            : <Badge variant="destructive">{dups.length} dup users</Badge>}
        </div>
        {dups.length > 0 && (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(dups, null, 2)}</pre>
        )}
        <p className="text-xs text-muted-foreground">Visibility limited by RLS — full picture requires admin role.</p>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Recent attributions (last 20)</h2>
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-80">{JSON.stringify(recent, null, 2)}</pre>
      </Card>

      <div className="flex gap-2">
        <Button onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <Card className="p-4 text-sm space-y-2 bg-muted/40">
        <h2 className="font-semibold">How to test end-to-end</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Open an incognito window.</li>
          <li>Visit <code>/?ref=&lt;partner_slug&gt;</code> (or <code>/p/&lt;slug&gt;</code>, <code>/invite/&lt;slug&gt;</code>).</li>
          <li>Come back to <code>/debug/attribution</code> — confirm "Stored first-touch" shows the slug and resolves to a partner.</li>
          <li>Sign up via <code>/join</code>. After auth, return here — "My rows" should show exactly 1 row, source = first-touch source.</li>
          <li>Reload, sign out / back in — count must stay at 1.</li>
        </ol>
      </Card>
    </div>
  );
};

export default DebugAttribution;
