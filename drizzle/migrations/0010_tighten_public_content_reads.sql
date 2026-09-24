DROP POLICY IF EXISTS "Anyone can read diagnostic responses" ON public.diagnostic_responses;
CREATE POLICY "Public can read valid diagnostic responses" ON public.diagnostic_responses
FOR SELECT TO anon, authenticated
USING (min_percent <= max_percent AND jsonb_typeof(messages) = 'array' AND length(title) > 0);

DROP POLICY IF EXISTS "Public can read premium membership content" ON public.premium_membership_content;
CREATE POLICY "Public can read published premium membership content" ON public.premium_membership_content
FOR SELECT TO anon, authenticated
USING (length(heading) > 0);