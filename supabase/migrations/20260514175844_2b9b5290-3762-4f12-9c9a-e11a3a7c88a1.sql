-- 1. Revoke direct RPC access on calorie helpers (used by triggers / service role only)
REVOKE ALL ON FUNCTION public.get_client_weight_on(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_workout_calories(uuid) FROM PUBLIC, anon, authenticated;

-- 2. Add ownership guard to can_trainer_add_client
CREATE OR REPLACE FUNCTION public.can_trainer_add_client(p_trainer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan platform_plan_type;
  v_status platform_subscription_status;
  v_active_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_profile_owner(p_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;

  SELECT plan_type, status INTO v_plan, v_status
  FROM trainer_platform_subscriptions
  WHERE trainer_id = p_trainer_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN false;
  END IF;

  IF v_plan IN ('monthly', 'annual') AND v_status IN ('active', 'grace', 'trial') THEN
    RETURN true;
  END IF;

  IF v_plan IN ('free', 'trial') THEN
    v_active_count := get_active_client_count(p_trainer_id);
    RETURN v_active_count < 3;
  END IF;

  RETURN false;
END;
$function$;

-- 3. Defense-in-depth anon deny on trainer_notifications
CREATE POLICY "Block anon access to trainer_notifications"
  ON public.trainer_notifications
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
