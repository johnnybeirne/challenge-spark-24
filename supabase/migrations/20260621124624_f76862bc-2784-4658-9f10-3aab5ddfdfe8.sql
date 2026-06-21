
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_ip_hash text,
  ADD COLUMN IF NOT EXISTS signup_ip_hashed_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspected_signup_dup_ip boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_signup_ip_hash_idx
  ON public.profiles (signup_ip_hash)
  WHERE signup_ip_hash IS NOT NULL;
