import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Copy, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Spinner from "@/components/Spinner";

interface TestAccount {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  surname: string | null;
  name: string | null;
  referral_code: string;
  signup_at: string;
  challenge_started_at: string | null;
  current_day: number | null;
}

const dayFromStart = (iso: string | null): string => {
  if (!iso) return "—";
  const elapsedMs = Date.now() - new Date(iso).getTime();
  if (elapsedMs < 0) return "Pre-start";
  if (elapsedMs >= 72 * 60 * 60 * 1000) return "Expired";
  const day = Math.min(3, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1);
  const hours = Math.floor(elapsedMs / (60 * 60 * 1000));
  return `Day ${day} · ${hours}h in`;
};

const AdminTestAccounts = () => {
  const [tab, setTab] = useState("create");
  const [firstName, setFirstName] = useState("Test");
  const [surname, setSurname] = useState("User");
  const [email, setEmail] = useState("");
  const [signupDate, setSignupDate] = useState<Date>(new Date());
  const [creating, setCreating] = useState(false);
  const [accounts, setAccounts] = useState<TestAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-test-account", {
      body: { action: "list" },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Failed to load");
      return;
    }
    setAccounts(data?.accounts ?? []);
  };

  useEffect(() => {
    if (tab === "manage") loadAccounts();
  }, [tab]);

  const handleCreate = async () => {
    if (!signupDate) return toast.error("Pick a signup date");
    setCreating(true);
    const signupIso = (() => {
      const now = new Date();
      const merged = new Date(signupDate);
      merged.setHours(now.getHours(), now.getMinutes(), 0, 0);
      return merged.toISOString();
    })();
    const { data, error } = await supabase.functions.invoke("admin-test-account", {
      body: {
        action: "create",
        first_name: firstName,
        surname,
        email: email.trim() || undefined,
        signup_at: signupIso,
      },
    });
    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Failed to create");
      return;
    }
    toast.success(`Created ${data.email}`);
    setEmail("");
    if (data?.magic_link) {
      try {
        await navigator.clipboard.writeText(data.magic_link);
        toast.success("Magic link copied to clipboard");
      } catch {}
    }
    setTab("manage");
  };

  const handleMagicLink = async (acc: TestAccount) => {
    const { data, error } = await supabase.functions.invoke("admin-test-account", {
      body: { action: "magic_link", email: acc.email },
    });
    if (error || data?.error) return toast.error(data?.error ?? error?.message ?? "Failed");
    if (data?.magic_link) {
      await navigator.clipboard.writeText(data.magic_link);
      toast.success("Magic link copied — open in incognito");
    }
  };

  const handleDelete = async (acc: TestAccount) => {
    if (!confirm(`Delete ${acc.email}? This removes the auth user and all associated rows.`)) return;
    const { data, error } = await supabase.functions.invoke("admin-test-account", {
      body: { action: "delete", email: acc.email },
    });
    if (error || data?.error) return toast.error(data?.error ?? error?.message ?? "Failed");
    toast.success("Deleted");
    loadAccounts();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Test Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Seed real backdated users to preview the experience as if they signed up on a chosen date. All accounts use the
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">test+*@leadio.test</code>
          email pattern so they're easy to filter out of analytics.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="create"><UserPlus className="h-4 w-4 mr-1.5" /> Create</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>New test account</CardTitle>
              <CardDescription>
                Creates a real auth user, backdated profile, waitlist row, and challenge progress. Email is auto-confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">First name</Label>
                  <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sn">Surname</Label>
                  <Input id="sn" value={surname} onChange={(e) => setSurname(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="em">Email (optional)</Label>
                <Input
                  id="em"
                  type="email"
                  placeholder="test+catherine@leadio.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must match <code>test+&lt;label&gt;@leadio.test</code>. Leave blank to auto-generate.
                </p>
              </div>
              <div>
                <Label>Signup date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !signupDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {signupDate ? format(signupDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={signupDate}
                      onSelect={(d) => d && setSignupDate(d)}
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  Sets both signup time and Day 1 start. The 72-hour challenge window runs from this date.
                </p>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Creating…" : "Create test account"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Existing test accounts</CardTitle>
                <CardDescription>{accounts.length} account{accounts.length === 1 ? "" : "s"}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadAccounts} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No test accounts yet. Create one in the Create tab.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {acc.first_name} {acc.surname?.[0]}.
                          </p>
                          <Badge variant="secondary" className="text-xs">{dayFromStart(acc.challenge_started_at)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Signed up {format(new Date(acc.signup_at), "PPp")}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleMagicLink(acc)} title="Copy magic link">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(acc)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTestAccounts;
