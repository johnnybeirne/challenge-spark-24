import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Spinner from "@/components/Spinner";

const ADMIN_PASSWORD = "challengeos2024";

interface UserRow {
  name: string | null;
  email: string | null;
  invite_code: string;
  referred_by: string | null;
  direct_referral_count: number;
  indirect_referral_count: number;
  created_at: string;
}

interface AnalyticsData {
  counts: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  total_events: number;
  users?: UserRow[];
}

const FUNNEL_STEPS = [
  { event: "assessment_started", label: "Assessment Started" },
  { event: "assessment_completed", label: "Assessment Completed" },
  { event: "signup_completed", label: "Signup" },
  { event: "day_completed", label: "Day 1+" },
  { event: "challenge_completed", label: "Challenge Complete" },
];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res, error: err } = await supabase.functions.invoke(
        "analytics-admin",
        { body: { password: ADMIN_PASSWORD } }
      );
      if (err) throw err;
      if (res?.error) {
        setError(res.error);
        return;
      }
      setData(res);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = async () => {
    loadData();
  };

  const counts = data?.counts ?? {};
  const totalUsers = counts["signup_completed"] ?? 0;
  const totalReferrals = counts["referral_sent"] ?? 0;
  const completions = counts["challenge_completed"] ?? 0;
  const completionRate = totalUsers > 0 ? Math.round((completions / totalUsers) * 100) : 0;

  // Funnel data
  const funnelData = FUNNEL_STEPS.map((step) => ({
    ...step,
    count: counts[step.event] ?? 0,
  }));
  const maxFunnel = Math.max(...funnelData.map((f) => f.count), 1);

  const users = data?.users ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Refresh"}
          </Button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{users.length || totalUsers}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Funnel */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Conversion Funnel
              </h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {funnelData.map((step, i) => {
                    const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0;
                    const prevCount = i > 0 ? funnelData[i - 1].count : null;
                    const dropoff =
                      prevCount && prevCount > 0
                        ? Math.round((step.count / prevCount) * 100)
                        : null;

                    return (
                      <div key={step.event}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            <span className="text-sm font-medium text-foreground">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{step.count}</span>
                            {dropoff !== null && (
                              <span className="text-xs text-muted-foreground">({dropoff}%)</span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* All Events */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                All Events
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {Object.entries(counts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([event, count]) => (
                        <div
                          key={event}
                          className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-foreground font-mono">{event}</span>
                          <span className="text-sm font-bold text-foreground">{count}</span>
                        </div>
                      ))}
                    {Object.keys(counts).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No events tracked yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Total events: {data?.total_events ?? 0}
            </p>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left p-3 font-semibold">Name</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Joined</th>
                          <th className="text-left p-3 font-semibold">Code</th>
                          <th className="text-left p-3 font-semibold">Invited By</th>
                          <th className="text-right p-3 font-semibold">Direct</th>
                          <th className="text-right p-3 font-semibold">Indirect</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u.invite_code}
                            className="border-b border-border last:border-0 hover:bg-muted/30"
                          >
                            <td className="p-3 font-medium">{u.name || "—"}</td>
                            <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-mono text-xs">{u.invite_code}</td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {u.referred_by || "—"}
                            </td>
                            <td className="p-3 text-right font-bold">{u.direct_referral_count}</td>
                            <td className="p-3 text-right text-muted-foreground">
                              {u.indirect_referral_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAnalytics;
