-- 1. Trigger functions should never be callable directly by API roles.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND pg_get_function_result(p.oid) = 'trigger'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- 2. Admin-only and signed-in-only functions: no anonymous execution.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND pg_get_function_result(p.oid) <> 'trigger'
      AND p.proname NOT IN (
        -- genuinely public surfaces (logged-out visitors need these)
        'has_role',
        'resolve_partner_by_slug',
        'track_partner_assessment',
        'check_guest_pass',
        'validate_coupon',
        'get_pipeline_scorecard_response',
        'get_partner_leaderboard',
        'get_active_challengers'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;

-- 3. Internal-only maintenance helpers: service role only.
REVOKE ALL ON FUNCTION public.backfill_day_completion_points() FROM PUBLIC, anon, authenticated;
