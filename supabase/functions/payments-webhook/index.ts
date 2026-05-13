import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

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

/**
 * Compute commission amount in cents.
 * - percent: purchaseAmountCents * value / 100
 * - flat:    value (in major currency units) * 100
 */
function computeCommissionCents(
  type: string,
  value: number,
  purchaseAmountCents: number,
): number {
  if (!value || value <= 0) return 0;
  if (type === "percent") {
    return Math.max(0, Math.round((purchaseAmountCents * value) / 100));
  }
  if (type === "flat") {
    return Math.max(0, Math.round(value * 100));
  }
  return 0;
}

/**
 * Create commissions for a paid purchase.
 * - L1: from referral_attributions.partner_id (or coupon.partner_id override)
 * - L2: from referral_attributions.parent_partner_id, using parent's defaults
 * Idempotent: skips if a commission already exists for (purchase_id, partner_id, level).
 */
async function createCommissionsForPurchase(opts: {
  purchaseId: string;
  userId: string;
  amountCents: number;
  couponCode: string | null;
}) {
  const sb = getSupabase();
  const { purchaseId, userId, amountCents, couponCode } = opts;
  if (!purchaseId || !userId || amountCents <= 0) return;

  // 1. Resolve attribution
  const { data: attribution } = await sb
    .from("referral_attributions")
    .select("partner_id, parent_partner_id")
    .eq("user_id", userId)
    .maybeSingle();

  // 2. Optional coupon override (partner-tied coupon)
  let couponPartnerId: string | null = null;
  let couponType: string | null = null;
  let couponValue: number | null = null;
  if (couponCode) {
    const { data: coupon } = await sb
      .from("coupons")
      .select("partner_id, commission_type, commission_value")
      .ilike("code", couponCode)
      .maybeSingle();
    if (coupon?.partner_id) {
      couponPartnerId = coupon.partner_id as string;
      couponType = (coupon.commission_type as string) || null;
      couponValue = (coupon.commission_value as number) || null;
    }
  }

  // Effective L1 partner: coupon override wins over attribution
  const l1PartnerId = couponPartnerId || attribution?.partner_id || null;
  if (!l1PartnerId) return;

  // 3. Load L1 partner defaults (used when coupon doesn't override)
  const { data: l1Partner } = await sb
    .from("partners")
    .select("id, default_commission_type, default_commission_value, parent_partner_id")
    .eq("id", l1PartnerId)
    .maybeSingle();
  if (!l1Partner) return;

  const l1Type = couponType || (l1Partner.default_commission_type as string);
  const l1Value = couponValue ?? (l1Partner.default_commission_value as number);
  const l1Amount = computeCommissionCents(l1Type, l1Value, amountCents);

  if (l1Amount > 0) {
    const { data: existing } = await sb
      .from("commissions")
      .select("id")
      .eq("purchase_id", purchaseId)
      .eq("partner_id", l1PartnerId)
      .eq("level", 1)
      .maybeSingle();
    if (!existing) {
      await sb.from("commissions").insert({
        purchase_id: purchaseId,
        partner_id: l1PartnerId,
        user_id: userId,
        amount_cents: l1Amount,
        commission_type: l1Type,
        commission_value_snapshot: l1Value,
        level: 1,
        status: "pending",
      });
    }
  }

  // 4. Level-2 from attribution's parent (only when attribution drove L1, not coupon override)
  const l2PartnerId = !couponPartnerId ? attribution?.parent_partner_id : null;
  if (l2PartnerId) {
    const { data: l2Partner } = await sb
      .from("partners")
      .select("id, default_l2_commission_type, default_l2_commission_value")
      .eq("id", l2PartnerId)
      .maybeSingle();
    if (l2Partner) {
      const l2Type = l2Partner.default_l2_commission_type as string;
      const l2Value = l2Partner.default_l2_commission_value as number;
      const l2Amount = computeCommissionCents(l2Type, l2Value, amountCents);
      if (l2Amount > 0) {
        const { data: existing } = await sb
          .from("commissions")
          .select("id")
          .eq("purchase_id", purchaseId)
          .eq("partner_id", l2PartnerId)
          .eq("level", 2)
          .maybeSingle();
        if (!existing) {
          await sb.from("commissions").insert({
            purchase_id: purchaseId,
            partner_id: l2PartnerId,
            user_id: userId,
            amount_cents: l2Amount,
            commission_type: l2Type,
            commission_value_snapshot: l2Value,
            level: 2,
            status: "pending",
          });
        }
      }
    }
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
  const couponCode = (session.metadata?.coupon_code as string | undefined) ?? null;
  const customerId = session.customer as string | undefined;
  const sessionId = session.id;
  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const customerEmail =
    session.customer_details?.email || session.customer_email || undefined;

  const sb = getSupabase();

  // 1. Insert purchase record (idempotent on stripe_session_id)
  if (userId) {
    const { data: purchaseRow } = await sb.from("purchases").upsert(
      {
        user_id: userId,
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent ?? null,
        stripe_customer_id: customerId ?? null,
        amount_cents: amount,
        currency,
        price_id: "leadio_premium_lifetime_usd",
        partner_code: partnerCode ?? null,
        coupon_code: couponCode,
        status: "paid",
        environment: env,
      },
      { onConflict: "stripe_session_id" },
    ).select("id").maybeSingle();

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

    // 4. Create commissions (L1 + L2) — idempotent
    if (purchaseRow?.id) {
      try {
        await createCommissionsForPurchase({
          purchaseId: purchaseRow.id as string,
          userId,
          amountCents: amount,
          couponCode,
        });
      } catch (e) {
        console.error("Commission creation failed:", e);
      }
    }
  }

  // 5. Legacy promoter conversion counter (Phase 7 will retire this)
  if (partnerCode) {
    await sb.rpc("process_partner_referral", { p_partner_code: partnerCode });
  }

  // 6. Send confirmation email
  if (customerEmail) await sendConfirmationEmail(customerEmail);
}

async function handleRefund(charge: any, env: StripeEnv) {
  const sb = getSupabase();
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const { data: purchase } = await sb
    .from("purchases")
    .select("id, user_id")
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

  // Revoke any pending/approved commissions for this purchase (leave already-paid alone)
  await sb
    .from("commissions")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("purchase_id", purchase.id)
    .in("status", ["pending", "approved"]);
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
