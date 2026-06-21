-- Per-day referral credit ledger (mirrors referral_quiz_credits pattern)
CREATE TABLE public.referral_day_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid NOT NULL,
  inviter_user_id uuid NOT NULL,
  inviter_invite_code text NOT NULL,
  day smallint NOT NULL CHECK (day IN (1,2,3)),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id, day)
);

GRANT SELECT, INSERT ON public.referral_day_credits TO authenticated;
GRANT ALL ON public.referral_day_credits TO service_role;

ALTER TABLE public.referral_day_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter or referred can view their day credits"
  ON public.referral_day_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_user_id OR auth.uid() = referred_user_id);

CREATE INDEX idx_referral_day_credits_inviter ON public.referral_day_credits (inviter_user_id, day);

-- Per-day counters on inviter's profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_day1_complete_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_day2_complete_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_day3_complete_count integer NOT NULL DEFAULT 0;

-- Idempotent crediting RPC, called by the referred user after completing day N
CREATE OR REPLACE FUNCTION public.award_referral_day_credit(p_day smallint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ref_code text;
  v_inviter_user_id uuid;
  v_inserted_rows integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF p_day IS NULL OR p_day NOT IN (1,2,3) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_day');
  END IF;

  SELECT referred_by INTO v_ref_code
    FROM public.profiles
   WHERE user_id = v_user;

  IF v_ref_code IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'no_referrer', 'day', p_day);
  END IF;

  SELECT user_id INTO v_inviter_user_id
    FROM public.profiles
   WHERE invite_code = v_ref_code;

  IF v_inviter_user_id IS NULL OR v_inviter_user_id = v_user THEN
    RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'inviter_not_found_or_self', 'day', p_day);
  END IF;

  INSERT INTO public.referral_day_credits (referred_user_id, inviter_user_id, inviter_invite_code, day)
  VALUES (v_user, v_inviter_user_id, v_ref_code, p_day)
  ON CONFLICT (referred_user_id, day) DO NOTHING;

  GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;

  IF v_inserted_rows > 0 THEN
    IF p_day = 1 THEN
      UPDATE public.profiles
         SET referral_day1_complete_count = referral_day1_complete_count + 1
       WHERE user_id = v_inviter_user_id;
    ELSIF p_day = 2 THEN
      UPDATE public.profiles
         SET referral_day2_complete_count = referral_day2_complete_count + 1
       WHERE user_id = v_inviter_user_id;
    ELSIF p_day = 3 THEN
      UPDATE public.profiles
         SET referral_day3_complete_count = referral_day3_complete_count + 1
       WHERE user_id = v_inviter_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'credited', v_inserted_rows > 0, 'day', p_day);
END;
$$;