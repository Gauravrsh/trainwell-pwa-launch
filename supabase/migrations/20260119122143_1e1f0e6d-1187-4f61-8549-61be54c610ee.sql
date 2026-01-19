-- Fix ambiguous column reference in get_trainer_referral_stats function
CREATE OR REPLACE FUNCTION public.get_trainer_referral_stats(p_trainer_id uuid)
 RETURNS TABLE(total_referrals integer, completed_referrals integer, pending_referrals integer, total_days_earned integer, days_remaining integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'completed'),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'pending'),
    COALESCE((SELECT SUM(tve.days_credited)::integer FROM trainer_validity_extensions tve WHERE tve.trainer_id = p_trainer_id), 0),
    COALESCE((SELECT SUM(tve.days_remaining)::integer FROM trainer_validity_extensions tve WHERE tve.trainer_id = p_trainer_id), 0);
END;
$$;