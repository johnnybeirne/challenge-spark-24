import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutBody {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
  promotionCode?: string; // partner code — looked up silently
  gateKey?: string; // unlock gate this purchase unlocks (optional)
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as CheckoutBody;
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, promotionCode, gateKey } = body;

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) throw new Error("Invalid priceId");
    if (!returnUrl) throw new Error("Missing returnUrl");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    // Use the verified auth identity when available. The app-state user can lag
    // behind the authenticated session, which previously produced rung sessions
    // without a userId and made server-side fulfilment impossible.
    const authHeader = req.headers.get("Authorization") ?? "";
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: authData } = token
      ? await authClient.auth.getUser(token)
      : { data: { user: null } };
    const resolvedUserId = authData.user?.id ?? userId;

    // Diagnostic: shows exactly what the client sent for every session, so a
    // lost gate key can be traced to the button rather than guessed at.
    console.log("[create-checkout] request:", JSON.stringify({
      priceId,
      gateKey: gateKey ?? null,
      bodyUserId: userId ?? null,
      resolvedUserId: resolvedUserId ?? null,
      environment,
    }));

    if (gateKey && /^reward_gate_/.test(gateKey) && !resolvedUserId) {
      throw new Error("Sign in before purchasing a reward");
    }


    const stripe = createStripeClient(environment);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];

    // Silently look up partner promotion code (if any). Never tell the
    // client whether it was found — UX is identical either way.
    let discountId: string | undefined;
    if (promotionCode && /^[a-zA-Z0-9_-]{2,40}$/.test(promotionCode)) {
      const promos = await stripe.promotionCodes.list({
        code: promotionCode,
        active: true,
        limit: 1,
      });
      if (promos.data.length) discountId = promos.data[0].id;
    }

    const customerId = (customerEmail || resolvedUserId)
      ? await resolveOrCreateCustomer(stripe, { email: customerEmail, userId: resolvedUserId })
      : undefined;

    // Recurring prices must open a subscription session; one-time prices stay
    // on the existing payment flow.
    const isRecurring = !!stripePrice.recurring;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      ...(resolvedUserId && { client_reference_id: resolvedUserId }),
      ...(discountId && { discounts: [{ promotion_code: discountId }] }),
      metadata: {
        ...(resolvedUserId && { userId: resolvedUserId }),
        ...(promotionCode && { partner_code: promotionCode }),
        ...(gateKey && /^[a-zA-Z0-9_-]{1,60}$/.test(gateKey) && { gate_key: gateKey }),
        // Lookup key of the purchased price, so fulfilment can record the real
        // price_id instead of inferring one.
        price_lookup_key: priceId,
      },
      // userId must live on the subscription too — webhooks for renewals and
      // cancellations only carry the subscription object.
      ...(isRecurring && {
        subscription_data: {
          metadata: {
            ...(resolvedUserId && { userId: resolvedUserId }),
            ...(promotionCode && { partner_code: promotionCode }),
          },
        },
      }),
    });


    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
