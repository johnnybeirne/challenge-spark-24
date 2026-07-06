import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Johnny Beirne <johnny@johnnybeirne.com>";
const DEFAULT_APP_BASE_URL = "https://leadio.johnnybeirne.com";

type Milestone = "day1_complete" | "quiz_assets_ready" | "challenge_complete";
const VALID: Milestone[] = ["day1_complete", "quiz_assets_ready", "challenge_complete"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Mirrors send-newsletter: unicode brace look-alikes -> ASCII, collapse spaces in {{ name }}.
function normalizeBraces(input: string): string {
  let out = (input ?? "")
    .replace(/[｛❴⦃⟮⦗]/g, "{")
    .replace(/[｝❵⦄⟯⦘]/g, "}");
  out = out.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, "{{$1}}");
  return out;
}

function substitute(html: string, vars: Record<string, string>): string {
  let out = normalizeBraces(html ?? "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

async function getAppBaseUrl(admin: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data } = await admin
      .from("newsletter_settings")
      .select("app_base_url")
      .eq("id", 1)
      .maybeSingle();
    const v = (data?.app_base_url ?? "").toString().trim().replace(/\/+$/, "");
    return v || DEFAULT_APP_BASE_URL;
  } catch {
    return DEFAULT_APP_BASE_URL;
  }
}

