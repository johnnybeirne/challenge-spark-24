import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "assessment_started"
  | "assessment_completed"
  | "signup_completed"
  | "day_completed"
  | "challenge_completed"
  | "share_clicked"
  | "referral_direct_created"
  | "referral_indirect_created"
  | "referral_converted"
  | "unlock_earned"
  | "community_viewed"
  | "community_unlocked"
  | "community_tab_changed"
  | "leaderboard_viewed"
  | "builder_boosted"
  | "challenge_submitted_to_community"
  | "crosspromo_impression"
  | "crosspromo_click"
  | "crosspromo_featured"
  | "onboarding_viewed"
  | "onboarding_invite_started"
  | "onboarding_invite_completed"
  | "onboarding_skipped"
  | "promoter_dashboard_viewed"
  | "promoter_link_copied"
  | "promoter_shared"
  | "promoter_cta_clicked"
  | "partners_page_viewed"
  | "partner_application_started"
  | "partner_application_submitted"
  | "partner_approved"
  | "partner_performance_viewed"
  | "partner_asset_opened"
  | "partner_asset_clicked"
  | "partner_visibility_help_viewed"
  | "founder_unlocked"
  | "founder_viewed"
  | "founder_slots_remaining"
  | "founder_visibility_boost_applied"
  | "reward_accessed";

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
