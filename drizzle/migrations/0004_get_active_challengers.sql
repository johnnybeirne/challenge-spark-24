CREATE OR REPLACE FUNCTION public.get_active_challengers(p_limit integer DEFAULT 50)
RETURNS TABLE(user_id uuid, days_completed integer, completion_seconds numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.user_id,
    (
      SELECT count(*)::int
      FROM jsonb_object_keys(COALESCE(cp.day_completed_at, '{}'::jsonb)) k
      WHERE k IN ('1','2','3')
    ) AS days_completed,
    CASE
      WHEN (
        SELECT count(*)
        FROM jsonb_object_keys(COALESCE(cp.day_completed_at, '{}'::jsonb)) k
        WHERE k IN ('1','2','3')
      ) = 3 AND cp.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM ((
        SELECT max((cp.day_completed_at ->> k)::timestamptz)
        FROM jsonb_object_keys(cp.day_completed_at) k
        WHERE k IN ('1','2','3')
      ) - cp.started_at))
      ELSE NULL
    END AS completion_seconds
  FROM public.challenge_progress cp
  WHERE (
    SELECT count(*)
    FROM jsonb_object_keys(COALESCE(cp.day_completed_at, '{}'::jsonb)) k
    WHERE k IN ('1','2','3')
  ) > 0
  ORDER BY days_completed DESC, completion_seconds ASC NULLS LAST
  LIMIT GREATEST(COALESCE(p_limit, 50), 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_active_challengers(integer) TO anon, authenticated, service_role;