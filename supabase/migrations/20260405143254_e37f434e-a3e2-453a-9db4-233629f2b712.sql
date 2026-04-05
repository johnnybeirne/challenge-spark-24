
-- Add name column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;

-- Create challenge_progress table
CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_day integer NOT NULL DEFAULT 1,
  tasks jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  launch_url text DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_challenge_progress_user ON public.challenge_progress(user_id);

CREATE POLICY "Users can view own progress" ON public.challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.challenge_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create unlocks table
CREATE TABLE public.unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unlock_id text NOT NULL,
  name text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  reason text,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_unlocks_user_unlock ON public.unlocks(user_id, unlock_id);

CREATE POLICY "Users can view own unlocks" ON public.unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlocks" ON public.unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invite_code text;
  ref_code text;
  parent_ref text;
BEGIN
  -- Generate invite code
  new_invite_code := substr(md5(random()::text), 1, 8);

  -- Get referral from metadata
  ref_code := NEW.raw_user_meta_data->>'referred_by';

  -- Look up parent ref
  IF ref_code IS NOT NULL THEN
    SELECT referred_by INTO parent_ref FROM public.profiles WHERE invite_code = ref_code;
  END IF;

  INSERT INTO public.profiles (user_id, email, name, invite_code, referred_by, referred_by_parent)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    new_invite_code,
    ref_code,
    parent_ref
  );

  -- Increment direct referral count for inviter
  IF ref_code IS NOT NULL THEN
    UPDATE public.profiles SET direct_referral_count = direct_referral_count + 1 WHERE invite_code = ref_code;
  END IF;

  -- Increment indirect for parent
  IF parent_ref IS NOT NULL THEN
    UPDATE public.profiles SET indirect_referral_count = indirect_referral_count + 1 WHERE invite_code = parent_ref;
  END IF;

  -- Create challenge progress row
  INSERT INTO public.challenge_progress (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
