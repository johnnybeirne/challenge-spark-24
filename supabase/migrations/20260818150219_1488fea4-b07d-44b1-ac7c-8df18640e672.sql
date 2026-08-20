CREATE OR REPLACE FUNCTION public.claim_unlock(p_unlock_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_direct integer := 0;
  v_day integer := 1;
  v_completed boolean := false;
  v_url text;
  v_name text;
  v_value integer;
  v_reason text;
  v_ok boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  SELECT COALESCE(direct_referral_count, 0) INTO v_direct FROM public.profiles WHERE user_id = v_user;
  SELECT COALESCE(current_day, 1), COALESCE(completed, false), launch_url
    INTO v_day, v_completed, v_url
  FROM public.challenge_progress WHERE user_id = v_user;

  v_direct := COALESCE(v_direct, 0);
  v_day := COALESCE(v_day, 1);
  v_completed := COALESCE(v_completed, false);

  CASE p_unlock_id
    WHEN 'faster_start' THEN v_name := 'Faster Start Mode'; v_value := 29; v_reason := 'Invited first builder'; v_ok := v_direct >= 1;
    WHEN 'ai_accelerator' THEN v_name := 'AI Accelerator'; v_value := 49; v_reason := 'Invited 2 builders'; v_ok := v_direct >= 2;
    WHEN 'momentum_boost' THEN v_name := 'Momentum Boost'; v_value := 79; v_reason := 'Invited 3 builders'; v_ok := v_direct >= 3;
    WHEN 'day1_blueprint' THEN v_name := 'App blueprint'; v_value := 97; v_reason := 'Completed Day 1'; v_ok := v_day > 1;
    WHEN 'day2_playbook' THEN v_name := 'Challenge playbook'; v_value := 147; v_reason := 'Completed Day 2'; v_ok := v_day > 2;
    WHEN 'day3_checklist' THEN v_name := 'Launch checklist'; v_value := 97; v_reason := 'Completed Day 3'; v_ok := v_completed OR v_day > 3;
    WHEN 'referral_3_trust' THEN v_name := 'Trust growth playbook'; v_value := 147; v_reason := 'Invited 3 builders'; v_ok := v_direct >= 3;
    WHEN 'referral_5_prompts' THEN v_name := 'AI prompt pack'; v_value := 97; v_reason := 'Invited 5 builders'; v_ok := v_direct >= 5;
    WHEN 'referral_10_system' THEN v_name := 'Full system'; v_value := 297; v_reason := 'Invited 10 builders'; v_ok := v_direct >= 10;
    WHEN 'builder_circle' THEN v_name := 'Builder Circle access'; v_value := 197; v_reason := 'Launched and promoted challenge';
      v_ok := (v_completed OR v_day > 3) AND COALESCE(v_url, '') <> '' AND v_direct >= 3;
    ELSE
      RETURN false;
  END CASE;

  IF NOT v_ok THEN
    RETURN false;
  END IF;

  INSERT INTO public.unlocks (user_id, unlock_id, name, value, reason)
  VALUES (v_user, p_unlock_id, v_name, v_value, v_reason)
  ON CONFLICT (user_id, unlock_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_unlock(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_unlock(text) TO authenticated;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'unlocks' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.unlocks', p.policyname);
  END LOOP;
END $$;

REVOKE INSERT ON public.unlocks FROM authenticated, anon;
GRANT ALL ON public.unlocks TO service_role;