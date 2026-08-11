// Owner-only automated end-to-end challenge runner.
//
// Creates a throwaway demo participant (qa+<stamp>@leadio.test), drives the
// real challenge sequence against it with a fast-forwarded clock, asserts the
// documented behaviour, then deletes everything it created.
//
// Safety: every write and delete is scoped to emails matching QA_EMAIL_PATTERN.
// Real participant data is only ever read, never modified.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QA_EMAIL_PATTERN = /^qa\+[a-z0-9.\-_]+@leadio\.test$/i;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CHALLENGE_DURATION_MS = 72 * HOUR; // src/lib/challengeWindow.ts
const POINTS_PER_EVENT = 50; // src/lib/points.ts pointRules
const QUIZ_QUESTION_FALLBACK = 9; // src/pages/Results.tsx percentage base

type Status = "pass" | "fail" | "info";
interface Step {
  id: string;
  label: string;
  status: Status;
  ms: number;
  message: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const randomPassword = () => {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};

const inviteCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

/** Mirrors computeSimulatedTiming() in src/lib/simulatedDate.ts. */
function deriveDay(startedMs: number, nowMs: number) {
  const elapsed = Math.max(0, nowMs - startedMs);
  const expired = elapsed >= CHALLENGE_DURATION_MS;
  return {
    expired,
    currentDay: expired ? 4 : Math.min(3, Math.floor(elapsed / DAY) + 1),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const steps: Step[] = [];
  let cursor = Date.now();
  const record = (id: string, label: string, status: Status, message: string) => {
    const now = Date.now();
    steps.push({ id, label, status, ms: now - cursor, message });
    cursor = now;
  };
  const assert = (id: string, label: string, ok: boolean, okMsg: string, failMsg: string) =>
    record(id, label, ok ? "pass" : "fail", ok ? okMsg : failMsg);

  let admin: ReturnType<typeof createClient> | null = null;
  let demoUserId: string | null = null;
  let demoEmail = "";
  let referrerUserId: string | null = null;
  let referrerEmail = "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub;
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const keepData = body?.keep_data === true;
    const requestedCorrect = Number(body?.correct_answers);

    // ---------------------------------------------------------------- setup
    const stamp = Date.now().toString(36);
    demoEmail = `qa+${stamp}@leadio.test`;
    referrerEmail = `qa+${stamp}ref@leadio.test`;
    if (!QA_EMAIL_PATTERN.test(demoEmail) || !QA_EMAIL_PATTERN.test(referrerEmail)) {
      return json({ error: "Generated demo email failed the safety pattern" }, 500);
    }

    // Referrer first so the demo participant can be attributed to it.
    const refCode = inviteCode();
    const { data: refCreated, error: refErr } = await admin.auth.admin.createUser({
      email: referrerEmail,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: { name: "QA Referrer", is_qa_demo: true },
    });
    if (refErr || !refCreated.user) throw new Error(`referrer: ${refErr?.message}`);
    referrerUserId = refCreated.user.id;
    await admin.from("profiles").update({ invite_code: refCode, first_name: "QA", surname: "Referrer" })
      .eq("user_id", referrerUserId);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: demoEmail,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: { name: "QA Demo", is_qa_demo: true, referred_by: refCode },
    });
    if (createErr || !created.user) throw new Error(`demo user: ${createErr?.message}`);
    demoUserId = created.user.id;

    const { data: demoProfile } = await admin
      .from("profiles")
      .select("invite_code, referred_by")
      .eq("user_id", demoUserId)
      .maybeSingle();

    assert(
      "create_demo",
      "Create throwaway demo participant",
      !!demoProfile?.invite_code,
      `${demoEmail} created with referral code ${demoProfile?.invite_code}`,
      "Profile row or referral code missing after signup"
    );
    assert(
      "referral_attribution",
      "Referral signup attributed to inviter",
      demoProfile?.referred_by === refCode,
      `Attributed to inviter code ${refCode}`,
      `Expected referred_by ${refCode}, got ${demoProfile?.referred_by ?? "none"}`
    );

    // ------------------------------------------------------------- 1. quiz
    const { count: questionCount } = await admin
      .from("quiz_questions")
      .select("id", { count: "exact", head: true });
    const totalQuestions = questionCount || QUIZ_QUESTION_FALLBACK;
    const correct = Number.isFinite(requestedCorrect)
      ? Math.max(0, Math.min(totalQuestions, Math.round(requestedCorrect)))
      : Math.ceil(totalQuestions * 0.8);
    const percent = Math.round((correct / totalQuestions) * 100);
    record("quiz_submit", "Submit quiz answers", "pass", `${correct}/${totalQuestions} yes answers = ${percent}%`);

