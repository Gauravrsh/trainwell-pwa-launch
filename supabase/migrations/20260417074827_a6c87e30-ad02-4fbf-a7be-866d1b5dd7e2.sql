-- Stop create/renew RPCs from writing pending_payment rows that strand trainers
CREATE OR REPLACE FUNCTION public.create_trainer_subscription(
  p_trainer_id uuid,
  p_plan_type platform_plan_type,
  p_is_trial_used boolean
)
RETURNS SETOF trainer_platform_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT is_profile_owner(p_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;
  IF p_plan_type NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Invalid plan type: must be monthly or annual';
  END IF;
  RETURN QUERY
  SELECT * FROM trainer_platform_subscriptions
  WHERE trainer_id = p_trainer_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.renew_trainer_subscription(
  p_subscription_id uuid,
  p_plan_type platform_plan_type,
  p_is_active boolean
)
RETURNS SETOF trainer_platform_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trainer_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT trainer_id INTO v_trainer_id
  FROM trainer_platform_subscriptions
  WHERE id = p_subscription_id;
  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  IF NOT is_profile_owner(v_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your subscription';
  END IF;
  IF p_plan_type NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Invalid plan type: must be monthly or annual';
  END IF;
  RETURN QUERY
  SELECT * FROM trainer_platform_subscriptions
  WHERE id = p_subscription_id;
END;
$function$;

-- Repair Gaurav: drop orphan pending_payment row, restore free tier
DELETE FROM trainer_platform_subscriptions
WHERE trainer_id = 'a7569e8a-28d8-4445-9fc9-43d6ae8b259e'
  AND status = 'pending_payment';

INSERT INTO trainer_platform_subscriptions (
  trainer_id, plan_type, status, amount,
  start_date, end_date, grace_end_date,
  is_trial_used, trial_clients_count, max_trial_clients,
  payment_status
)
SELECT
  'a7569e8a-28d8-4445-9fc9-43d6ae8b259e'::uuid,
  'free'::platform_plan_type,
  'active'::platform_subscription_status,
  0,
  CURRENT_DATE,
  CURRENT_DATE + 36500,
  NULL,
  false,
  0,
  3,
  'not_required'
WHERE NOT EXISTS (
  SELECT 1 FROM trainer_platform_subscriptions
  WHERE trainer_id = 'a7569e8a-28d8-4445-9fc9-43d6ae8b259e'
);