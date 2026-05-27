
ALTER TABLE public.challenge_progress
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

UPDATE public.challenge_progress
   SET ends_at = started_at + interval '72 hours'
 WHERE ends_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_challenge_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.ends_at IS NULL THEN
      NEW.ends_at := NEW.started_at + interval '72 hours';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.started_at IS DISTINCT FROM OLD.started_at THEN
      NEW.ends_at := NEW.started_at + interval '72 hours';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS challenge_progress_set_ends_at ON public.challenge_progress;
CREATE TRIGGER challenge_progress_set_ends_at
BEFORE INSERT OR UPDATE ON public.challenge_progress
FOR EACH ROW EXECUTE FUNCTION public.set_challenge_ends_at();
