REVOKE EXECUTE ON FUNCTION public.access_settings_single_row() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.access_settings_single_row() TO service_role;