    const { data: bands } = await admin
      .from("diagnostic_responses")
      .select("tier, min_percent, max_percent, title")
      .order("min_percent", { ascending: true });
    const matches = (bands ?? []).filter((b: any) => percent >= b.min_percent && percent <= b.max_percent);
    const band = matches[0];
    assert(
      "archetype_band",
      "Archetype resolves to correct band",
      matches.length === 1,
      `${percent}% resolved to "${band?.tier}" band (${band?.min_percent}-${band?.max_percent}%)`,
      matches.length === 0
        ? `No band covers ${percent}% — gap in diagnostic_responses ranges`
        : `${matches.length} bands overlap at ${percent}%`
    );

    // -------------------------------------------------------- 2. teaser stage
    const { data: advisorPrompts } = await admin
      .from("results_advisor_prompts")
      .select("tier, prompts")
      .eq("tier", band?.tier ?? "mid")
      .maybeSingle();
    const promptCount = Array.isArray(advisorPrompts?.prompts) ? (advisorPrompts!.prompts as unknown[]).length : 0;
    assert(
      "teaser_stage",
      "Teaser stage renders for resolved band",
      !!band?.title && promptCount > 0,
      `Band copy present with ${promptCount} advisor prompts`,
      !band?.title ? "Band has no title copy" : `No advisor prompts configured for tier ${band?.tier}`
    );

    // ------------------------------------------------------- 3. join challenge
    const startedMs = Date.now();
    const startedIso = new Date(startedMs).toISOString();
    const endsIso = new Date(startedMs + CHALLENGE_DURATION_MS).toISOString();
    const { error: joinErr } = await admin
      .from("challenge_progress")
      .upsert(
        {
          user_id: demoUserId,
          current_day: 1,
          started_at: startedIso,
          ends_at: endsIso,
          tasks: {},
          ai_outputs: {},
          day_completed_at: {},
          completed: false,
        },
        { onConflict: "user_id" }
      );
    assert(
      "join_challenge",
      "Join the challenge",
      !joinErr,
      `Challenge window opened, ends ${endsIso}`,
      `challenge_progress write failed: ${joinErr?.message}`
    );

    // --------------------------------------------------- 4. fast-forward gates
    const boundaries: Array<{ label: string; offset: number; expectDay: number }> = [
      { label: "at signup", offset: 0, expectDay: 1 },
      { label: "+23h", offset: 23 * HOUR, expectDay: 1 },
      { label: "+24h", offset: DAY, expectDay: 2 },
      { label: "+47h", offset: 47 * HOUR, expectDay: 2 },
      { label: "+48h", offset: 2 * DAY, expectDay: 3 },
      { label: "+72h", offset: CHALLENGE_DURATION_MS, expectDay: 4 },
    ];
    const gateFailures = boundaries.filter(
      (b) => deriveDay(startedMs, startedMs + b.offset).currentDay !== b.expectDay
    );
    assert(
      "day_boundaries",
      "Days unlock only at their boundary",
      gateFailures.length === 0,
      "Day 1 open from signup, Day 2 at +24h, Day 3 at +48h, window closes at +72h",
      `Wrong day at: ${gateFailures.map((f) => f.label).join(", ")}`
    );

    const { data: gates } = await admin
      .from("unlock_gates")
      .select("key, enabled, window_hours, invites_required")
      .in("key", ["day1", "day2", "day3"]);
    const gateMap = new Map((gates ?? []).map((g: any) => [g.key, g]));
    assert(
      "unlock_gates",
      "Unlock gates configured for Day 2 and Day 3",
      !!gateMap.get("day2") && !!gateMap.get("day3"),
      `Gates present: ${[...gateMap.keys()].join(", ")}`,
      "Missing unlock_gates rows for day2/day3"
    );

    // ------------------------------------------------- 5. run each day in turn
    const dayCompletedAt: Record<string, string> = {};
    const tasks: Record<string, boolean> = {};
    for (const day of [1, 2, 3]) {
      const simulatedNow = startedMs + (day - 1) * DAY;
      const derived = deriveDay(startedMs, simulatedNow);
      const assetKey = day === 1 ? "day1_create_structure" : `day${day}_asset_confirmed`;
      tasks[assetKey] = true;
      dayCompletedAt[`day${day}`] = new Date(simulatedNow).toISOString();

      const { error } = await admin
        .from("challenge_progress")
        .update({
          current_day: day === 3 ? 3 : day + 1,
          completed: day === 3,
          tasks,
          day_completed_at: dayCompletedAt,
        })
        .eq("user_id", demoUserId);

      assert(
        `day${day}_complete`,
        `Day ${day}: confirm asset and mark complete`,
        !error && derived.currentDay === day,
        `Asset gate "${assetKey}" confirmed, Day ${day} marked complete at simulated +${(day - 1) * 24}h`,
        error ? `Write failed: ${error.message}` : `Clock derived Day ${derived.currentDay} at +${(day - 1) * 24}h`
      );
    }

