CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL UNIQUE,
  user_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_answered_at timestamptz,
  completed_at timestamptz,
  last_question_index integer,
  last_question_id text,
  answered_count integer NOT NULL DEFAULT 0,
  total_questions integer,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  level text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.quiz_sessions TO service_role;
GRANT SELECT ON public.quiz_sessions TO authenticated;

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read quiz sessions"
  ON public.quiz_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER quiz_sessions_updated_at
  BEFORE UPDATE ON public.quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX quiz_sessions_started_at_idx ON public.quiz_sessions (started_at DESC);