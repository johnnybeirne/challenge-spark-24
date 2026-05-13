-- Allow signed-in users to write their own first-touch attribution row.
-- Idempotency is enforced by the unique (user_id) constraint already on the table.
CREATE POLICY "Users can insert own attribution"
ON public.referral_attributions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);