ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_not_empty CHECK (btrim(email) <> '');