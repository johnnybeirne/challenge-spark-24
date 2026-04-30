
-- Revoke public execute on trigger-only functions
REVOKE EXECUTE ON FUNCTION public.assign_waitlist_position() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_waitlist_referral() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_waitlist_tier(INTEGER) FROM anon, authenticated;
