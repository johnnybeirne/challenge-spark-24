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

function genToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

function normalizeBraces(input: string): string {
  // Map common Unicode look-alikes to ASCII { and }
  let out = input
    .replace(/[｛❴⦃⟮⦗]/g, "{")
    .replace(/[｝❵⦄⟯⦘]/g, "}");
  // Collapse spaces inside double braces: {{  name  }} -> {{name}}
  out = out.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, "{{$1}}");
  return out;
}

function substitute(html: string, vars: Record<string, string>) {
  let out = normalizeBraces(html ?? "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function autolinkUrlTokens(html: string): string {
  // Wrap bare {{referral_url}} / {{unsubscribe_url}} (not already in href="..." or inside an <a>) with an <a>.
  const tokens = ["referral_url", "unsubscribe_url"];
  let out = html ?? "";
  for (const t of tokens) {
    const token = `{{${t}}}`;
    // Skip if no occurrence
    if (!out.includes(token)) continue;
    // Replace only occurrences NOT preceded by =" or =' (i.e. not inside an attribute value)
    // and NOT already inside an <a>...</a> wrapping just this token.
    const re = new RegExp(`(^|[^"'=])\\{\\{${t}\\}\\}`, "g");
    out = out.replace(re, (_m, prefix) =>
      `${prefix}<a href="${token}" style="color:#4f46e5;text-decoration:underline;" target="_blank" rel="noopener">${token}</a>`,
    );
  }
  return out;
}

function ensureUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  if (html.includes("{{unsubscribe_url}}") || html.toLowerCase().includes("unsubscribe")) {
    return html;
  }
  const footer = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#94a3b8;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
  </div>`;
  if (html.includes("</body>")) return html.replace("</body>", `${footer}</body>`);
  return html + footer;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { campaignId, mode, testEmail, testName } = body as { campaignId: string; mode?: "test" | "send"; testEmail?: string; testName?: string };

    if (!campaignId) throw new Error("campaignId required");

    const { data: campaign, error: cErr } = await admin
      .from("newsletter_campaigns").select("*").eq("id", campaignId).single();
    if (cErr || !campaign) throw new Error("Campaign not found");

    // ---------- TEST MODE ----------
    if (mode === "test") {
      if (!testEmail || !testEmail.includes("@")) throw new Error("Valid testEmail required");
      const token = genToken();
      const unsubscribeUrl = `${APP_BASE_URL}/unsubscribe?token=${token}`;
      const vars = { name: (testName ?? "").trim() || "there", email: testEmail, unsubscribe_url: unsubscribeUrl, referral_url: `${APP_BASE_URL}/waitlist?ref=PREVIEW123`, referral_code: "PREVIEW123" };
      const html = ensureUnsubscribeFooter(substitute(autolinkUrlTokens(campaign.html_body), vars), unsubscribeUrl);
      const subject = `[TEST] ${substitute(campaign.subject, vars)}`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: FROM, to: [testEmail], subject, html }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify({ ok: true, test: true, id: data.id, renderedSubject: subject }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- BULK SEND ----------
    if (campaign.status === "sending" || campaign.status === "sent") {
      throw new Error(`Campaign already ${campaign.status}`);
    }

    // Build recipient list from audience
    const audience = (campaign.audience ?? {}) as { mode: string; tiers?: string[]; minInvites?: number; ids?: string[] };
    let q = admin.from("waitlist_signups").select("id,email,name,confirmed_invites,current_tier,status,referral_code").eq("status", "active");
    if (audience.mode === "manual" && audience.ids?.length) {
      q = q.in("id", audience.ids);
    } else if (audience.mode === "filter") {
      if (audience.tiers?.length) q = q.in("current_tier", audience.tiers);
      if (audience.minInvites && audience.minInvites > 0) q = q.gte("confirmed_invites", audience.minInvites);
    }
    const { data: signups, error: sErr } = await q;
    if (sErr) throw sErr;

    // Filter suppressions
    const { data: suppressed } = await admin.from("newsletter_suppressions").select("email");
    const suppressedSet = new Set((suppressed ?? []).map((r) => r.email.toLowerCase()));
    const recipients = (signups ?? []).filter((r) => r.email && !suppressedSet.has(r.email.toLowerCase()));

    await admin.from("newsletter_campaigns").update({
      status: "sending",
      recipient_count: recipients.length,
    }).eq("id", campaignId);

    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const emailLower = r.email.toLowerCase();
      // Get or create unsubscribe token
      let token: string;
      const { data: existing } = await admin
        .from("newsletter_unsubscribe_tokens").select("token").eq("email", emailLower).maybeSingle();
      if (existing?.token) {
        token = existing.token;
      } else {
        token = genToken();
        await admin.from("newsletter_unsubscribe_tokens").insert({ token, email: emailLower });
      }
      const unsubscribeUrl = `${APP_BASE_URL}/unsubscribe?token=${token}`;
      const referralCode = (r as any).referral_code ?? "";
      const referralUrl = referralCode ? `${APP_BASE_URL}/waitlist?ref=${referralCode}` : `${APP_BASE_URL}/waitlist`;
      const vars = {
        name: r.name?.trim() || "there",
        email: r.email,
        unsubscribe_url: unsubscribeUrl,
        referral_url: referralUrl,
        referral_code: referralCode,
      };
      const html = ensureUnsubscribeFooter(substitute(campaign.html_body, vars), unsubscribeUrl);
      const subject = substitute(campaign.subject, vars);

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: FROM,
            to: [r.email],
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          failed++;
          await admin.from("newsletter_sends").insert({
            campaign_id: campaignId, email: r.email, name: r.name,
            status: "failed", error_message: JSON.stringify(data).slice(0, 500),
          });
        } else {
          sent++;
          await admin.from("newsletter_sends").insert({
            campaign_id: campaignId, email: r.email, name: r.name,
            status: "sent", resend_id: data.id, sent_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        failed++;
        await admin.from("newsletter_sends").insert({
          campaign_id: campaignId, email: r.email, name: r.name,
          status: "failed", error_message: String(err).slice(0, 500),
        });
      }
      // tiny delay to stay under rate limit
      await new Promise((res) => setTimeout(res, 120));
    }

    await admin.from("newsletter_campaigns").update({
      status: "sent",
      sent_count: sent,
      failed_count: failed,
      sent_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return new Response(JSON.stringify({ ok: true, sent, failed, recipients: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-newsletter error:", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
