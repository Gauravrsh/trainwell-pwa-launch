
-- ============================================================
-- PART 1: Add 'free' to platform_plan_type enum
-- ============================================================
ALTER TYPE public.platform_plan_type ADD VALUE IF NOT EXISTS 'free';

-- (commit so the new enum value is visible to subsequent statements)
COMMIT;
BEGIN;

-- ============================================================
-- PART 2: Update create_trainer_subscription with new prices
-- ============================================================
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
    v_duration := 425;  -- 365 + 60 bonus days
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

-- ============================================================
-- PART 3: Update renew_trainer_subscription with new prices
-- ============================================================
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
    v_duration := 425;
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

-- ============================================================
-- PART 4: New start_trainer_free function (replaces trial)
-- Free tier = no expiry, 3 active client cap
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_trainer_free(p_trainer_id uuid)
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

  RETURN QUERY
  INSERT INTO trainer_platform_subscriptions (
    trainer_id, plan_type, status, amount,
    start_date, end_date, grace_end_date,
    is_trial_used, trial_clients_count, max_trial_clients,
    payment_status
  ) VALUES (
    p_trainer_id, 'free', 'active', 0,
    CURRENT_DATE, CURRENT_DATE + 36500, NULL,  -- 100 years = effectively no expiry
    false, 0, 3,
    'not_required'
  )
  RETURNING *;
END;
$function$;

-- ============================================================
-- PART 5: Keep start_trainer_trial as alias to start_trainer_free
-- (so existing client code that still calls it doesn't break)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_trainer_trial(p_trainer_id uuid)
RETURNS SETOF trainer_platform_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM start_trainer_free(p_trainer_id);
END;
$function$;

-- ============================================================
-- PART 6: get_active_client_count
-- Returns count of distinct client_ids with at least one active plan
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_client_count(p_trainer_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(DISTINCT client_id)::integer
  FROM client_training_plans
  WHERE trainer_id = p_trainer_id
    AND status = 'active'
$function$;

-- ============================================================
-- PART 7: can_trainer_add_client
-- Free tier: max 3 active clients. Paid: unlimited.
-- ============================================================
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
  SELECT plan_type, status INTO v_plan, v_status
  FROM trainer_platform_subscriptions
  WHERE trainer_id = p_trainer_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- No subscription row at all → cannot add
  IF v_plan IS NULL THEN
    RETURN false;
  END IF;

  -- Paid plans (active or grace) → unlimited
  IF v_plan IN ('monthly', 'annual') AND v_status IN ('active', 'grace', 'trial') THEN
    RETURN true;
  END IF;

  -- Free or trial tier → enforce 3 active client cap
  IF v_plan IN ('free', 'trial') THEN
    v_active_count := get_active_client_count(p_trainer_id);
    RETURN v_active_count < 3;
  END IF;

  -- Expired / cancelled / pending_payment → cannot add
  RETURN false;
END;
$function$;

-- ============================================================
-- PART 8: Update has_active_platform_subscription
-- Free tier counts as "active" so trainers retain write access.
-- Per-client cap is enforced at the can_trainer_add_client / RLS layer.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_platform_subscription(_trainer_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM trainer_platform_subscriptions
    WHERE trainer_id = _trainer_profile_id
    AND (
      status IN ('trial', 'active')
      OR (status = 'grace' AND grace_end_date >= CURRENT_DATE)
      OR plan_type = 'free'
    )
  )
$function$;

-- ============================================================
-- PART 9: Update webhook RPCs to honour duration & support free
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_trainer_subscription_webhook(
  p_trainer_id uuid,
  p_plan_type platform_plan_type,
  p_duration_days integer,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO trainer_platform_subscriptions (
    trainer_id, plan_type, status, payment_status,
    razorpay_payment_id, razorpay_order_id,
    start_date, end_date,
    amount
  ) VALUES (
    p_trainer_id, p_plan_type, 'active', 'verified',
    p_razorpay_payment_id, p_razorpay_order_id,
    CURRENT_DATE, CURRENT_DATE + p_duration_days,
    CASE WHEN p_plan_type = 'monthly' THEN 999
         WHEN p_plan_type = 'annual' THEN 9999
         ELSE 0 END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.renew_trainer_subscription_webhook(
  p_subscription_id uuid,
  p_plan_type platform_plan_type,
  p_duration_days integer,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE trainer_platform_subscriptions
  SET status = 'active',
      payment_status = 'verified',
      razorpay_payment_id = p_razorpay_payment_id,
      razorpay_order_id = p_razorpay_order_id,
      plan_type = p_plan_type,
      start_date = CURRENT_DATE,
      end_date = CURRENT_DATE + p_duration_days,
      grace_end_date = NULL,
      amount = CASE WHEN p_plan_type = 'monthly' THEN 999
                    WHEN p_plan_type = 'annual' THEN 9999
                    ELSE amount END
  WHERE id = p_subscription_id;
END;
$function$;

-- ============================================================
-- PART 10: Migrate existing trial subscriptions to free
-- (extends end_date to 100 years out, keeps history)
-- ============================================================
UPDATE trainer_platform_subscriptions
SET plan_type = 'free',
    status = 'active',
    end_date = CURRENT_DATE + 36500,
    grace_end_date = NULL,
    amount = 0,
    payment_status = 'not_required'
WHERE plan_type = 'trial';
