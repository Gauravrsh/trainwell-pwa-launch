-- Fix 1: Add authorization check to apply_referral_reward function
-- Only the referrer or referee can trigger their own referral reward
CREATE OR REPLACE FUNCTION public.apply_referral_reward(p_referral_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_referee_id uuid;
  v_caller_profile_id uuid;
  v_referrer_plan platform_plan_type;
  v_referee_plan platform_plan_type;
  v_reward_days integer;
  v_referrer_sub_id uuid;
BEGIN
  -- Get caller's profile ID for authorization
  v_caller_profile_id := get_user_profile_id(auth.uid());
  
  IF v_caller_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get referral details
  SELECT tr.referrer_id, tr.referee_id, tr.referrer_plan_at_reward, tr.referee_plan_at_reward
  INTO v_referrer_id, v_referee_id, v_referrer_plan, v_referee_plan
  FROM trainer_referrals tr
  WHERE tr.id = p_referral_id AND tr.status = 'pending';
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- AUTHORIZATION CHECK: Only referrer or referee can trigger their referral reward
  IF v_caller_profile_id != v_referrer_id AND v_caller_profile_id != v_referee_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only apply rewards for your own referrals';
  END IF;
  
  -- Calculate reward days
  v_reward_days := calculate_referral_reward(v_referrer_plan, v_referee_plan);
  
  IF v_reward_days = 0 THEN
    RETURN false;
  END IF;
  
  -- Get referrer's active subscription
  SELECT id INTO v_referrer_sub_id
  FROM trainer_platform_subscriptions
  WHERE trainer_id = v_referrer_id
    AND status IN ('active', 'trial', 'grace')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_referrer_sub_id IS NOT NULL THEN
    -- Extend the subscription end date
    UPDATE trainer_platform_subscriptions
    SET end_date = end_date + (v_reward_days || ' days')::interval
    WHERE id = v_referrer_sub_id;
  END IF;
  
  -- Record the validity extension
  INSERT INTO trainer_validity_extensions (
    trainer_id, source, referral_id, days_credited, days_remaining
  ) VALUES (
    v_referrer_id, 'referral', p_referral_id, v_reward_days, v_reward_days
  );
  
  -- Update referral status
  UPDATE trainer_referrals
  SET status = 'completed', 
      reward_days = v_reward_days,
      rewarded_at = now()
  WHERE id = p_referral_id;
  
  RETURN true;
END;
$$;

-- Fix 2: Add CHECK constraints for text field length validation
-- Using validation triggers instead of CHECK constraints for better flexibility

-- Create a validation function for text lengths
CREATE OR REPLACE FUNCTION public.validate_text_lengths()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate based on table name
  CASE TG_TABLE_NAME
    WHEN 'exercises' THEN
      IF length(NEW.exercise_name) > 200 THEN
        RAISE EXCEPTION 'Exercise name must be 200 characters or less';
      END IF;
    WHEN 'food_logs' THEN
      IF NEW.raw_text IS NOT NULL AND length(NEW.raw_text) > 2000 THEN
        RAISE EXCEPTION 'Food log text must be 2000 characters or less';
      END IF;
    WHEN 'client_training_plans' THEN
      IF length(NEW.plan_name) > 200 THEN
        RAISE EXCEPTION 'Plan name must be 200 characters or less';
      END IF;
      IF NEW.notes IS NOT NULL AND length(NEW.notes) > 5000 THEN
        RAISE EXCEPTION 'Notes must be 5000 characters or less';
      END IF;
    WHEN 'profiles' THEN
      IF NEW.full_name IS NOT NULL AND length(NEW.full_name) > 200 THEN
        RAISE EXCEPTION 'Full name must be 200 characters or less';
      END IF;
      IF NEW.city IS NOT NULL AND length(NEW.city) > 100 THEN
        RAISE EXCEPTION 'City must be 100 characters or less';
      END IF;
    WHEN 'plan_sessions' THEN
      IF NEW.trainer_notes IS NOT NULL AND length(NEW.trainer_notes) > 2000 THEN
        RAISE EXCEPTION 'Trainer notes must be 2000 characters or less';
      END IF;
      IF NEW.client_notes IS NOT NULL AND length(NEW.client_notes) > 2000 THEN
        RAISE EXCEPTION 'Client notes must be 2000 characters or less';
      END IF;
      IF NEW.reschedule_reason IS NOT NULL AND length(NEW.reschedule_reason) > 500 THEN
        RAISE EXCEPTION 'Reschedule reason must be 500 characters or less';
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create triggers for each table that needs validation
DROP TRIGGER IF EXISTS validate_exercises_text ON public.exercises;
CREATE TRIGGER validate_exercises_text
  BEFORE INSERT OR UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();

DROP TRIGGER IF EXISTS validate_food_logs_text ON public.food_logs;
CREATE TRIGGER validate_food_logs_text
  BEFORE INSERT OR UPDATE ON public.food_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();

DROP TRIGGER IF EXISTS validate_training_plans_text ON public.client_training_plans;
CREATE TRIGGER validate_training_plans_text
  BEFORE INSERT OR UPDATE ON public.client_training_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();

DROP TRIGGER IF EXISTS validate_profiles_text ON public.profiles;
CREATE TRIGGER validate_profiles_text
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();

DROP TRIGGER IF EXISTS validate_plan_sessions_text ON public.plan_sessions;
CREATE TRIGGER validate_plan_sessions_text
  BEFORE INSERT OR UPDATE ON public.plan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();