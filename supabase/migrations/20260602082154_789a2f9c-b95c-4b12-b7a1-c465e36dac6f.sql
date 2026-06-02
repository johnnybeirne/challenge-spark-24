CREATE OR REPLACE VIEW public.public_waitlist_signup AS
SELECT
  referral_code,
  name,
  first_name,
  surname,
  confirmed_invites,
  waitlist_position,
  current_tier
FROM public.waitlist_signups;

GRANT SELECT ON public.public_waitlist_signup TO anon, authenticated;