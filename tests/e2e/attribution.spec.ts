/**
 * E2E: first-touch ?ref= attribution → exactly one referral_attributions row
 * after the user signs up.
 *
 * What this verifies (end-to-end):
 *   1. Visiting /?ref=<slug> stores first-touch attribution in the browser
 *      (localStorage `leadio_attribution` + cookie `leadio_ref`).
 *   2. After a real Supabase user signs in, the AuthProvider triggers
 *      `bindAttributionToUser`, which writes ONE row to referral_attributions.
 *   3. Re-visiting the app does NOT create a second row (idempotent bind).
 *
 * Requirements (skipped gracefully if missing):
 *   - env SUPABASE_SERVICE_ROLE_KEY  — needed to create test partner + user
 *                                       and to read referral_attributions
 *                                       without RLS friction.
 *   - env VITE_SUPABASE_URL          — usually present from the project .env.
 *
 * Run:  bunx playwright test tests/e2e/attribution.spec.ts
 */
import { test, expect } from "../../playwright-fixture";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://tkhmslaqgmzwfqyyivek.supabase.co";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

const RUN = Boolean(SERVICE_ROLE && ANON);

test.describe("first-touch ?ref= attribution", () => {
  test.skip(!RUN, "SUPABASE_SERVICE_ROLE_KEY (and anon key) required for E2E.");

  const slug = `e2e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const email = `e2e-attrib+${Date.now()}@example.test`;
  const password = "Test123!" + Math.random().toString(36).slice(2, 8);

  let admin: ReturnType<typeof createClient>;
  let partnerId = "";
  let userId = "";

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, { auth: { persistSession: false } });

    // 1. Create a partner with a unique slug we control.
    const { data: partner, error: pErr } = await (admin.from("partners") as any)
      .insert({
        slug,
        display_name: `E2E Partner ${slug}`,
        status: "active",
        // user_id is NOT NULL in schema; set to a synthetic uuid (no FK enforced).
        user_id: "00000000-0000-0000-0000-000000000000",
      })
      .select("id")
      .single();
    if (pErr) throw new Error(`partner create failed: ${pErr.message}`);
    partnerId = (partner as any).id;

    // 2. Create a confirmed user via admin API so we can sign in with password.
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr || !u.user) throw new Error(`user create failed: ${uErr?.message}`);
    userId = u.user.id;
  });

  test.afterAll(async () => {
    if (!admin) return;
    // Clean up in reverse order; ignore errors.
    await (admin.from("referral_attributions") as any).delete().eq("user_id", userId);
    if (userId) await admin.auth.admin.deleteUser(userId);
    if (partnerId) await (admin.from("partners") as any).delete().eq("id", partnerId);
  });

  test("captures first-touch from /?ref= and writes exactly one row after sign-in", async ({ page }) => {
    // ── Step A: visit /?ref=<slug> → first-touch should be captured client-side.
    await page.goto(`/?ref=${slug}`);
    await page.waitForLoadState("domcontentloaded");

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("leadio_attribution");
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored, "localStorage should hold first-touch record").toBeTruthy();
    expect(stored.slug).toBe(slug);
    expect(stored.source).toBe("query_param");

    // ── Step B: sign the test user in via Supabase JS in the page context.
    //    AuthProvider's onAuthStateChange will call bindAttributionToUser.
    const signInResult = await page.evaluate(
      async ({ url, anon, email, password }) => {
        const mod = await import("https://esm.sh/@supabase/supabase-js@2");
        const sb = mod.createClient(url, anon);
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return { ok: !error, err: error?.message ?? null };
      },
      { url: SUPABASE_URL, anon: ANON!, email, password }
    );
    expect(signInResult.ok, `sign-in failed: ${signInResult.err}`).toBe(true);

    // Reload so the app's own Supabase client picks up the persisted session
    // and AuthProvider fires onAuthStateChange → bindAttributionToUser.
    await page.goto("/debug/attribution");
    // Give the deferred bind a moment to round-trip to the DB.
    await page.waitForTimeout(2500);

    // ── Step C: assert exactly one referral_attributions row for this user.
    const { data: rows, error } = await (admin.from("referral_attributions") as any)
      .select("*")
      .eq("user_id", userId);
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows![0].partner_id).toBe(partnerId);
    expect(rows![0].partner_slug).toBe(slug);
    expect(rows![0].source).toBe("query_param");

    // ── Step D: re-visit; the bind must remain idempotent.
    await page.goto("/debug/attribution");
    await page.waitForTimeout(1500);

    const { data: rows2 } = await (admin.from("referral_attributions") as any)
      .select("id")
      .eq("user_id", userId);
    expect(rows2, "second visit must not create a duplicate row").toHaveLength(1);
  });
});
