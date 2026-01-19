-- Add referral tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_trainer_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS last_activity_date date DEFAULT CURRENT_DATE;

-- Create trainer_referrals table to track referral relationships
CREATE TABLE public.trainer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  referrer_plan_at_reward platform_plan_type,
  referee_plan_at_reward platform_plan_type,
  reward_days integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  rewarded_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referee_id)
);

-- Create trainer_validity_extensions table to track validity credits from referrals
CREATE TABLE public.trainer_validity_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES public.profiles(id),
  source text NOT NULL CHECK (source IN ('referral', 'bonus', 'promotion')),
  referral_id uuid REFERENCES public.trainer_referrals(id),
  days_credited integer NOT NULL DEFAULT 0,
  days_remaining integer NOT NULL DEFAULT 0,
  days_deducted integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.trainer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_validity_extensions ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainer_referrals
CREATE POLICY "Trainers can view referrals where they are referrer"
ON public.trainer_referrals FOR SELECT
USING (referrer_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Trainers can view referrals where they are referee"
ON public.trainer_referrals FOR SELECT
USING (referee_id = get_user_profile_id(auth.uid()));

CREATE POLICY "System can insert referrals"
ON public.trainer_referrals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update referrals"
ON public.trainer_referrals FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS policies for trainer_validity_extensions
CREATE POLICY "Trainers can view own validity extensions"
ON public.trainer_validity_extensions FOR SELECT
USING (trainer_id = get_user_profile_id(auth.uid()));

CREATE POLICY "System can insert validity extensions"
ON public.trainer_validity_extensions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update validity extensions"
ON public.trainer_validity_extensions FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Function to calculate referral reward days based on the matrix
CREATE OR REPLACE FUNCTION public.calculate_referral_reward(
  p_referrer_plan platform_plan_type,
  p_referee_plan platform_plan_type
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Referral Benefit Matrix:
  -- Monthly + Monthly = 15 days
  -- Monthly + Annual = 30 days
  -- Annual + Monthly = 30 days
  -- Annual + Annual = 90 days (Elite)
  
  IF p_referrer_plan = 'annual' AND p_referee_plan = 'annual' THEN
    RETURN 90;
  ELSIF p_referrer_plan = 'annual' AND p_referee_plan = 'monthly' THEN
    RETURN 30;
  ELSIF p_referrer_plan = 'monthly' AND p_referee_plan = 'annual' THEN
    RETURN 30;
  ELSIF p_referrer_plan = 'monthly' AND p_referee_plan = 'monthly' THEN
    RETURN 15;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- Function to apply referral reward to referrer
CREATE OR REPLACE FUNCTION public.apply_referral_reward(
  p_referral_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_plan platform_plan_type;
  v_referee_plan platform_plan_type;
  v_reward_days integer;
  v_referrer_sub_id uuid;
BEGIN
  -- Get referral details
  SELECT tr.referrer_id, tr.referrer_plan_at_reward, tr.referee_plan_at_reward
  INTO v_referrer_id, v_referrer_plan, v_referee_plan
  FROM trainer_referrals tr
  WHERE tr.id = p_referral_id AND tr.status = 'pending';
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
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

-- Function to get total referral stats for a trainer
CREATE OR REPLACE FUNCTION public.get_trainer_referral_stats(p_trainer_id uuid)
RETURNS TABLE(
  total_referrals integer,
  completed_referrals integer,
  pending_referrals integer,
  total_days_earned integer,
  days_remaining integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'completed'),
    (SELECT COUNT(*)::integer FROM trainer_referrals WHERE referrer_id = p_trainer_id AND status = 'pending'),
    COALESCE((SELECT SUM(days_credited)::integer FROM trainer_validity_extensions WHERE trainer_id = p_trainer_id), 0),
    COALESCE((SELECT SUM(days_remaining)::integer FROM trainer_validity_extensions WHERE trainer_id = p_trainer_id), 0);
END;
$$;

-- Function to update last activity date (called when trainer interacts with client)
CREATE OR REPLACE FUNCTION public.update_trainer_activity(p_trainer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET last_activity_date = CURRENT_DATE
  WHERE id = p_trainer_id AND role = 'trainer';
END;
$$;

-- Trigger to update last_activity_date on workouts insert/update
CREATE OR REPLACE FUNCTION public.trigger_update_trainer_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trainer_id uuid;
BEGIN
  -- Get the trainer for this client
  SELECT trainer_id INTO v_trainer_id
  FROM profiles
  WHERE id = NEW.client_id;
  
  IF v_trainer_id IS NOT NULL THEN
    PERFORM update_trainer_activity(v_trainer_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_trainer_activity_on_workout
AFTER INSERT OR UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trainer_activity();

-- Trigger for food_logs activity
CREATE TRIGGER update_trainer_activity_on_food_log
AFTER INSERT OR UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trainer_activity();

-- Trigger for payments activity
CREATE OR REPLACE FUNCTION public.trigger_update_trainer_activity_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
  v_trainer_id uuid;
BEGIN
  -- Get client from subscription cycle
  SELECT sc.client_id INTO v_client_id
  FROM subscription_cycles sc
  WHERE sc.id = NEW.subscription_cycle_id;
  
  IF v_client_id IS NOT NULL THEN
    SELECT trainer_id INTO v_trainer_id
    FROM profiles
    WHERE id = v_client_id;
    
    IF v_trainer_id IS NOT NULL THEN
      PERFORM update_trainer_activity(v_trainer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_trainer_activity_on_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_trainer_activity_on_payment();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_trainer_referrals_updated_at
BEFORE UPDATE ON public.trainer_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_validity_extensions_updated_at
BEFORE UPDATE ON public.trainer_validity_extensions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();