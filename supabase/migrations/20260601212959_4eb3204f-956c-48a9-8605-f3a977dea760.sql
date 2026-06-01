ALTER ROLE authenticator SET statement_timeout = '30s';
ALTER ROLE authenticator SET lock_timeout = '30s';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';