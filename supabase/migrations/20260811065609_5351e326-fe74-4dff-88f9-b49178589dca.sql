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

  SELECT count(*) INTO v_days
    FROM public.challenge_progress cp,
         LATERAL jsonb_each_text(COALESCE(cp.day_completed_at, '{}'::jsonb)) AS d(day_key, day_ts)
   WHERE cp.user_id = v_user
     AND d.day_key IN ('1','2','3')
     AND d.day_ts ~ '^\d{4}-'
     AND (d.day_ts)::timestamptz >= v_start
     AND (d.day_ts)::timestamptz < v_end;

  SELECT COALESCE(invite_count, 0) INTO v_invites
    FROM public.monthly_invite_tracking
   WHERE user_id = v_user AND month = v_key;

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