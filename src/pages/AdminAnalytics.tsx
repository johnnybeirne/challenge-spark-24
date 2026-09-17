import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Spinner from "@/components/Spinner";

interface UserRow {
  user_id: string;
  name: string | null;
  email: string | null;
  invite_code: string;
  referred_by: string | null;
  direct_referral_count: number;
  indirect_referral_count: number;
  created_at: string;
}

interface QuizEventRow {
  event_name: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface QuizSession {
  key: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastQuestion: number; // 1-based, 0 = started but never answered
  total: number;
  completed: boolean;
}

interface ServerQuizSession {
  session_key: string;
  started_at: string;
  last_answered_at: string | null;
  completed_at: string | null;
  last_question_index: number | null;
  answered_count: number | null;
  total_questions: number | null;
}

interface ChallengeProgressRow {
  user_id: string;
  current_day: number | null;
  day_completed_at: Record<string, string> | null;
  completed: boolean;
  started_at: string;
  updated_at: string;
}

interface DropoffRow {
  key: string;
  area: "quiz" | "challenge";
  areaLabel: string;
  step: string;
  stepLabel: string;
  name: string;
  email: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  progress: string;
}

type DropoffArea = "all" | "quiz" | "challenge";

interface AnalyticsData {
  counts: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  total_events: number;
  users?: UserRow[];
  quiz_events?: QuizEventRow[];
  quiz_sessions?: ServerQuizSession[];
  challenge_progress?: ChallengeProgressRow[];
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Groups raw quiz events into one row per person's run through the quiz. */
function buildQuizSessions(events: QuizEventRow[]): QuizSession[] {
  const asc = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const sessions = new Map<string, QuizSession>();
  let legacyKey = "";
  let legacyLast = 0;

  for (const e of asc) {
    const meta = e.metadata ?? {};
    const ts = new Date(e.created_at).getTime();
    let key = meta.sessionId as string | undefined;
    if (!key) {
      const gapped = !legacyKey || ts - legacyLast > 30 * 60 * 1000;
      if (e.event_name === "assessment_started" || gapped) {
        legacyKey = `legacy_${e.created_at}`;
      }
      legacyLast = ts;
      key = legacyKey;
    }

    const existing = sessions.get(key);
    const session: QuizSession = existing ?? {
      key,
      firstSeenAt: e.created_at,
      lastSeenAt: e.created_at,
      lastQuestion: 0,
      total: Number(meta.total) || 9,
      completed: false,
    };
    if (ts < new Date(session.firstSeenAt).getTime()) session.firstSeenAt = e.created_at;
    if (ts > new Date(session.lastSeenAt).getTime()) session.lastSeenAt = e.created_at;
    if (Number(meta.total)) session.total = Number(meta.total);
    if (e.event_name === "assessment_question_answered") {
      session.lastQuestion = Math.max(session.lastQuestion, Number(meta.index ?? 0) + 1);
    }
    if (e.event_name === "assessment_completed") session.completed = true;
    sessions.set(key, session);
  }

  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime()
  );
}

const FUNNEL_STEPS = [
  { event: "assessment_started", label: "Assessment Started" },
  { event: "assessment_completed", label: "Assessment Completed" },
  { event: "signup_completed", label: "Signup" },
  { event: "day_completed", label: "Day 1+" },
  { event: "challenge_completed", label: "Challenge Complete" },
];

function getChallengeDropoffDay(row: ChallengeProgressRow): number {
  const completedDays = row.day_completed_at ?? {};
  const currentDay = Math.min(Math.max(row.current_day ?? 1, 1), 3);

  for (let day = 1; day <= 3; day += 1) {
    if (!completedDays[`day${day}`]) return Math.max(day, currentDay);
  }

  return 3;
}

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dropoffArea, setDropoffArea] = useState<DropoffArea>("all");
  const [dropoffStep, setDropoffStep] = useState("all");
  const [dropoffSort, setDropoffSort] = useState("lastSeen_desc");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [showSignupList, setShowSignupList] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res, error: err } = await supabase.functions.invoke(
        "analytics-admin",
        { body: {} }
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
  const users = data?.users ?? [];
  // Signups are counted from real accounts, not raw events (events can fire
  // twice for one person and carry no name or email).
  const totalUsers = users.length;
  const totalReferrals = counts["referral_sent"] ?? 0;
  const completions = counts["challenge_completed"] ?? 0;
  const completionRate = totalUsers > 0 ? Math.round((completions / totalUsers) * 100) : 0;

  // Funnel data
  const funnelData = FUNNEL_STEPS.map((step) => ({
    ...step,
    count: step.event === "signup_completed" ? totalUsers : counts[step.event] ?? 0,
  }));
  const maxFunnel = Math.max(...funnelData.map((f) => f.count), 1);
  // Server-recorded sessions are authoritative; older attempts are reconstructed
  // from raw events so nothing already captured disappears.
  const serverSessions: QuizSession[] = (data?.quiz_sessions ?? []).map((s) => ({
    key: s.session_key,
    firstSeenAt: s.started_at,
    lastSeenAt: s.completed_at ?? s.last_answered_at ?? s.started_at,
    lastQuestion:
      s.last_question_index !== null && s.last_question_index !== undefined
        ? s.last_question_index + 1
        : (s.answered_count ?? 0),
    total: s.total_questions ?? 9,
    completed: !!s.completed_at,
  }));
  const serverKeys = new Set(serverSessions.map((s) => s.key));
  const quizSessions = [
    ...serverSessions,
    ...buildQuizSessions(data?.quiz_events ?? []).filter((s) => !serverKeys.has(s.key)),
  ].sort((a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime());
  const quizTotal = Math.max(9, ...quizSessions.map((s) => s.total));
  const latestOf = (list: QuizSession[]) =>
    list.reduce<string | null>(
      (latest, s) =>
        !latest || new Date(s.lastSeenAt).getTime() > new Date(latest).getTime()
          ? s.lastSeenAt
          : latest,
      null
    );
  const questionStats = Array.from({ length: quizTotal }, (_, i) => {
    const reached = quizSessions.filter((s) => s.lastQuestion >= i + 1);
    const stopped = quizSessions.filter((s) => !s.completed && s.lastQuestion === i + 1);
    return {
      count: reached.length,
      lastReachedAt: latestOf(reached),
      lastDropAt: latestOf(stopped),
    };
  });
  const reachedCounts = questionStats.map((q) => q.count);
  const quizStarts = quizSessions.length;

  const challengeProgress = data?.challenge_progress ?? [];
  const usersById = new Map(users.map((u) => [u.user_id, u]));

  const quizDropoffs: DropoffRow[] = quizSessions
    .filter((s) => !s.completed)
    .map((s) => ({
      key: `quiz-${s.key}`,
      area: "quiz",
      areaLabel: "Quiz",
      step: `quiz-${s.lastQuestion}`,
      stepLabel:
        s.lastQuestion === 0 ? "Before question 1" : `Question ${s.lastQuestion} of ${s.total}`,
      name: "Anonymous quiz taker",
      email: null,
      firstSeenAt: s.firstSeenAt,
      lastSeenAt: s.lastSeenAt,
      progress: `${s.lastQuestion} of ${s.total} questions`,
    }));

  const challengeDropoffs: DropoffRow[] = challengeProgress
    .filter((row) => !row.completed)
    .map((row) => {
      const day = getChallengeDropoffDay(row);
      const completedDays = Object.keys(row.day_completed_at ?? {}).filter((key) =>
        ["day1", "day2", "day3"].includes(key)
      ).length;
      const user = usersById.get(row.user_id);

      return {
        key: `challenge-${row.user_id}`,
        area: "challenge" as const,
        areaLabel: "Challenge",
        step: `day-${day}`,
        stepLabel: `Day ${day}`,
        name: user?.name || user?.email || "Challenge participant",
        email: user?.email ?? null,
        firstSeenAt: row.started_at,
        lastSeenAt: row.updated_at,
        progress: `${completedDays} of 3 days`,
      };
    });

  const dropoffRows = [...quizDropoffs, ...challengeDropoffs].sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );
  const areaFilteredDropoffs = dropoffRows.filter(
    (row) => dropoffArea === "all" || row.area === dropoffArea
  );
  const filteredDropoffs = areaFilteredDropoffs.filter(
    (row) => dropoffStep === "all" || row.step === dropoffStep
  );

  const getDropoffProgressPct = (progress: string): number => {
    const percent = progress.match(/\((\d+)%\)/);
    if (percent) return Number(percent[1]);
    const parts = progress.match(/^(\d+) of (\d+)/);
    if (parts) return Math.round((Number(parts[1]) / Math.max(1, Number(parts[2]))) * 100);
    return 0;
  };

  const getDropoffDurationSecs = (row: DropoffRow): number =>
    Math.max(
      0,
      Math.round(
        (new Date(row.lastSeenAt).getTime() - new Date(row.firstSeenAt).getTime()) / 1000
      )
    );

  const formatDuration = (secs: number): string => {
    if (secs < 60) return `${secs}s`;
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  };

  const query = dropoffQuery.trim().toLowerCase();
  const sortedFilteredDropoffs = filteredDropoffs
    .filter(
      (row) =>
        !query ||
        row.name.toLowerCase().includes(query) ||
        (row.email ?? "").toLowerCase().includes(query) ||
        row.stepLabel.toLowerCase().includes(query)
    )
    .sort((a, b) => {
      switch (dropoffSort) {
        case "lastSeen_asc":
          return new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime();
        case "firstSeen_desc":
          return new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime();
        case "firstSeen_asc":
          return new Date(a.firstSeenAt).getTime() - new Date(b.firstSeenAt).getTime();
        case "progress_desc":
          return getDropoffProgressPct(b.progress) - getDropoffProgressPct(a.progress);
        case "progress_asc":
          return getDropoffProgressPct(a.progress) - getDropoffProgressPct(b.progress);
        case "duration_desc":
          return getDropoffDurationSecs(b) - getDropoffDurationSecs(a);
        case "duration_asc":
          return getDropoffDurationSecs(a) - getDropoffDurationSecs(b);
        default:
          return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      }
    });

  const dropoffSummary = Array.from(
    areaFilteredDropoffs.reduce((map, row) => {
      const existing = map.get(row.step);
      map.set(row.step, {
        step: row.step,
        label: row.stepLabel,
        areaLabel: row.areaLabel,
        count: (existing?.count ?? 0) + 1,
        latestAt:
          existing && new Date(existing.latestAt) > new Date(row.lastSeenAt)
            ? existing.latestAt
            : row.lastSeenAt,
      });
      return map;
    }, new Map<string, { step: string; label: string; areaLabel: string; count: number; latestAt: string }>())
  )
    .map(([, value]) => value)
    .sort(
      (a, b) =>
        b.count - a.count ||
        new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    );
  const maxDropoffCount = Math.max(1, ...dropoffSummary.map((row) => row.count));

  const dropoffStepOptions = [
    { value: "all", label: "All steps and days" },
    ...(dropoffArea !== "challenge"
      ? [
          { value: "quiz-0", label: "Quiz: Before question 1" },
          ...Array.from({ length: quizTotal }, (_, i) => ({
            value: `quiz-${i + 1}`,
            label: `Quiz: Question ${i + 1}`,
          })),
        ]
      : []),
    ...(dropoffArea !== "quiz"
      ? [1, 2, 3].map((day) => ({ value: `day-${day}`, label: `Challenge: Day ${day}` }))
      : []),
  ];

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
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="dropoffs">Drop-offs ({dropoffRows.length})</TabsTrigger>
            <TabsTrigger value="quiz">Quiz drop-off ({quizStarts})</TabsTrigger>
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

                    const isSignup = step.event === "signup_completed";

                    return (
                      <div key={step.event}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            {isSignup ? (
                              <button
                                type="button"
                                onClick={() => setShowSignupList((v) => !v)}
                                className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                              >
                                {step.label}
                              </button>
                            ) : (
                              <span className="text-sm font-medium text-foreground">{step.label}</span>
                            )}
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
                        {isSignup && showSignupList && (
                          <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              Real accounts created ({users.length})
                            </p>
                            {users.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No accounts yet.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                                {users.map((u) => (
                                  <li
                                    key={u.user_id}
                                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                                  >
                                    <span className="text-foreground">
                                      {u.name || u.email || "Unnamed"}
                                      {u.name && u.email && (
                                        <span className="text-muted-foreground"> · {u.email}</span>
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(u.created_at).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
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

          <TabsContent value="dropoffs" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Journey
                </label>
                <Select
                  value={dropoffArea}
                  onValueChange={(value) => {
                    setDropoffArea(value as DropoffArea);
                    setDropoffStep("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Quiz and challenge</SelectItem>
                    <SelectItem value="quiz">Quiz only</SelectItem>
                    <SelectItem value="challenge">Challenge only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Step or day
                </label>
                <Select value={dropoffStep} onValueChange={setDropoffStep}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dropoffStepOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Sort by
                </label>
                <Select value={dropoffSort} onValueChange={setDropoffSort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastSeen_desc">Last seen: newest first</SelectItem>
                    <SelectItem value="lastSeen_asc">Last seen: oldest first</SelectItem>
                    <SelectItem value="firstSeen_desc">First seen: newest first</SelectItem>
                    <SelectItem value="firstSeen_asc">First seen: oldest first</SelectItem>
                    <SelectItem value="progress_desc">Progress: furthest first</SelectItem>
                    <SelectItem value="progress_asc">Progress: least first</SelectItem>
                    <SelectItem value="duration_desc">Duration: longest first</SelectItem>
                    <SelectItem value="duration_asc">Duration: shortest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Search
                </label>
                <Input
                  value={dropoffQuery}
                  onChange={(event) => setDropoffQuery(event.target.value)}
                  placeholder="Name, email or step"
                />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Biggest drop-off points
              </h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {dropoffSummary.map((row) => {
                    const pct = (row.count / maxDropoffCount) * 100;
                    const share = areaFilteredDropoffs.length
                      ? Math.round((row.count / areaFilteredDropoffs.length) * 100)
                      : 0;

                    return (
                      <button
                        key={row.step}
                        type="button"
                        onClick={() => setDropoffStep(row.step)}
                        className="w-full text-left rounded-md p-2 -m-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {row.areaLabel}: {row.label}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Last seen {fmt(row.latestAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground">{row.count}</span>
                            <p className="text-xs text-muted-foreground">{share}% of drop-offs</p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                  {dropoffSummary.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No incomplete quiz or challenge journeys match these filters
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Filtered drop-offs ({sortedFilteredDropoffs.length})
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left p-3 font-semibold">Journey</th>
                          <th className="text-left p-3 font-semibold">Person</th>
                          <th className="text-left p-3 font-semibold">First seen</th>
                          <th className="text-left p-3 font-semibold">Last seen</th>
                          <th className="text-left p-3 font-semibold">Duration</th>
                          <th className="text-left p-3 font-semibold">Dropped at</th>
                          <th className="text-left p-3 font-semibold">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFilteredDropoffs.slice(0, 200).map((row) => (
                          <tr
                            key={row.key}
                            className="border-b border-border last:border-0 hover:bg-muted/30"
                          >
                            <td className="p-3 whitespace-nowrap">
                              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                                {row.areaLabel}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{row.name}</div>
                              {row.email && (
                                <div className="text-xs text-muted-foreground">{row.email}</div>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {fmt(row.firstSeenAt)}
                            </td>
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {fmt(row.lastSeenAt)}
                            </td>
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {formatDuration(getDropoffDurationSecs(row))}
                            </td>
                            <td className="p-3 whitespace-nowrap font-medium">{row.stepLabel}</td>
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {row.progress}
                            </td>
                          </tr>
                        ))}
                        {sortedFilteredDropoffs.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                              No drop-offs match these filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Where people stop
              </h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {questionStats.map((stat, i) => {
                    const count = stat.count;
                    const pct = quizStarts > 0 ? (count / quizStarts) * 100 : 0;
                    const dropped =
                      i < reachedCounts.length - 1 ? count - reachedCounts[i + 1] : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Question {i + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{count}</span>
                            {dropped > 0 && (
                              <span className="text-xs text-muted-foreground">
                                -{dropped} left here
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span>
                            Last reached: {stat.lastReachedAt ? fmt(stat.lastReachedAt) : "never"}
                          </span>
                          {stat.lastDropAt && <span>Last stopped here: {fmt(stat.lastDropAt)}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {quizStarts === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No quiz activity recorded yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Recent quiz attempts
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left p-3 font-semibold">First seen</th>
                          <th className="text-left p-3 font-semibold">Last seen</th>
                          <th className="text-left p-3 font-semibold">Time on quiz</th>
                          <th className="text-left p-3 font-semibold w-[180px]">Progress</th>
                          <th className="text-left p-3 font-semibold">Stopped at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizSessions.slice(0, 200).map((s) => {
                          const secs = Math.max(
                            0,
                            Math.round(
                              (new Date(s.lastSeenAt).getTime() - new Date(s.firstSeenAt).getTime()) / 1000
                            )
                          );
                          return (
                            <tr
                              key={s.key}
                              className="border-b border-border last:border-0 hover:bg-muted/30"
                            >
                              <td className="p-3 whitespace-nowrap">{fmt(s.firstSeenAt)}</td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground">
                                {fmt(s.lastSeenAt)}
                              </td>
                              <td className="p-3 text-muted-foreground whitespace-nowrap">
                                {Math.floor(secs / 60)}m {secs % 60}s
                              </td>
                              <td className="p-3">
                                {(() => {
                                  const reached = s.completed ? s.total : s.lastQuestion;
                                  const pct = s.total > 0 ? (reached / s.total) * 100 : 0;
                                  return (
                                    <div className="min-w-[150px]">
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            s.completed ? "bg-primary" : "bg-amber-500"
                                          }`}
                                          style={{ width: `${Math.max(pct, 3)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {reached} of {s.total} ({Math.round(pct)}%)
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-3 whitespace-nowrap font-medium">
                                {s.completed
                                  ? "Finished"
                                  : s.lastQuestion === 0
                                    ? "Left before question 1"
                                    : `Question ${s.lastQuestion} of ${s.total}`}
                              </td>
                            </tr>
                          );
                        })}
                        {quizSessions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                              No quiz attempts recorded yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAnalytics;
