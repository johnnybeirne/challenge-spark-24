ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_referral_code ON public.waitlist_signups(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_referred_by_code ON public.waitlist_signups(referred_by_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email_unique ON public.waitlist_signups(lower(email));

-- Allow admins to read all waitlist signups (already public-readable but explicit)
DO $$ BEGIN
  CREATE POLICY "Admins manage waitlist" ON public.waitlist_signups
    FOR ALL TO public
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;