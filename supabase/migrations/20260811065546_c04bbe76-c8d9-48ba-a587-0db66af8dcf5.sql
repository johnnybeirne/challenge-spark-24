-- 1. Points: remove client write access
DROP POLICY IF EXISTS "Users can insert their own monthly points" ON public.monthly_points_tracking;
DROP POLICY IF EXISTS "Users can update their own monthly points" ON public.monthly_points_tracking;
REVOKE INSERT, UPDATE ON public.monthly_points_tracking FROM authenticated;
GRANT ALL ON public.monthly_points_tracking TO service_role;

CREATE OR REPLACE FUNCTION public.recompute_monthly_points()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_signup timestamptz;
  v_start timestamptz;
  v_end timestamptz;
  v_key text;
  v_days integer := 0;
  v_invites integer := 0;
  v_ref_days integer := 0;
  v_total integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT created_at INTO v_signup FROM public.profiles WHERE user_id = v_user;
  IF v_signup IS NULL THEN
    RETURN 0;
  END IF;

  v_start := v_signup + (floor(GREATEST(EXTRACT(EPOCH FROM (now() - v_signup)), 0) / (28*24*60*60)) * interval '28 days');
  v_end := v_start + interval '28 days';
  v_key := public.access_cycle_key(v_signup, now());

  -- Own day completions inside the cycle
  SELECT count(*) INTO v_days
    FROM public.challenge_progress cp,
         LATERAL jsonb_each_text(COALESCE(cp.day_completed_at, '{}'::jsonb)) AS d(day, ts)
   WHERE cp.user_id = v_user
     AND d.key IN ('1','2','3')
     AND (d.value)::timestamptz >= v_start
     AND (d.value)::timestamptz < v_end;

  -- Invites who joined during this cycle
  SELECT COALESCE(invite_count, 0) INTO v_invites
    FROM public.monthly_invite_tracking
   WHERE user_id = v_user AND month = v_key;

  -- Referrals completing days during this cycle
  SELECT count(*) INTO v_ref_days
    FROM public.referral_day_credits
   WHERE inviter_user_id = v_user
     AND awarded_at >= v_start
     AND awarded_at < v_end;

  v_total := (COALESCE(v_days,0) + COALESCE(v_invites,0) + COALESCE(v_ref_days,0)) * 50;

  INSERT INTO public.monthly_points_tracking (user_id, month, points_total)
  VALUES (v_user, v_key, v_total)
  ON CONFLICT (user_id, month) DO UPDATE
    SET points_total = EXCLUDED.points_total,
        updated_at = now();

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_monthly_points() TO authenticated;

-- 2. Unlock grants: remove client insert, add validated RPC
DROP POLICY IF EXISTS "Users can record their own invite unlock" ON public.unlock_grants;
REVOKE INSERT ON public.unlock_grants FROM authenticated;
GRANT ALL ON public.unlock_grants TO service_role;

CREATE OR REPLACE FUNCTION public.claim_invite_unlock(p_gate_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_required integer;
  v_enabled boolean;
  v_show_invite boolean;
  v_direct integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT invites_required, enabled, show_invite
    INTO v_required, v_enabled, v_show_invite
    FROM public.unlock_gates
   WHERE key = p_gate_key;

  IF NOT FOUND OR COALESCE(v_enabled, false) = false OR COALESCE(v_show_invite, false) = false THEN
    RETURN false;
  END IF;

  SELECT COALESCE(direct_referral_count, 0) INTO v_direct
    FROM public.profiles WHERE user_id = v_user;

  IF COALESCE(v_direct, 0) < COALESCE(v_required, 0) THEN
    RETURN false;
  END IF;

  INSERT INTO public.unlock_grants (user_id, gate_key, source)
  VALUES (v_user, p_gate_key, 'invites')
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_invite_unlock(text) TO authenticated;