CREATE TABLE IF NOT EXISTS public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hub_completed BOOLEAN NOT NULL DEFAULT false,
  pre_challenge_watched BOOLEAN NOT NULL DEFAULT false,
  day1_watched BOOLEAN NOT NULL DEFAULT false,
  day2_watched BOOLEAN NOT NULL DEFAULT false,
  day3_watched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own training progress" ON public.training_progress;
CREATE POLICY "Users can view own training progress"
ON public.training_progress
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own training progress" ON public.training_progress;
CREATE POLICY "Users can create own training progress"
ON public.training_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own training progress" ON public.training_progress;
CREATE POLICY "Users can update own training progress"
ON public.training_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_training_progress_updated_at ON public.training_progress;
CREATE TRIGGER update_training_progress_updated_at
BEFORE UPDATE ON public.training_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();