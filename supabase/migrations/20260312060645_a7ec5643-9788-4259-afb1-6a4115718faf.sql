-- Update has_active_platform_subscription to exclude pending_payment
CREATE OR REPLACE FUNCTION public.has_active_platform_subscription(_trainer_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trainer_platform_subscriptions
    WHERE trainer_id = _trainer_profile_id
    AND (
      status IN ('trial', 'active')
      OR (status = 'grace' AND grace_end_date >= CURRENT_DATE)
    )
  )
$$;

-- Update get_trainer_subscription_status to handle pending_payment
CREATE OR REPLACE FUNCTION public.get_trainer_subscription_status(_trainer_profile_id uuid)
 RETURNS TABLE(subscription_id uuid, plan_type platform_plan_type, status platform_subscription_status, end_date date, grace_end_date date, days_remaining integer, is_read_only boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tps.id,
    tps.plan_type,
    tps.status,
    tps.end_date,
    tps.grace_end_date,
    (tps.end_date - CURRENT_DATE)::integer,
    CASE 
      WHEN tps.status = 'expired' THEN true
      WHEN tps.status = 'pending_payment' THEN true
      WHEN tps.status = 'grace' AND tps.grace_end_date < CURRENT_DATE THEN true
      ELSE false
    END
  FROM trainer_platform_subscriptions tps
  WHERE tps.trainer_id = _trainer_profile_id
  ORDER BY tps.created_at DESC
  LIMIT 1;
END;
$$;