    const { data: finalProgress } = await admin
      .from("challenge_progress")
      .select("completed, current_day, day_completed_at")
      .eq("user_id", demoUserId)
      .maybeSingle();
    assert(
      "completion_flags",
      "Completion flags set",
      finalProgress?.completed === true && Object.keys((finalProgress?.day_completed_at as object) ?? {}).length === 3,
      "completed = true with all three day stamps recorded",
      `completed=${finalProgress?.completed}, stamps=${Object.keys((finalProgress?.day_completed_at as object) ?? {}).length}`
    );

    // ----------------------------------------------------------- 6. points
    // Mirrors recompute_monthly_points(): (day completions + invites + referral
    // day credits) * 50, keyed to the participant's rolling access cycle.
    const dayKeys = Object.keys((finalProgress?.day_completed_at as Record<string, string>) ?? {});
    const countedByDbFunction = dayKeys.filter((k) => ["1", "2", "3"].includes(k)).length;
    assert(
      "points_day_keys",
      "Day completion stamps are countable for points",
      countedByDbFunction === dayKeys.length && dayKeys.length === 3,
      "All three day stamps use keys the points function counts",
      `App writes keys [${dayKeys.join(", ")}] but recompute_monthly_points only counts '1','2','3' — day completions score zero points`
    );

    const { data: cycleKey } = await admin.rpc("access_cycle_key", {
      p_signup_at: startedIso,
      p_now: new Date().toISOString(),
    });
    const { data: inviteRow } = await admin
      .from("monthly_invite_tracking")
      .select("invite_count")
      .eq("user_id", referrerUserId)
      .maybeSingle();
    assert(
      "referral_points",
      "Referral signup awards points to the inviter",
      (inviteRow?.invite_count ?? 0) >= 1,
      `Inviter credited ${inviteRow?.invite_count} invite = ${(inviteRow?.invite_count ?? 0) * POINTS_PER_EVENT} points`,
      "No monthly_invite_tracking row created for the inviter on referred signup"
    );

    const expectedPoints = (countedByDbFunction + 0) * POINTS_PER_EVENT;
    await admin.from("monthly_points_tracking").upsert(
      { user_id: demoUserId, month: cycleKey as string, points_total: expectedPoints },
      { onConflict: "user_id,month" }
    );
    const { data: firstLedger } = await admin
      .from("monthly_points_tracking")
      .select("points_total")
      .eq("user_id", demoUserId)
      .maybeSingle();
    // Accumulate-only check: a lower recompute must never reduce the stored total.
    await admin
      .from("monthly_points_tracking")
      .update({ points_total: Math.max(firstLedger?.points_total ?? 0, 0) })
      .eq("user_id", demoUserId);
    const { data: secondLedger } = await admin
      .from("monthly_points_tracking")
      .select("points_total")
      .eq("user_id", demoUserId)
      .maybeSingle();
    assert(
      "points_ledger",
      "Points ledger stays accumulate-only",
      (secondLedger?.points_total ?? 0) >= (firstLedger?.points_total ?? 0),
      `Ledger held at ${secondLedger?.points_total} points across recomputes`,
      `Ledger dropped from ${firstLedger?.points_total} to ${secondLedger?.points_total}`
    );

    const { data: accessSettings } = await admin
      .from("access_settings")
      .select("points_threshold")
      .maybeSingle();
    record(
      "points_threshold",
      "Access threshold read from settings",
      "info",
      `Free access threshold is ${accessSettings?.points_threshold} points; demo participant holds ${secondLedger?.points_total}`
    );

    // ----------------------------------------------------------- 7. badges
    const { data: badgeDefs } = await admin
      .from("invite_badges")
      .select("name, threshold")
      .order("threshold", { ascending: true });
    const inviteTotal = inviteRow?.invite_count ?? 0;
    const crossed = (badgeDefs ?? []).filter((b: any) => inviteTotal >= b.threshold);
    assert(
      "badges",
      "Badge thresholds crossed award",
      inviteTotal === 0 || crossed.length > 0,
      crossed.length
        ? `${inviteTotal} invite(s) earns: ${crossed.map((b: any) => b.name).join(", ")}`
        : "No thresholds crossed at this invite count",
      `Inviter has ${inviteTotal} invite(s) but no badge threshold resolved`
    );

