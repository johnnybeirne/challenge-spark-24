import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function sendConfirmationEmail(toEmail: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("Resend not configured — skipping confirmation email");
    return;
  }
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Leadio <onboarding@resend.dev>",
        to: [toEmail],
        subject: "Welcome to Leadio Premium 🎉",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
            <h1 style="font-size:24px;margin:0 0 12px">Welcome to Leadio Premium</h1>
            <p>Your payment is confirmed and lifetime access is active.</p>
            <p>You can now access the full Premium course, advanced systems, and Builder Circle.</p>
            <p style="margin-top:24px">
              <a href="https://leadio.johnnybeirne.com/blueprint/dashboard"
                 style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">
                Open Premium Course
              </a>
            </p>
            <p style="font-size:12px;color:#64748b;margin-top:32px">If you have any issues, just reply to this email.</p>
          </div>`,
      }),
    });
    if (!res.ok) console.error("Resend error", res.status, await res.text());
  } catch (e) {
    console.error("Confirmation email failed:", e);
  }
}

async function unlockAllForUser(userId: string) {
  const sb = getSupabase();
  const unlocks = [
    { unlock_id: "premium_course", name: "Premium Course", value: 497, reason: "stripe_purchase" },
    { unlock_id: "builder_circle", name: "Builder Circle", value: 0, reason: "stripe_purchase" },
    { unlock_id: "advanced_prompts", name: "Advanced AI Prompts", value: 0, reason: "stripe_purchase" },
    { unlock_id: "scaling_systems", name: "Scaling Systems", value: 0, reason: "stripe_purchase" },
  ];
  for (const u of unlocks) {
    await sb.from("unlocks").insert({ user_id: userId, ...u });
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const partnerCode = session.metadata?.partner_code as string | undefined;
  const customerId = session.customer as string | undefined;
  const sessionId = session.id;
  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "eur";
  const customerEmail =
    session.customer_details?.email || session.customer_email || undefined;

  const sb = getSupabase();

  // 1. Insert purchase record (idempotent on stripe_session_id)
  if (userId) {
    await sb.from("purchases").upsert(
      {
        user_id: userId,
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent ?? null,
        stripe_customer_id: customerId ?? null,
        amount_cents: amount,
        currency,
        price_id: "leadio_premium_lifetime",
        partner_code: partnerCode ?? null,
        status: "paid",
        environment: env,
      },
      { onConflict: "stripe_session_id" },
    );

    // 2. Mark user premium
    await sb
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        stripe_customer_id: customerId ?? null,
        partner_code_used: partnerCode ?? null,
      })
      .eq("user_id", userId);

    // 3. Unlock all premium content
    await unlockAllForUser(userId);
  }

  // 4. Credit partner
  if (partnerCode) {
    await sb.rpc("process_partner_referral", { p_partner_code: partnerCode });
  }

  // 5. Send confirmation email
  if (customerEmail) await sendConfirmationEmail(customerEmail);
}

async function handleRefund(charge: any, env: StripeEnv) {
  const sb = getSupabase();
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const { data: purchase } = await sb
    .from("purchases")
    .select("user_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("environment", env)
    .maybeSingle();

  if (!purchase) return;

  await sb
    .from("purchases")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("environment", env);

  await sb
    .from("profiles")
    .update({ is_premium: false })
    .eq("user_id", purchase.user_id);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "charge.refunded":
      case "charge.dispute.closed":
        await handleRefund(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
