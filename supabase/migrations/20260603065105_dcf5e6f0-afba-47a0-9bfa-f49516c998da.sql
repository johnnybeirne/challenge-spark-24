DROP POLICY IF EXISTS "Authenticated can insert day1 step messages" ON public.day1_step_messages;
DROP POLICY IF EXISTS "Authenticated can update day1 step messages" ON public.day1_step_messages;
DROP POLICY IF EXISTS "Authenticated can delete day1 step messages" ON public.day1_step_messages;
DROP POLICY IF EXISTS "Authenticated users can insert day1 step messages" ON public.day1_step_messages;
DROP POLICY IF EXISTS "Authenticated users can update day1 step messages" ON public.day1_step_messages;
DROP POLICY IF EXISTS "Authenticated users can delete day1 step messages" ON public.day1_step_messages;

CREATE POLICY "Admins can insert day1 step messages"
ON public.day1_step_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update day1 step messages"
ON public.day1_step_messages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete day1 step messages"
ON public.day1_step_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));