-- Auto-provision free Smart plan for every new trainer
CREATE OR REPLACE FUNCTION public.auto_provision_trainer_free_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'trainer'::user_role THEN
    INSERT INTO public.trainer_platform_subscriptions (
      trainer_id, plan_type, status, amount,
      start_date, end_date, grace_end_date,
      is_trial_used, trial_clients_count, max_trial_clients,
      payment_status
    )
    SELECT
      NEW.id, 'free', 'active', 0,
      CURRENT_DATE, CURRENT_DATE + 36500, NULL,
      false, 0, 3,
      'not_required'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.trainer_platform_subscriptions
      WHERE trainer_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_provision_trainer_free_plan ON public.profiles;
CREATE TRIGGER trg_auto_provision_trainer_free_plan
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_trainer_free_plan();

-- Backfill: any existing trainer without a subscription row gets a free plan
INSERT INTO public.trainer_platform_subscriptions (
  trainer_id, plan_type, status, amount,
  start_date, end_date, grace_end_date,
  is_trial_used, trial_clients_count, max_trial_clients,
  payment_status
)
SELECT
  p.id, 'free', 'active', 0,
  CURRENT_DATE, CURRENT_DATE + 36500, NULL,
  false, 0, 3,
  'not_required'
FROM public.profiles p
WHERE p.role = 'trainer'::user_role
  AND NOT EXISTS (
    SELECT 1 FROM public.trainer_platform_subscriptions tps
    WHERE tps.trainer_id = p.id
  );