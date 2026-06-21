
-- 1. New counter on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_quiz_complete_count integer NOT NULL DEFAULT 0;

-- 2. Idempotency table: one row per referred user once they complete the quiz
CREATE TABLE IF NOT EXISTS public.referral_quiz_credits (
  referred_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_invite_code text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referral_quiz_credits TO authenticated;
GRANT ALL ON public.referral_quiz_credits TO service_role;

ALTER TABLE public.referral_quiz_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral-quiz credit row"
  ON public.referral_quiz_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id OR auth.uid() = inviter_user_id);

CREATE INDEX IF NOT EXISTS referral_quiz_credits_inviter_idx
  ON public.referral_quiz_credits (inviter_user_id);

-- 3. SECURITY DEFINER function the client calls after quiz completion
CREATE OR REPLACE FUNCTION public.award_referral_quiz_credit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ref_code text;
  v_inviter_user_id uuid;
  v_inserted boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  -- Look up the referrer code on the calling user's profile
  SELECT referred_by INTO v_ref_code
    FROM public.profiles
   WHERE user_id = v_user;

  IF v_ref_code IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'no_referrer');
  END IF;

  -- Resolve inviter's user_id
  SELECT user_id INTO v_inviter_user_id
    FROM public.profiles
   WHERE invite_code = v_ref_code;

  IF v_inviter_user_id IS NULL OR v_inviter_user_id = v_user THEN
    RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'inviter_not_found_or_self');
  END IF;

  -- Idempotent insert
  INSERT INTO public.referral_quiz_credits (referred_user_id, inviter_user_id, inviter_invite_code)
  VALUES (v_user, v_inviter_user_id, v_ref_code)
  ON CONFLICT (referred_user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    UPDATE public.profiles
       SET referral_quiz_complete_count = referral_quiz_complete_count + 1
     WHERE user_id = v_inviter_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'credited', v_inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_referral_quiz_credit() TO authenticated;
