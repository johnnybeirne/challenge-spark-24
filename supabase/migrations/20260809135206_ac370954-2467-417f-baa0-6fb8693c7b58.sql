CREATE POLICY "Users can insert their own monthly points"
ON public.monthly_points_tracking FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly points"
ON public.monthly_points_tracking FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.monthly_points_tracking TO authenticated;
GRANT ALL ON public.monthly_points_tracking TO service_role;