
-- Fix 1: Drop orphaned permissive INSERT/UPDATE policies on trainer_validity_extensions
DROP POLICY IF EXISTS "System can insert validity extensions" ON public.trainer_validity_extensions;
DROP POLICY IF EXISTS "System can update validity extensions" ON public.trainer_validity_extensions;

-- Fix 2: Add ownership checks to get_trainer_referral_stats
CREATE OR REPLACE FUNCTION public.get_trainer_referral_stats(p_trainer_id uuid)
 RETURNS TABLE(total_referrals integer, completed_referrals integer, pending_referrals integer, total_days_earned integer, days_remaining integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify caller owns this profile
  IF NOT is_profile_owner(p_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'completed'),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'pending'),
    COALESCE((SELECT SUM(tve.days_credited)::integer FROM trainer_validity_extensions tve WHERE tve.trainer_id = p_trainer_id), 0),
    COALESCE((SELECT SUM(tve.days_remaining)::integer FROM trainer_validity_extensions tve WHERE tve.trainer_id = p_trainer_id), 0);
END;
$function$;

-- Fix 3: Add ownership checks to get_trainer_subscription_status
CREATE OR REPLACE FUNCTION public.get_trainer_subscription_status(_trainer_profile_id uuid)
 RETURNS TABLE(subscription_id uuid, plan_type platform_plan_type, status platform_subscription_status, end_date date, grace_end_date date, days_remaining integer, is_read_only boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify caller owns this profile
  IF NOT is_profile_owner(_trainer_profile_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;

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
$function$;
