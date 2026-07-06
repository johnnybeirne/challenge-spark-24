import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Johnny Beirne <johnny@johnnybeirne.com>";
const APP_BASE_URL = "https://leadio.johnnybeirne.com";

type Milestone = "day1_complete" | "quiz_assets_ready" | "challenge_complete";
const VALID: Milestone[] = ["day1_complete", "quiz_assets_ready", "challenge_complete"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(inner: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    ${inner}
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>`;
}

function button(label: string, href: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:15px;">${esc(label)}</a></p>`;
}

function buildEmail(milestone: Milestone, firstName: string, promise: string | null): { subject: string; html: string } {
  const name = firstName || "there";

  if (milestone === "day1_complete") {
    const subject = "Day 1 is done. Your challenge has a promise now.";
    const promiseBlock = promise
      ? `<blockquote style="margin:20px 0;padding:16px 20px;border-left:4px solid #4f46e5;background:#f5f3ff;border-radius:6px;font-size:16px;line-height:1.6;color:#1e1b4b;font-style:italic;">${esc(promise)}</blockquote>`
      : "";
    const inner = `
      <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Nice work, ${esc(name)}.</h1>
      <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Day 1 is complete, and your challenge now has a clear promise behind it.</p>
      ${promiseBlock}
      <p style="font-size:15px;line-height:1.7;margin:16px 0 0;color:#334155;">In Day 2, we build the asset that turns curious visitors into leads: your quiz. It is where your promise starts doing real work for you.</p>
      ${button("Continue to Day 2", `${APP_BASE_URL}/challenge/day/2`)}
    `;
    return { subject, html: shell(inner) };
  }

  if (milestone === "quiz_assets_ready") {
    const subject = "Your quiz is ready. Your downloads are waiting.";
    const inner = `
      <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Your quiz is built, ${esc(name)}.</h1>
      <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Your lead generation quiz has been generated, and both the Word doc and Google Doc versions are ready to grab in Your Assets on your dashboard.</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Open it up, take a look, and download the versions you want to keep.</p>
      ${button("Open Your Assets", `${APP_BASE_URL}/challenger-dashboard`)}
    `;
    return { subject, html: shell(inner) };
  }

  // challenge_complete
  const subject = "You built it. Here is everything you created.";
  const inner = `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You finished the challenge, ${esc(name)}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">That is a serious piece of work. Here is what you now have to show for it:</p>
    <ul style="font-size:15px;line-height:1.8;margin:0 0 16px 20px;padding:0;color:#334155;">
      <li>A clear challenge promise</li>
      <li>A lead generation quiz built around that promise</li>
      <li>Downloadable Word and Google Doc versions of your assets</li>
    </ul>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Everything stays available in your dashboard, ready whenever you want to use it, refine it, or share it.</p>
    ${button("Open your dashboard", `${APP_BASE_URL}/challenger-dashboard`)}
  `;
  return { subject, html: shell(inner) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { user_id, milestone } = await req.json();
    if (!user_id || typeof user_id !== "string") throw new Error("user_id required");
    if (!milestone || !VALID.includes(milestone)) throw new Error("invalid milestone");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

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

    const firstName = (profile.name ?? "").trim().split(/\s+/)[0] ?? "";

    // 3. Promise for day1_complete
    let promise: string | null = null;
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
      promise = pick("day1_promise_user_edit") ?? pick("day1_promise_polished") ?? pick("day1_promise");
    }

    const { subject, html } = buildEmail(milestone as Milestone, firstName, promise);

    // 4. Send
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
