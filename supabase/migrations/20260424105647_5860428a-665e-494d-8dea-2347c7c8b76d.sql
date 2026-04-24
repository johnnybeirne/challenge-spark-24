ALTER TABLE public.challenge_progress
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();