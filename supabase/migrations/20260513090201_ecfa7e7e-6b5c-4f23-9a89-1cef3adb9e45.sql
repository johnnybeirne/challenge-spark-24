
ALTER VIEW public.partner_leaderboard SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.admin_reassign_attribution(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_commission(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_merge_partners(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_partner_score(uuid, integer) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_reassign_attribution(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_commission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_merge_partners(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_partner_score(uuid, integer) TO authenticated;
