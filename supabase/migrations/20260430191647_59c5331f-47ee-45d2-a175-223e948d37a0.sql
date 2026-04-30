
-- Create waitlist signups table
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  referral_code TEXT NOT NULL,
  referred_by_code TEXT,
  confirmed_invites INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT NOT NULL DEFAULT 'Joined',
  waitlist_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraints
ALTER TABLE public.waitlist_signups ADD CONSTRAINT waitlist_signups_email_unique UNIQUE (email);
ALTER TABLE public.waitlist_signups ADD CONSTRAINT waitlist_signups_referral_code_unique UNIQUE (referral_code);

-- Index for leaderboard queries
CREATE INDEX idx_waitlist_confirmed_invites ON public.waitlist_signups (confirmed_invites DESC, created_at ASC);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can read (leaderboard)
CREATE POLICY "Anyone can view waitlist entries"
ON public.waitlist_signups FOR SELECT
TO public
USING (true);

-- Anyone can insert (public signup, no auth)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_signups FOR INSERT
TO public
WITH CHECK (true);

-- No client updates allowed (handled by triggers)

-- Function to assign waitlist position on insert
CREATE OR REPLACE FUNCTION public.assign_waitlist_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.waitlist_position := (SELECT COALESCE(MAX(waitlist_position), 0) + 1 FROM public.waitlist_signups);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_waitlist_position
BEFORE INSERT ON public.waitlist_signups
FOR EACH ROW
EXECUTE FUNCTION public.assign_waitlist_position();

-- Function to calculate tier from invite count
CREATE OR REPLACE FUNCTION public.calculate_waitlist_tier(invite_count INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN invite_count >= 20 THEN 'Founder'
    WHEN invite_count >= 10 THEN 'Accelerator'
    WHEN invite_count >= 5 THEN 'Builder'
    WHEN invite_count >= 3 THEN 'Mover'
    WHEN invite_count >= 1 THEN 'Starter'
    ELSE 'Joined'
  END;
$$;

-- Function to process referral after a new signup
CREATE OR REPLACE FUNCTION public.process_waitlist_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer RECORD;
BEGIN
  -- Skip if no referral
  IF NEW.referred_by_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up referrer
  SELECT id, referral_code INTO referrer
  FROM public.waitlist_signups
  WHERE referral_code = NEW.referred_by_code;

  -- If referrer not found, clear it
  IF NOT FOUND THEN
    NEW.referred_by_code := NULL;
    RETURN NEW;
  END IF;

  -- Prevent self-referral
  IF NEW.referral_code = NEW.referred_by_code THEN
    NEW.referred_by_code := NULL;
    RETURN NEW;
  END IF;

  -- Increment referrer's confirmed invites and update tier
  UPDATE public.waitlist_signups
  SET confirmed_invites = confirmed_invites + 1,
      current_tier = public.calculate_waitlist_tier(confirmed_invites + 1),
      updated_at = now()
  WHERE referral_code = NEW.referred_by_code;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_waitlist_referral
BEFORE INSERT ON public.waitlist_signups
FOR EACH ROW
EXECUTE FUNCTION public.process_waitlist_referral();

-- Updated_at trigger
CREATE TRIGGER update_waitlist_signups_updated_at
BEFORE UPDATE ON public.waitlist_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
