UPDATE public.profiles SET is_premium = false, premium_since = NULL WHERE user_id = '47eef40d-8d01-4ef9-96cd-4a7637811f45' AND premium_since >= '2026-08-19 07:00:00+00';

DELETE FROM public.unlocks WHERE user_id = '47eef40d-8d01-4ef9-96cd-4a7637811f45' AND reason = 'stripe_purchase' AND unlocked_at >= '2026-08-19 07:00:00+00';

UPDATE public.purchases SET price_id = 'reward_100' WHERE id = '0bd5b975-1db2-4297-8789-4581ef71e2c6';

INSERT INTO public.unlock_grants (user_id, gate_key, source)
VALUES ('47eef40d-8d01-4ef9-96cd-4a7637811f45', 'reward_gate_100', 'purchase')
ON CONFLICT (user_id, gate_key) DO NOTHING;