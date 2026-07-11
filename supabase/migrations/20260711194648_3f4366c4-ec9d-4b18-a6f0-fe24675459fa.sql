
CREATE OR REPLACE FUNCTION public.enforce_plan_sessions_client_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_trainer_id uuid;
BEGIN
  v_profile_id := public.get_user_profile_id(auth.uid());
  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ctp.trainer_id INTO v_trainer_id
  FROM public.client_training_plans ctp
  WHERE ctp.id = NEW.plan_id;

  -- Trainer (or service) making the change: allow.
  IF v_trainer_id = v_profile_id THEN
    RETURN NEW;
  END IF;

  -- Otherwise treat as client update: restrict to status and client_notes only.
  IF NEW.session_date IS DISTINCT FROM OLD.session_date
     OR NEW.session_number IS DISTINCT FROM OLD.session_number
     OR NEW.workout_id IS DISTINCT FROM OLD.workout_id
     OR NEW.food_log_id IS DISTINCT FROM OLD.food_log_id
     OR NEW.trainer_notes IS DISTINCT FROM OLD.trainer_notes
     OR NEW.reschedule_reason IS DISTINCT FROM OLD.reschedule_reason
     OR NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
    RAISE EXCEPTION 'Clients can only update status and client_notes on plan_sessions';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_sessions_client_columns_trg ON public.plan_sessions;
CREATE TRIGGER enforce_plan_sessions_client_columns_trg
BEFORE UPDATE ON public.plan_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_plan_sessions_client_columns();
