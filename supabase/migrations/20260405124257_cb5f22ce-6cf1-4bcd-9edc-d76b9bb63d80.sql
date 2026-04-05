
-- Create profiles table with referral fields
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  referred_by TEXT REFERENCES public.profiles(invite_code),
  referred_by_parent TEXT REFERENCES public.profiles(invite_code),
  direct_referral_count INTEGER NOT NULL DEFAULT 0,
  indirect_referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast referral lookups
CREATE INDEX idx_profiles_invite_code ON public.profiles(invite_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);

-- Function to process referral chain on signup
CREATE OR REPLACE FUNCTION public.process_referral()
RETURNS TRIGGER AS $$
DECLARE
  inviter_record RECORD;
BEGIN
  -- Skip if no referral
  IF NEW.referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent self-referral
  IF NEW.referred_by = NEW.invite_code THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  -- Look up the inviter
  SELECT invite_code, referred_by INTO inviter_record
  FROM public.profiles
  WHERE invite_code = NEW.referred_by;

  IF NOT FOUND THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  -- Set parent (level 2) if inviter was also referred
  IF inviter_record.referred_by IS NOT NULL THEN
    NEW.referred_by_parent := inviter_record.referred_by;
  END IF;

  -- Increment direct count for inviter
  UPDATE public.profiles
  SET direct_referral_count = direct_referral_count + 1
  WHERE invite_code = NEW.referred_by;

  -- Increment indirect count for parent
  IF NEW.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles
    SET indirect_referral_count = indirect_referral_count + 1
    WHERE invite_code = NEW.referred_by_parent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on insert
CREATE TRIGGER on_profile_referral
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_referral();

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