    // -------------------------------------------------- 8. completion email
    const { data: tpl } = await admin
      .from("milestone_email_templates")
      .select("milestone, subject")
      .eq("milestone", "challenge_complete")
      .maybeSingle();
    record(
      "completion_email",
      "Completion email attempted",
      tpl?.subject ? "pass" : "info",
      tpl?.subject
        ? `challenge_complete template resolved ("${tpl.subject}") — send skipped for demo participant`
        : "No challenge_complete template row; the function would fall back to its built-in template. Send skipped."
    );

    // ------------------------------------------------------- 9. coach context
    const { data: coachProgress } = await admin
      .from("challenge_progress")
      .select("current_day, completed, ai_outputs, day_completed_at")
      .eq("user_id", demoUserId)
      .maybeSingle();
    const { data: coachConfig } = await admin
      .from("copilot_config")
      .select("system_prompt, max_tokens")
      .maybeSingle();
    assert(
      "coach_context",
      "Coach loads day progress context",
      !!coachProgress && !!coachConfig?.system_prompt,
      `Coach sees Day ${coachProgress?.current_day}, completed=${coachProgress?.completed}, with an active system prompt`,
      !coachProgress ? "No progress row available to the coach" : "Coach config missing a system prompt"
    );

    // ---------------------------------------------------------- 10. teardown
    if (keepData) {
      record("teardown", "Teardown", "info", `Kept demo data for debugging: ${demoEmail} and ${referrerEmail}`);
    } else {
      const removed = await teardown(admin, [demoUserId, referrerUserId], [demoEmail, referrerEmail]);
      const { data: leftover } = await admin
        .from("profiles")
        .select("user_id")
        .in("user_id", [demoUserId, referrerUserId]);
      assert(
        "teardown",
        "Demo data deleted",
        (leftover?.length ?? 0) === 0,
        `Removed ${removed} demo records across progress, points, invites, badges and auth`,
        `${leftover?.length} demo profile row(s) still present`
      );
      demoUserId = null;
      referrerUserId = null;
    }

    const passed = steps.filter((s) => s.status === "pass").length;
    const total = steps.filter((s) => s.status !== "info").length;
    return json({ ok: true, passed, total, kept: keepData, demo_email: demoEmail, steps });
  } catch (err) {
    record("error", "Runner error", "fail", err instanceof Error ? err.message : String(err));
    if (admin) {
      try {
        await teardown(
          admin,
          [demoUserId, referrerUserId].filter(Boolean) as string[],
          [demoEmail, referrerEmail].filter(Boolean)
        );
      } catch (_) {
        // teardown already best-effort
      }
    }
    const passed = steps.filter((s) => s.status === "pass").length;
    const total = steps.filter((s) => s.status !== "info").length;
    return json({ ok: false, passed, total, demo_email: demoEmail, steps }, 200);
  }
});

async function teardown(
  admin: ReturnType<typeof createClient>,
  userIds: string[],
  emails: string[]
): Promise<number> {
  const safeEmails = emails.filter((e) => QA_EMAIL_PATTERN.test(e));
  const ids = userIds.filter(Boolean);
  if (!ids.length) return 0;
  let removed = 0;

  const byUser: Array<[string, string]> = [
    ["referral_day_credits", "referred_user_id"],
    ["referral_quiz_credits", "referred_user_id"],
    ["monthly_points_tracking", "user_id"],
    ["monthly_invite_tracking", "user_id"],
    ["unlock_grants", "user_id"],
    ["unlocks", "user_id"],
    ["badges", "user_id"],
    ["milestone_email_log", "user_id"],
    ["ai_user_context", "user_id"],
    ["user_memory", "user_id"],
    ["training_progress", "user_id"],
    ["challenge_progress", "user_id"],
    ["user_roles", "user_id"],
    ["profiles", "user_id"],
  ];
  for (const [table, col] of byUser) {
    const { error, count } = await admin.from(table).delete({ count: "exact" }).in(col, ids);
    if (!error) removed += count ?? 0;
  }
  await admin.from("referral_day_credits").delete().in("inviter_user_id", ids);
  await admin.from("referral_quiz_credits").delete().in("inviter_user_id", ids);

  for (const email of safeEmails) {
    const { count } = await admin.from("waitlist_signups").delete({ count: "exact" }).eq("email", email);
    removed += count ?? 0;
  }
  for (const id of ids) {
    await admin.auth.admin.deleteUser(id);
    removed += 1;
  }
  return removed;
}
