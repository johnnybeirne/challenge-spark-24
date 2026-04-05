
-- Promoters table for JV partners
CREATE TABLE public.promoters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  partner_code text NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'elite')),
  is_approved boolean NOT NULL DEFAULT false,
  is_founding_partner boolean NOT NULL DEFAULT false,
  conversions integer NOT NULL DEFAULT 0,
  assessment_starts integer NOT NULL DEFAULT 0,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promoter record" ON public.promoters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view approved promoters" ON public.promoters
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert own promoter record" ON public.promoters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promoter record" ON public.promoters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_promoters_updated_at
  BEFORE UPDATE ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Badges table
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  badge_icon text NOT NULL DEFAULT 'award',
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cross-promotions table
CREATE TABLE public.cross_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cross_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions" ON public.cross_promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Promoters can manage own promotions" ON public.cross_promotions
  FOR INSERT WITH CHECK (
    promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid())
  );

CREATE POLICY "Promoters can update own promotions" ON public.cross_promotions
  FOR UPDATE USING (
    promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_cross_promotions_updated_at
  BEFORE UPDATE ON public.cross_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leaderboard overrides (admin only, no public RLS)
CREATE TABLE public.leaderboard_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  referral_adjustment integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_overrides ENABLE ROW LEVEL SECURITY;
-- No public policies - admin access only via service role

CREATE TRIGGER update_leaderboard_overrides_updated_at
  BEFORE UPDATE ON public.leaderboard_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-update promoter tier based on conversions
CREATE OR REPLACE FUNCTION public.update_promoter_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversions >= 50 THEN
    NEW.tier := 'elite';
  ELSIF NEW.conversions >= 25 THEN
    NEW.tier := 'gold';
  ELSIF NEW.conversions >= 10 THEN
    NEW.tier := 'silver';
  ELSE
    NEW.tier := 'bronze';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_update_promoter_tier
  BEFORE INSERT OR UPDATE OF conversions ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.update_promoter_tier();

-- Function to process partner referral attribution
CREATE OR REPLACE FUNCTION public.process_partner_referral(p_partner_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promoters
  SET conversions = conversions + 1
  WHERE partner_code = p_partner_code AND is_approved = true;
END;
$$;

-- Function to track partner assessment starts
CREATE OR REPLACE FUNCTION public.track_partner_assessment(p_partner_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promoters
  SET assessment_starts = assessment_starts + 1
  WHERE partner_code = p_partner_code AND is_approved = true;
END;
$$;
