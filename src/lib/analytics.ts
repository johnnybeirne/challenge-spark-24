import { supabase } from "@/integrations/supabase/client";
import { fbTrack, fbTrackCustom } from "@/lib/fbPixel";

export type AnalyticsEvent =
  | "assessment_started"
  | "assessment_completed"
  | "assessment_track_b2b"
  | "assessment_track_b2c"
  | "assessment_result_quick_win"
  | "assessment_result_transformation"
  | "assessment_result_skill_builder"
  | "assessment_result_launch"
  | "assessment_retaken"
  | "assessment_result_shared"
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
  | "reward_accessed"
  | "landing_viewed"
  | "landing_cta_clicked"
  | "landing_scroll_depth"
  | "landing_faq_expanded"
  | "assessment_question_answered"
  | "assessment_time_taken"
  | "memory_created"
  | "memory_updated"
  | "ai_response_personalised"
  | "personalisation_used"
  | "calendar_add_clicked"
  | "calendar_google_selected"
  | "calendar_ics_downloaded"
  | "training_hub_viewed"
  | "training_hub_completed"
  | "training_video_marked_watched"
  | "dashboard_training_viewed"
  | "dashboard_training_marked_watched"
  | "day_training_viewed"
  | "day_training_marked_watched"
  | "admin_training_viewed"
  | "admin_training_updated"
  | "training_video_url_added"
  | "training_section_disabled"
  | "training_section_enabled"
  | "profile_updated"
  | "your_dashboard_viewed"
  | "promise_polished"
  | "promise_edited"
  | "lock_screen_buy_click"
  | "lock_screen_referral_share"
  | "referral_day1_credited"
  | "referral_day2_credited"
  | "referral_day3_credited";


// Map internal analytics events to Meta Pixel standard/custom events so every
// existing trackEvent call automatically mirrors to Facebook.
const FB_EVENT_MAP: Partial<Record<AnalyticsEvent, { event: string; params?: Record<string, unknown>; custom?: boolean }>> = {
  assessment_completed: { event: "Lead", params: { content_name: "Quiz Assessment" } },
  signup_completed: { event: "CompleteRegistration", params: { content_name: "Challenge Signup" } },
  challenge_completed: { event: "ChallengeCompleted", custom: true },
  referral_converted: { event: "Lead", params: { content_name: "Referral Converted" } },
  partner_application_submitted: { event: "Lead", params: { content_name: "Partner Application" } },
  landing_cta_clicked: { event: "InitiateCheckout", params: { content_name: "Landing CTA" } },
};

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

  // Mirror to Facebook Pixel (no-op if the snippet hasn't loaded)
  const fb = FB_EVENT_MAP[event];
  if (fb) {
    if (fb.custom) fbTrackCustom(fb.event, fb.params);
    else fbTrack(fb.event, fb.params);
  }
}
