DROP POLICY IF EXISTS "Authenticated users can view approved promoters" ON public.promoters;

CREATE POLICY "Authenticated users can view approved promoters"
  ON public.promoters
  FOR SELECT
  TO authenticated
  USING (is_approved = true);