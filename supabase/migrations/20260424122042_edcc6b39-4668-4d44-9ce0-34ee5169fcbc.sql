-- Add metric_type enum-like text column + new exercise fields
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS metric_type text NOT NULL DEFAULT 'reps_weight',
  ADD COLUMN IF NOT EXISTS recommended_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS actual_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS recommended_distance_meters numeric,
  ADD COLUMN IF NOT EXISTS actual_distance_meters numeric,
  ADD COLUMN IF NOT EXISTS recommended_rounds integer,
  ADD COLUMN IF NOT EXISTS actual_rounds integer,
  ADD COLUMN IF NOT EXISTS recommended_emom_minutes integer,
  ADD COLUMN IF NOT EXISTS actual_emom_minutes integer;

-- Restrict metric_type values
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_metric_type_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_metric_type_check
  CHECK (metric_type IN ('reps_weight','reps_only','time','distance_time','amrap','emom'));

-- Add quantity fields to food_logs
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS quantity_value numeric,
  ADD COLUMN IF NOT EXISTS quantity_unit text;

-- Extend the validate_text_lengths trigger to validate quantity_unit
CREATE OR REPLACE FUNCTION public.validate_text_lengths()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cert text;
  v_spec text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'exercises' THEN
      IF length(NEW.exercise_name) > 200 THEN
        RAISE EXCEPTION 'Exercise name must be 200 characters or less';
      END IF;
    WHEN 'food_logs' THEN
      IF NEW.raw_text IS NOT NULL AND length(NEW.raw_text) > 2000 THEN
        RAISE EXCEPTION 'Food log text must be 2000 characters or less';
      END IF;
      IF NEW.quantity_unit IS NOT NULL AND length(NEW.quantity_unit) > 30 THEN
        RAISE EXCEPTION 'Quantity unit must be 30 characters or less';
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
      IF NEW.bio IS NOT NULL AND length(NEW.bio) > 500 THEN
        RAISE EXCEPTION 'Bio must be 500 characters or less';
      END IF;
      IF NEW.avatar_url IS NOT NULL AND length(NEW.avatar_url) > 500 THEN
        RAISE EXCEPTION 'Avatar URL must be 500 characters or less';
      END IF;
      IF NEW.certifications IS NOT NULL THEN
        IF array_length(NEW.certifications, 1) > 10 THEN
          RAISE EXCEPTION 'A maximum of 10 certifications is allowed';
        END IF;
        FOREACH v_cert IN ARRAY NEW.certifications LOOP
          IF length(v_cert) > 100 THEN
            RAISE EXCEPTION 'Each certification must be 100 characters or less';
          END IF;
        END LOOP;
      END IF;
      IF NEW.specializations IS NOT NULL THEN
        IF array_length(NEW.specializations, 1) > 10 THEN
          RAISE EXCEPTION 'A maximum of 10 specializations is allowed';
        END IF;
        FOREACH v_spec IN ARRAY NEW.specializations LOOP
          IF length(v_spec) > 50 THEN
            RAISE EXCEPTION 'Each specialization must be 50 characters or less';
          END IF;
        END LOOP;
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
$function$;