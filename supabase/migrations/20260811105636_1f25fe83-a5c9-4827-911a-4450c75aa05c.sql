CREATE OR REPLACE FUNCTION public.get_my_referred_people()
RETURNS TABLE(first_name text, surname text, name text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.first_name, p.surname, p.name, p.created_at
  FROM public.profiles p
  WHERE p.referred_by IS NOT NULL
    AND p.referred_by = (
      SELECT me.invite_code FROM public.profiles me WHERE me.user_id = auth.uid()
    )
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_referred_people() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referred_people() TO authenticated;

COMMENT ON FUNCTION public.get_my_referred_people() IS
'Returns first_name, surname, name and created_at for profiles referred by the calling user (referred_by = caller invite_code), newest first. SECURITY DEFINER because profiles RLS only allows own-row reads; the caller invite_code is resolved from auth.uid() so no one can enumerate another user''s referrals.';