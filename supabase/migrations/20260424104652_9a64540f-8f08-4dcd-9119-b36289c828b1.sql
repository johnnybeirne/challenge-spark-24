CREATE TABLE public.user_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  audience_type TEXT NOT NULL DEFAULT '',
  challenge_type TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  desired_outcome TEXT NOT NULL DEFAULT '',
  challenge_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory"
ON public.user_memory
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memory"
ON public.user_memory
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory"
ON public.user_memory
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_memory_updated_at
BEFORE UPDATE ON public.user_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();