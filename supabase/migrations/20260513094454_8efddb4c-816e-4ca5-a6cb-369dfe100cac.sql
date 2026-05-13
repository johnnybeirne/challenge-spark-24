
CREATE OR REPLACE FUNCTION public.get_partner_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  partner_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  signups integer,
  manual_score_adjustment integer,
  total_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS partner_id,
    p.slug,
    p.display_name,
    p.avatar_url,
    COALESCE(s.signups, 0)::int AS signups,
    p.manual_score_adjustment,
    (COALESCE(s.signups, 0) + p.manual_score_adjustment)::int AS total_score
  FROM public.partners p
  LEFT JOIN (
    SELECT partner_id, COUNT(*)::int AS signups
    FROM public.referral_attributions
    GROUP BY partner_id
  ) s ON s.partner_id = p.id
  WHERE p.status = 'active'
  ORDER BY (COALESCE(s.signups, 0) + p.manual_score_adjustment) DESC,
           p.created_at ASC
  LIMIT GREATEST(p_limit, 1);
$$;
