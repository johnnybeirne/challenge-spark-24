UPDATE auth.users SET encrypted_password = crypt('j4ckt0m11!!', gen_salt('bf')), updated_at = now() WHERE email = 'johnny@johnnybeirne.com';

INSERT INTO public.user_roles (user_id, role)
SELECT '47eef40d-8d01-4ef9-96cd-4a7637811f45', 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id='47eef40d-8d01-4ef9-96cd-4a7637811f45' AND role='admin'
);