INSERT INTO public.profiles (user_id, email, invite_code)
SELECT u.id, u.email, upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;