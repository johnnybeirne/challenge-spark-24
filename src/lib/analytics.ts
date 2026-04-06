import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "assessment_started"
  | "assessment_completed"
  | "signup_completed"
  | "day_completed"
  | "challenge_completed"
  | "share_clicked"
  | "referral_sent"
  | "community_unlocked"
  | "onboarding_viewed"
  | "onboarding_invite_started"
  | "onboarding_invite_completed"
  | "onboarding_skipped"
  | "promoter_dashboard_viewed"
  | "promoter_link_copied"
  | "promoter_shared"
  | "promoter_cta_clicked"
  | "crosspromo_impression"
  | "crosspromo_click"
  | "crosspromo_featured"
  | "crosspromo_viewed"
  | "crosspromo_clicked"
  | "founder_unlocked"
  | "founder_viewed"
  | "founder_slots_remaining"
  | "founder_visibility_boost_applied";

export async function trackEvent(
  event: AnalyticsEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await (supabase.from("analytics_events") as any).insert({
      event_name: event,
      metadata: metadata ?? {},
    });
  } catch {
    // Fire-and-forget — never block UI
  }
}
