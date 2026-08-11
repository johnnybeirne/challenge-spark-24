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
     AND d.day_key IN ('day1','day2','day3')
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
    SET points_total = GREATEST(public.monthly_points_tracking.points_total, EXCLUDED.points_total),
        updated_at = now();

  SELECT points_total INTO v_total
    FROM public.monthly_points_tracking
   WHERE user_id = v_user AND month = v_key;

  RETURN COALESCE(v_total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_monthly_points() TO authenticated;

-- One-off backfill: award missing day-completion points to existing participants,
-- accumulate-only (never lowers an existing total).
CREATE OR REPLACE FUNCTION public.backfill_day_completion_points()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_signup timestamptz;
  v_start timestamptz;
  v_end timestamptz;
  v_key text;
  v_days integer;
  v_invites integer;
  v_ref_days integer;
  v_total integer;
  v_count integer := 0;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.challenge_progress LOOP
    SELECT created_at INTO v_signup FROM public.profiles WHERE user_id = r.user_id;
    CONTINUE WHEN v_signup IS NULL;

    v_start := v_signup + (floor(GREATEST(EXTRACT(EPOCH FROM (now() - v_signup)), 0) / (28*24*60*60)) * interval '28 days');
    v_end := v_start + interval '28 days';
    v_key := public.access_cycle_key(v_signup, now());

    SELECT count(*) INTO v_days
      FROM public.challenge_progress cp,
           LATERAL jsonb_each_text(COALESCE(cp.day_completed_at, '{}'::jsonb)) AS d(day_key, day_ts)
     WHERE cp.user_id = r.user_id
       AND d.day_key IN ('day1','day2','day3')
       AND d.day_ts ~ '^\d{4}-'
       AND (d.day_ts)::timestamptz >= v_start
       AND (d.day_ts)::timestamptz < v_end;

    SELECT COALESCE(invite_count, 0) INTO v_invites
      FROM public.monthly_invite_tracking
     WHERE user_id = r.user_id AND month = v_key;

    SELECT count(*) INTO v_ref_days
      FROM public.referral_day_credits
     WHERE inviter_user_id = r.user_id
       AND awarded_at >= v_start
       AND awarded_at < v_end;

    v_total := (COALESCE(v_days,0) + COALESCE(v_invites,0) + COALESCE(v_ref_days,0)) * 50;

    INSERT INTO public.monthly_points_tracking (user_id, month, points_total)
    VALUES (r.user_id, v_key, v_total)
    ON CONFLICT (user_id, month) DO UPDATE
      SET points_total = GREATEST(public.monthly_points_tracking.points_total, EXCLUDED.points_total),
          updated_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_day_completion_points() FROM PUBLIC, anon, authenticated;