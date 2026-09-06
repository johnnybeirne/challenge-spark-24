GRANT SELECT ON public.pipeline_scorecard_responses TO anon;

CREATE POLICY "Anyone can read a scorecard response by id"
ON public.pipeline_scorecard_responses
FOR SELECT
TO anon, authenticated
USING (true);