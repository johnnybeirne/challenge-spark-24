-- Add columns to promoters
ALTER TABLE public.promoters
ADD COLUMN IF NOT EXISTS is_eligible_for_promotion boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS quality_score numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS founding_rank integer,
ADD COLUMN IF NOT EXISTS founding_joined_at timestamptz;

-- Create founding config table
CREATE TABLE IF NOT EXISTS public.founding_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_founders integer NOT NULL DEFAULT 50,
  cutoff_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founding_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read founding config"
ON public.founding_config FOR SELECT
USING (true);

-- Seed default config
INSERT INTO public.founding_config (max_founders) VALUES (50);

-- Function to auto-assign founding partner status
CREATE OR REPLACE FUNCTION public.assign_founding_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_slots integer;
  cutoff timestamptz;
BEGIN
  -- Get config
  SELECT fc.max_founders, fc.cutoff_date INTO max_slots, cutoff
  FROM public.founding_config fc LIMIT 1;

  IF max_slots IS NULL THEN max_slots := 50; END IF;

  -- Check cutoff
  IF cutoff IS NOT NULL AND now() > cutoff THEN
    RETURN NEW;
  END IF;

  -- Count existing founders
  SELECT count(*) INTO current_count
  FROM public.promoters
  WHERE is_founding_partner = true;

  IF current_count < max_slots THEN
    NEW.is_founding_partner := true;
    NEW.founding_rank := current_count + 1;
    NEW.founding_joined_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on insert
CREATE TRIGGER trg_assign_founding_partner
BEFORE INSERT ON public.promoters
FOR EACH ROW
EXECUTE FUNCTION public.assign_founding_partner();