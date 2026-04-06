DROP POLICY "Allow update contributions" ON public.partner_contributions;

-- Only allow users to update their own pending contributions
CREATE POLICY "Users can update own pending contributions"
ON public.partner_contributions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');