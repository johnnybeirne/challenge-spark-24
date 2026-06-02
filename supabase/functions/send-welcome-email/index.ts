import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-welcome-secret",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Johnny Beirne <johnny@johnnybeirne.com>";
const DEFAULT_APP_BASE_URL = "https://leadio.johnnybeirne.com";

async function getAppBaseUrl(admin: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data } = await admin.from("newsletter_settings").select("app_base_url").eq("id", 1).maybeSingle();
    const v = (data?.app_base_url ?? "").toString().trim().replace(/\/+$/, "");
    return v || DEFAULT_APP_BASE_URL;
  } catch {
    return DEFAULT_APP_BASE_URL;
  }
}

function genToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

function normalizeBraces(input: string): string {
  let out = (input ?? "")
    .replace(/[｛❴⦃⟮⦗]/g, "{")
    .replace(/[｝❵⦄⟯⦘]/g, "}");
  out = out.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, "{{$1}}");
  return out;
}

function substitute(html: string, vars: Record<string, string>) {
  let out = normalizeBraces(html ?? "");
  for (const [k, v] of Object.entries(vars)) out = out.split(`{{${k}}}`).join(v);
  return out;
}

function autolinkUrlTokens(html: string): string {
  const tokens = ["referral_url", "unsubscribe_url"];
  const input = html ?? "";
  const anchorRe = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  const segments: { text: string; isAnchor: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(input)) !== null) {
    if (m.index > last) segments.push({ text: input.slice(last, m.index), isAnchor: false });
    segments.push({ text: m[0], isAnchor: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) segments.push({ text: input.slice(last), isAnchor: false });

  return segments
    .map((seg) => {
      if (seg.isAnchor) return seg.text;
      return seg.text.replace(/(<[^>]+>)|([^<]+)/g, (_full, tag: string | undefined, text: string | undefined) => {
        if (tag) return tag;
        let t = text ?? "";
        for (const tok of tokens) {
          const token = `{{${tok}}}`;
          if (!t.includes(token)) continue;
          t = t.split(token).join(
            `<a href="${token}" style="color:#4f46e5;text-decoration:underline;" target="_blank" rel="noopener">${token}</a>`,
          );
        }
        return t;
      });
    })
    .join("");
}

function ensureUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  if (html.includes("{{unsubscribe_url}}")) return html;
  if (/href\s*=\s*["'][^"']*\/unsubscribe\?token=/i.test(html)) return html;
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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify shared secret from DB trigger
    const incomingSecret = req.headers.get("x-welcome-secret") ?? "";
    const { data: cfg, error: cfgErr } = await admin
      .schema("internal" as any)
      .from("welcome_hook_config")
      .select("secret")
      .eq("id", 1)
      .maybeSingle();
    if (cfgErr || !cfg?.secret || incomingSecret !== cfg.secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { signupId } = await req.json();
    if (!signupId) throw new Error("signupId required");

    // Load signup
    const { data: signup, error: sErr } = await admin
      .from("waitlist_signups")
      .select("id,email,name,referral_code")
      .eq("id", signupId)
      .maybeSingle();
    if (sErr || !signup) throw new Error("Signup not found");

    // Skip suppressed
    const { data: sup } = await admin
      .from("newsletter_suppressions")
      .select("id")
      .ilike("email", signup.email)
      .maybeSingle();
    if (sup) {
      return new Response(JSON.stringify({ ok: true, skipped: "suppressed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load welcome template
    const { data: tpl } = await admin
      .from("newsletter_templates")
      .select("id,subject,html_body")
      .eq("is_welcome", true)
      .maybeSingle();
    if (!tpl) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_welcome_template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get/create unsubscribe token
    const emailLower = signup.email.toLowerCase();
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
    const referralCode = signup.referral_code ?? "";
    const referralUrl = referralCode ? `${APP_BASE_URL}/waitlist?ref=${referralCode}` : `${APP_BASE_URL}/waitlist`;
    const vars = {
      name: signup.name?.trim() || "there",
      email: signup.email,
      unsubscribe_url: unsubscribeUrl,
      referral_url: referralUrl,
      referral_code: referralCode,
    };

    const html = ensureUnsubscribeFooter(
      substitute(autolinkUrlTokens(normalizeBraces(tpl.html_body ?? "")), vars),
      unsubscribeUrl,
    );
    const subject = substitute(tpl.subject, vars);

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM,
        to: [signup.email],
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    const data = await r.json();

    if (!r.ok) {
      await admin.from("newsletter_sends").insert({
        campaign_id: null, template_id: tpl.id, email: signup.email, name: signup.name,
        status: "failed", error_message: JSON.stringify(data).slice(0, 500),
      });
      throw new Error(`Resend error: ${JSON.stringify(data)}`);
    }

    await admin.from("newsletter_sends").insert({
      campaign_id: null, template_id: tpl.id, email: signup.email, name: signup.name,
      status: "sent", resend_id: data.id, sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email error:", err);
    return new Response(JSON.stringify({ error: String((err as any)?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
