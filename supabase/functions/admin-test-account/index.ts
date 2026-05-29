// Admin-only edge function for creating, listing, and deleting backdated test accounts.
// Verifies the caller is an admin (has_role 'admin') via JWT, then uses the service role
// to seed auth.users + profiles + waitlist_signups + challenge_progress with custom timestamps.
//
// Safety: all writes/deletes are gated to emails matching `test+%@leadio.test`.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TEST_EMAIL_PATTERN = /^test\+[a-z0-9.\-_]+@leadio\.test$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const generateInviteCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const randomPassword = () => {
  // 24 random hex chars — meets typical password policies, never used by humans.
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "list") {
      const { data, error } = await admin
        .from("waitlist_signups")
        .select("id, email, first_name, surname, name, referral_code, created_at, confirmed_invites")
        .like("email", "test+%@leadio.test")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return json({ error: error.message }, 500);

      // Pair with challenge_progress.started_at to compute current day.
      const emails = (data ?? []).map((r) => r.email);
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const userByEmail = new Map(
        (users?.users ?? [])
          .filter((u) => u.email && TEST_EMAIL_PATTERN.test(u.email))
          .map((u) => [u.email!.toLowerCase(), u])
      );
      const userIds = emails.map((e) => userByEmail.get(e.toLowerCase())?.id).filter(Boolean) as string[];
      const { data: progress } = userIds.length
        ? await admin.from("challenge_progress").select("user_id, started_at, current_day").in("user_id", userIds)
        : { data: [] as any[] };
      const progByUser = new Map((progress ?? []).map((p: any) => [p.user_id, p]));

      const accounts = (data ?? []).map((row) => {
        const u = userByEmail.get(row.email.toLowerCase());
        const p = u ? progByUser.get(u.id) : null;
        return {
          id: row.id,
          user_id: u?.id ?? null,
          email: row.email,
          first_name: row.first_name,
          surname: row.surname,
          name: row.name,
          referral_code: row.referral_code,
          signup_at: row.created_at,
          challenge_started_at: p?.started_at ?? null,
          current_day: p?.current_day ?? null,
        };
      });
      return json({ accounts });
    }

    if (action === "create") {
      const firstName = String(body?.first_name ?? "").trim() || "Test";
      const surname = String(body?.surname ?? "").trim() || "Account";
      const requestedEmail = String(body?.email ?? "").trim().toLowerCase();
      const signupIso = String(body?.signup_at ?? new Date().toISOString());
      const signupDate = new Date(signupIso);
      if (isNaN(signupDate.getTime())) return json({ error: "Invalid signup_at" }, 400);
      if (signupDate.getTime() > Date.now() + 60_000) return json({ error: "signup_at cannot be in the future" }, 400);

      const email = requestedEmail || `test+${Date.now().toString(36)}@leadio.test`;
      if (!TEST_EMAIL_PATTERN.test(email)) {
        return json({ error: "Email must match test+<label>@leadio.test" }, 400);
      }

      // Create auth user, email auto-confirmed so they can sign in immediately.
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { name: `${firstName} ${surname}`.trim(), is_test_account: true },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "createUser failed" }, 500);
      const userId = created.user.id;

      const inviteCode = generateInviteCode();
      const signupAtIso = signupDate.toISOString();
      const endsAtIso = new Date(signupDate.getTime() + 72 * 60 * 60 * 1000).toISOString();

      // Compute which day the user should be on based on elapsed time.
      const elapsedMs = Math.max(0, Date.now() - signupDate.getTime());
      const computedDay = elapsedMs >= 48 * 3600_000 ? 3 : elapsedMs >= 24 * 3600_000 ? 2 : 1;

      // Realistic Day 1 answers using the actual keys Day1Setup writes so the
      // profile + identity feel populated when previewing the experience.
      // day1_foundation + day1_assessment are JSON-stringified blobs (see
      // src/components/Day1Setup.tsx lines 440 + 531).
      const seededFoundation = {
        problem: "Their growth depends on constant outreach or content — there is no system pulling leads in for them.",
        audience: "Coaches, consultants, and experts who want more qualified leads without grinding on content.",
        how: "A simple, repeatable system that generates qualified leads on autopilot.",
      };
      const seededAssessment = {
        ...seededFoundation,
        audienceType: "b2b",
        challengeType: "growth",
        transformation: "qualified lead generation",
      };
      const seededDay1 = {
        day1_foundation: JSON.stringify(seededFoundation),
        day1_assessment: JSON.stringify(seededAssessment),
        day1_promise: "Help coaches and consultants build a qualified lead engine in 3 days.",
        day1_transformation: "From manual outreach to a system that pulls qualified leads in on autopilot.",
        day1_quick_win: "Map your current lead flow in 10 minutes and spot the one bottleneck killing conversion.",
        day1_outcome: "A repeatable lead engine producing qualified conversations every week.",
        day1_title: `${firstName}'s Lead Engine Challenge`,
        day1_structure: "Day 1: Foundation. Day 2: Engine build. Day 3: Launch + first leads.",
      };

      const seededMemory = {
        name: firstName,
        challenge_name: `${firstName}'s Lead Engine Challenge`,
        audience_type: "b2b",
        challenge_type: "growth",
        topic: "qualified lead generation",
        desired_outcome: "A simple, repeatable system that generates qualified leads on autopilot",
      };

      // Update profile (handle_new_user trigger may have inserted one)
      const { error: profileErr } = await admin
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            email,
            name: `${firstName} ${surname}`.trim(),
            first_name: firstName,
            surname,
            invite_code: inviteCode,
            bio: `Building ${seededMemory.challenge_name} — ${seededMemory.desired_outcome}.`,
            created_at: signupAtIso,
            updated_at: signupAtIso,
          },
          { onConflict: "user_id" }
        );
      if (profileErr) return json({ error: `profile: ${profileErr.message}` }, 500);

      // Insert waitlist row with backdated created_at
      const { error: waitlistErr } = await admin.from("waitlist_signups").insert({
        email,
        first_name: firstName,
        surname,
        name: `${firstName} ${surname}`.trim(),
        referral_code: inviteCode,
        created_at: signupAtIso,
        updated_at: signupAtIso,
      });
      if (waitlistErr) {
        // not fatal but report
        console.error("waitlist insert failed", waitlistErr.message);
      }

      // Seed user_memory with the same answers so identity ("Your X Challenge")
      // and copilot context are populated immediately.
      const { error: memErr } = await admin
        .from("user_memory")
        .upsert({ user_id: userId, ...seededMemory, updated_at: signupAtIso }, { onConflict: "user_id" });
      if (memErr) console.error("user_memory upsert failed", memErr.message);

      // Day 1 is always seeded as complete (so the profile renders with answers).
      // current_day reflects elapsed time since the backdated signup.
      const seededTasks: Record<string, boolean> = {
        day1_create_structure: true,
      };

      const progressPayload = {
        user_id: userId,
        current_day: computedDay,
        started_at: signupAtIso,
        ends_at: endsAtIso,
        tasks: seededTasks,
        ai_outputs: seededDay1,
        launch_url: "",
        completed: false,
        created_at: signupAtIso,
        updated_at: signupAtIso,
      };
      const { data: updatedProgress, error: updateProgErr } = await admin
        .from("challenge_progress")
        .update(progressPayload)
        .eq("user_id", userId)
        .select("user_id");
      if (updateProgErr) return json({ error: `challenge_progress: ${updateProgErr.message}` }, 500);
      if (!updatedProgress?.length) {
        const { error: insertProgErr } = await admin.from("challenge_progress").insert(progressPayload);
        if (insertProgErr) return json({ error: `challenge_progress: ${insertProgErr.message}` }, 500);
      }

      // Magic-link for fast sign-in (admin can copy/paste into incognito).
      const redirectTo = String(body?.redirect_to ?? "") || undefined;
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      return json({
        ok: true,
        user_id: userId,
        email,
        invite_code: inviteCode,
        signup_at: signupAtIso,
        magic_link: linkData?.properties?.action_link ?? null,
      });
    }
    if (action === "magic_link") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!TEST_EMAIL_PATTERN.test(email)) return json({ error: "Only test+*@leadio.test allowed" }, 400);
      const redirectTo = String(body?.redirect_to ?? "") || undefined;
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ magic_link: data?.properties?.action_link ?? null });
    }

    if (action === "backfill") {
      // Re-seed Day 1 answers + user_memory for an existing test account so
      // older accounts created before the seeding logic also show realistic data.
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!TEST_EMAIL_PATTERN.test(email)) return json({ error: "Only test+*@leadio.test allowed" }, 400);

      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const target = list?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!target) return json({ error: "User not found" }, 404);
      const userId = target.id;

      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, surname")
        .eq("user_id", userId)
        .maybeSingle();
      const firstName = profile?.first_name?.trim() || "Test";

      const seededFoundation = {
        problem: "Their growth depends on constant outreach or content — there is no system pulling leads in for them.",
        audience: "Coaches, consultants, and experts who want more qualified leads without grinding on content.",
        how: "A simple, repeatable system that generates qualified leads on autopilot.",
      };
      const seededAssessment = {
        ...seededFoundation,
        audienceType: "b2b",
        challengeType: "growth",
        transformation: "qualified lead generation",
      };
      const seededDay1 = {
        day1_foundation: JSON.stringify(seededFoundation),
        day1_assessment: JSON.stringify(seededAssessment),
        day1_promise: "Help coaches and consultants build a qualified lead engine in 3 days.",
        day1_transformation: "From manual outreach to a system that pulls qualified leads in on autopilot.",
        day1_quick_win: "Map your current lead flow in 10 minutes and spot the one bottleneck killing conversion.",
        day1_outcome: "A repeatable lead engine producing qualified conversations every week.",
        day1_title: `${firstName}'s Lead Engine Challenge`,
        day1_structure: "Day 1: Foundation. Day 2: Engine build. Day 3: Launch + first leads.",
      };
      const seededMemory = {
        name: firstName,
        challenge_name: `${firstName}'s Lead Engine Challenge`,
        audience_type: "b2b",
        challenge_type: "growth",
        topic: "qualified lead generation",
        desired_outcome: "A simple, repeatable system that generates qualified leads on autopilot",
      };
      const seededTasks: Record<string, boolean> = {
        day1_create_structure: true,
      };

      const nowIso = new Date().toISOString();

      const { error: memErr } = await admin
        .from("user_memory")
        .upsert({ user_id: userId, ...seededMemory, updated_at: nowIso }, { onConflict: "user_id" });
      if (memErr) return json({ error: `user_memory: ${memErr.message}` }, 500);

      const { data: existing } = await admin
        .from("challenge_progress")
        .select("tasks, ai_outputs, started_at, current_day, ends_at")
        .eq("user_id", userId)
        .maybeSingle();

      const mergedTasks = { ...((existing?.tasks as Record<string, boolean>) ?? {}), ...seededTasks };
      const mergedAi = { ...((existing?.ai_outputs as Record<string, string>) ?? {}), ...seededDay1 };

      const { error: progErr } = await admin
        .from("challenge_progress")
        .upsert(
          {
            user_id: userId,
            current_day: existing?.current_day ?? 1,
            started_at: existing?.started_at ?? nowIso,
            ends_at: existing?.ends_at ?? new Date(Date.now() + 72 * 3600_000).toISOString(),
            tasks: mergedTasks,
            ai_outputs: mergedAi,
            updated_at: nowIso,
          },
          { onConflict: "user_id" }
        );
      if (progErr) return json({ error: `challenge_progress: ${progErr.message}` }, 500);

      return json({ ok: true });
    }

    if (action === "delete") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!TEST_EMAIL_PATTERN.test(email)) return json({ error: "Only test+*@leadio.test allowed" }, 400);

      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const target = list?.users?.find((u) => u.email?.toLowerCase() === email);
      if (target) {
        await admin.from("challenge_progress").delete().eq("user_id", target.id);
        await admin.from("profiles").delete().eq("user_id", target.id);
        await admin.auth.admin.deleteUser(target.id);
      }
      await admin.from("waitlist_signups").delete().eq("email", email);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e: any) {
    console.error("admin-test-account error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