// Fallback hardcoded templates (with tokens) if no row exists for a milestone.
function fallbackTemplate(milestone: Milestone): { subject: string; html_body: string } {
  if (milestone === "day1_complete") {
    return {
      subject: "Day 1 is done. Your challenge has a promise now.",
      html_body: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Nice work, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Day 1 is complete, and your challenge now has a clear promise behind it.</p>
    <blockquote style="margin:20px 0;padding:16px 20px;border-left:4px solid #4f46e5;background:#f5f3ff;border-radius:6px;font-size:16px;line-height:1.6;color:#1e1b4b;font-style:italic;">{{promise}}</blockquote>
    <p style="font-size:15px;line-height:1.7;margin:16px 0 0;color:#334155;">In Day 2, we build the asset that turns curious visitors into leads: your quiz. It is where your promise starts doing real work for you.</p>
    <p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{day2_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Continue to Day 2</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>`,
    };
  }
  if (milestone === "quiz_assets_ready") {
    return {
      subject: "Your quiz is ready. Your downloads are waiting.",
      html_body: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Your quiz is built, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Your lead generation quiz has been generated, and both the Word doc and Google Doc versions are ready to grab in Your Assets on your dashboard.</p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Open it up, take a look, and download the versions you want to keep.</p>
    <p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{dashboard_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Open Your Assets</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>`,
    };
  }
  return {
    subject: "You built it. Here is everything you created.",
    html_body: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You finished the challenge, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">That is a serious piece of work. Here is what you now have to show for it:</p>
    <ul style="font-size:15px;line-height:1.8;margin:0 0 16px 20px;padding:0;color:#334155;">
      <li>A clear challenge promise</li>
      <li>A lead generation quiz built around that promise</li>
      <li>Downloadable Word and Google Doc versions of your assets</li>
    </ul>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Everything stays available in your dashboard, ready whenever you want to use it, refine it, or share it.</p>
    <p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{dashboard_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Open your dashboard</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>`,
  };
}

// For the day1_complete template, if there is no promise, strip the promise
// blockquote entirely so we do not render an empty highlighted box.
function stripEmptyPromiseBlock(html: string): string {
  return html.replace(
    /<blockquote\b[^>]*>\s*\{\{promise\}\}\s*<\/blockquote>/gi,
    "",
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const { user_id, milestone, test, testEmail } = body ?? {};
    if (!milestone || !VALID.includes(milestone)) throw new Error("invalid milestone");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // -----------------------------------------------------------------
    // TEST MODE: render with sample values, send to testEmail, skip log.
    // Restricted to admins via has_role check on caller's JWT.
    // -----------------------------------------------------------------
    if (test === true) {
      if (!testEmail || typeof testEmail !== "string" || !testEmail.includes("@")) {
        throw new Error("testEmail required");
      }

      // Verify caller is an admin using their JWT.
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!token) throw new Error("unauthorized");
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: uErr } = await userClient.auth.getUser();
      if (uErr || !userData?.user) throw new Error("unauthorized");
      const { data: isAdmin, error: rErr } = await admin.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (rErr || !isAdmin) throw new Error("admin_required");

      const { data: tplRow } = await admin
        .from("milestone_email_templates")
        .select("subject,html_body")
        .eq("milestone", milestone)
        .maybeSingle();
      const tpl = tplRow ?? fallbackTemplate(milestone as Milestone);

      const appBaseUrl = await getAppBaseUrl(admin);
      const samplePromise =
        "I help new coaches turn their expertise into their first paying clients within 30 days.";
      const vars: Record<string, string> = {
        name: esc("Sophie"),
        promise: esc(samplePromise),
        app_url: appBaseUrl,
        day2_url: `${appBaseUrl}/challenge/day/2`,
        dashboard_url: `${appBaseUrl}/challenger-dashboard`,
      };

      const wrap = (body: string) => `<div style="font-size:14pt;line-height:1.6;">${body}</div>`;
      const subject = `[TEST] ${substitute(tpl.subject, vars)}`;
      const html = wrap(substitute(tpl.html_body, vars));

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: FROM, to: [testEmail], subject, html }),
      });

      const data = await r.json();
      if (!r.ok) {
        return new Response(
          JSON.stringify({ ok: false, error: "resend_failed", details: data }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ ok: true, test: true, id: data.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---------- Normal send ----------
    if (!user_id || typeof user_id !== "string") throw new Error("user_id required");

    // 1. Dedupe
    const { data: existing } = await admin
      .from("milestone_email_log")
      .select("id,status,resend_id")
      .eq("user_id", user_id)
      .eq("milestone", milestone)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "already_sent", existing }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    // 2. Profile
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("email,name")
      .eq("user_id", user_id)
      .maybeSingle();
    if (pErr || !profile?.email) throw new Error("profile_not_found");

    const firstName = ((profile.name ?? "").trim().split(/\s+/)[0] ?? "") || "there";

    // 3. Promise (day1_complete only)
    let promise = "";
    if (milestone === "day1_complete") {
      const { data: prog } = await admin
        .from("challenge_progress")
        .select("ai_outputs")
        .eq("user_id", user_id)
        .maybeSingle();
      const ai = (prog?.ai_outputs ?? {}) as Record<string, unknown>;
      const pick = (k: string) => {
        const v = ai[k];
        return typeof v === "string" && v.trim() ? v.trim() : null;
      };
      promise =
        pick("day1_promise_user_edit") ??
        pick("day1_promise_polished") ??
        pick("day1_promise") ??
        "";
    }

    // 4. Load template (fall back to hardcoded if missing)
    const { data: tplRow } = await admin
      .from("milestone_email_templates")
      .select("subject,html_body")
      .eq("milestone", milestone)
      .maybeSingle();
    const tpl = tplRow ?? fallbackTemplate(milestone as Milestone);

    // 5. Render
    const appBaseUrl = await getAppBaseUrl(admin);
    const vars: Record<string, string> = {
      name: esc(firstName),
      promise: promise ? esc(promise) : "",
      app_url: appBaseUrl,
      day2_url: `${appBaseUrl}/challenge/day/2`,
      dashboard_url: `${appBaseUrl}/challenger-dashboard`,
    };

    let htmlBody = tpl.html_body;
    if (!promise) htmlBody = stripEmptyPromiseBlock(htmlBody);

    const subject = substitute(tpl.subject, vars);
    const html = substitute(htmlBody, vars);

    // 6. Send
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: [profile.email], subject, html }),
    });
    const data = await r.json();

    if (!r.ok) {
      await admin.from("milestone_email_log").insert({
        user_id,
        milestone,
        status: "failed",
        error_message: JSON.stringify(data).slice(0, 500),
      });
      return new Response(
        JSON.stringify({ ok: false, error: "resend_failed", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin.from("milestone_email_log").insert({
      user_id,
      milestone,
      status: "sent",
      resend_id: data.id,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ ok: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("milestone-emails error:", err);
    return new Response(
      JSON.stringify({ error: String((err as any)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
