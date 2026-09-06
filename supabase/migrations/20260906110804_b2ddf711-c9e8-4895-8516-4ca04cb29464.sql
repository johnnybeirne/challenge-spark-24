CREATE TABLE public.pipeline_scorecard_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  q1 TEXT,
  q2 TEXT,
  q3 TEXT,
  q4 TEXT,
  q5 TEXT,
  q6 TEXT,
  q7 TEXT,
  q8 TEXT,
  q9 TEXT
);

GRANT INSERT ON public.pipeline_scorecard_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_scorecard_responses TO authenticated;
GRANT ALL ON public.pipeline_scorecard_responses TO service_role;

ALTER TABLE public.pipeline_scorecard_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a scorecard response"
ON public.pipeline_scorecard_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read scorecard responses"
ON public.pipeline_scorecard_responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scorecard responses"
ON public.pipeline_scorecard_responses
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));