-- Update create_trainer_subscription: Annual duration 425 -> 365 days
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
DECLARE
  v_amount numeric;
  v_duration integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_profile_owner(p_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;

  IF p_plan_type = 'monthly' THEN
    v_amount := 999;
    v_duration := 30;
  ELSIF p_plan_type = 'annual' THEN
    v_amount := 9999;
    v_duration := 365;  -- 12 months exactly (no bonus days)
  ELSE
    RAISE EXCEPTION 'Invalid plan type: must be monthly or annual';
  END IF;

  RETURN QUERY
  INSERT INTO trainer_platform_subscriptions (
    trainer_id, plan_type, status, amount,
    start_date, end_date, grace_end_date,
    is_trial_used, payment_status
  ) VALUES (
    p_trainer_id, p_plan_type, 'pending_payment', v_amount,
    CURRENT_DATE, CURRENT_DATE + v_duration, CURRENT_DATE + v_duration + 3,
    p_is_trial_used, 'pending'
  )
  RETURNING *;
END;
$function$;

-- Update renew_trainer_subscription: Annual duration 425 -> 365 days
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
  v_amount numeric;
  v_duration integer;
  v_start date;
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

  IF p_plan_type = 'monthly' THEN
    v_amount := 999;
    v_duration := 30;
  ELSIF p_plan_type = 'annual' THEN
    v_amount := 9999;
    v_duration := 365;  -- 12 months exactly (no bonus days)
  ELSE
    RAISE EXCEPTION 'Invalid plan type: must be monthly or annual';
  END IF;

  IF p_is_active THEN
    SELECT end_date INTO v_start
    FROM trainer_platform_subscriptions
    WHERE id = p_subscription_id;
  ELSE
    v_start := CURRENT_DATE;
  END IF;

  RETURN QUERY
  UPDATE trainer_platform_subscriptions
  SET plan_type = p_plan_type,
      status = 'pending_payment',
      amount = v_amount,
      start_date = v_start,
      end_date = v_start + v_duration,
      grace_end_date = v_start + v_duration + 3,
      payment_status = 'pending'
  WHERE id = p_subscription_id
  RETURNING *;
END;
$function$;