
-- =====================================================================
-- TW-030: Auto-calculate calories burnt for workouts and steps
-- Pure DB engine. Zero frontend changes. Triggers + RPC for backfill.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Resolve a client's weight as of a given date.
--    Latest weight_logs row on/before the date, else profiles.weight_kg, else 70kg fallback.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_client_weight_on(_client_id uuid, _on_date date)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT weight_kg FROM public.weight_logs
       WHERE client_id = _client_id AND logged_date <= _on_date
       ORDER BY logged_date DESC LIMIT 1),
    (SELECT weight_kg FROM public.profiles WHERE id = _client_id),
    70
  )::numeric;
$$;

-- ---------------------------------------------------------------------
-- 2. MET lookup by exercise name (case-insensitive substring match).
--    Returns a sane MET value per ACSM compendium approximations.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.met_for_exercise(_name text, _metric_type text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  n text := lower(coalesce(_name, ''));
BEGIN
  -- Cardio / endurance
  IF n LIKE '%swim%' THEN RETURN 8.0;
  ELSIF n LIKE '%run%' OR n LIKE '%sprint%' OR n LIKE '%jog%' THEN RETURN 9.8;
  ELSIF n LIKE '%walk%' OR n LIKE '%treadmill%walk%' THEN RETURN 4.3;
  ELSIF n LIKE '%cycl%' OR n LIKE '%bike%' OR n LIKE '%spin%' THEN RETURN 7.5;
  ELSIF n LIKE '%row%' OR n LIKE '%erg%' THEN RETURN 7.0;
  ELSIF n LIKE '%jump rope%' OR n LIKE '%skipping%' OR n LIKE '%double under%' THEN RETURN 12.3;
  ELSIF n LIKE '%burpee%' OR n LIKE '%hiit%' OR n LIKE '%mountain climber%' THEN RETURN 8.0;
  ELSIF n LIKE '%elliptical%' OR n LIKE '%stair%' OR n LIKE '%climber%' THEN RETURN 7.0;
  ELSIF n LIKE '%boxing%' OR n LIKE '%kickbox%' OR n LIKE '%mma%' THEN RETURN 7.8;
  -- Mobility / stretch / yoga / hold
  ELSIF n LIKE '%yoga%' OR n LIKE '%stretch%' OR n LIKE '%mobility%'
        OR n LIKE '%tadasana%' OR n LIKE '%mountain pose%' THEN RETURN 2.5;
  ELSIF n LIKE '%plank%' OR n LIKE '%hold%' OR n LIKE '%dead hang%' THEN RETURN 3.5;
  -- Heavy compound lifts
  ELSIF n LIKE '%squat%' OR n LIKE '%deadlift%' OR n LIKE '%clean%'
        OR n LIKE '%snatch%' OR n LIKE '%jerk%' THEN RETURN 6.0;
  -- AMRAP / EMOM / circuit
  ELSIF _metric_type IN ('amrap', 'emom') THEN RETURN 8.0;
  -- General strength
  ELSIF _metric_type IN ('reps_weight', 'reps_only') THEN RETURN 5.0;
  -- Default
  ELSE RETURN 5.0;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. Estimate duration (in seconds) for a single exercise row given its
--    metric type and inputs. Used when actual duration isn't recorded.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.estimate_exercise_seconds(
  _name text,
  _metric_type text,
  _actual_sets integer,
  _actual_reps integer,
  _actual_duration_seconds integer,
  _actual_distance_meters numeric,
  _actual_rounds integer,
  _actual_emom_minutes integer
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  n text := lower(coalesce(_name, ''));
  pace_sec_per_meter numeric;
BEGIN
  CASE _metric_type
    WHEN 'time' THEN
      RETURN COALESCE(_actual_duration_seconds, 0);

    WHEN 'distance_time' THEN
      IF COALESCE(_actual_duration_seconds, 0) > 0 THEN
        RETURN _actual_duration_seconds;
      END IF;
      -- Infer time from distance using activity pace
      IF n LIKE '%swim%' THEN pace_sec_per_meter := 1.2;     -- 2:00 / 100m
      ELSIF n LIKE '%run%' OR n LIKE '%sprint%' OR n LIKE '%jog%' THEN pace_sec_per_meter := 0.36; -- 6:00 / km
      ELSIF n LIKE '%walk%' THEN pace_sec_per_meter := 0.72; -- 12:00 / km
      ELSIF n LIKE '%cycl%' OR n LIKE '%bike%' THEN pace_sec_per_meter := 0.18; -- 3:00 / km
      ELSIF n LIKE '%row%' THEN pace_sec_per_meter := 0.30; -- 5:00 / km
      ELSE pace_sec_per_meter := 0.36;
      END IF;
      RETURN GREATEST(0, ROUND(COALESCE(_actual_distance_meters, 0) * pace_sec_per_meter))::integer;

    WHEN 'reps_weight', 'reps_only' THEN
      -- Each exercises row represents one set in this app's schema.
      -- Approx: reps * 3s work + 30s rest.
      RETURN COALESCE(_actual_reps, 0) * 3 + 30;

    WHEN 'amrap' THEN
      RETURN COALESCE(_actual_emom_minutes, 0) * 60;

    WHEN 'emom' THEN
      RETURN COALESCE(_actual_emom_minutes, 0) * 60;

    ELSE
      RETURN 0;
  END CASE;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. Recompute and write workouts.calories_burnt for a single workout.
--    Sums MET×weight×hours across all completed exercise rows.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_workout_calories(_workout_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_date date;
  v_weight numeric;
  v_total_kcal numeric := 0;
  r record;
  v_seconds integer;
  v_met numeric;
BEGIN
  SELECT client_id, date INTO v_client_id, v_date
    FROM public.workouts WHERE id = _workout_id;
  IF v_client_id IS NULL THEN RETURN 0; END IF;

  v_weight := public.get_client_weight_on(v_client_id, v_date);

  FOR r IN
    SELECT exercise_name, metric_type,
           actual_sets, actual_reps, actual_duration_seconds,
           actual_distance_meters, actual_rounds, actual_emom_minutes
      FROM public.exercises WHERE workout_id = _workout_id
  LOOP
    v_seconds := public.estimate_exercise_seconds(
      r.exercise_name, COALESCE(r.metric_type, 'reps_weight'),
      r.actual_sets, r.actual_reps, r.actual_duration_seconds,
      r.actual_distance_meters, r.actual_rounds, r.actual_emom_minutes
    );
    IF v_seconds > 0 THEN
      v_met := public.met_for_exercise(r.exercise_name, COALESCE(r.metric_type, 'reps_weight'));
      v_total_kcal := v_total_kcal + (v_met * v_weight * (v_seconds::numeric / 3600.0));
    END IF;
  END LOOP;

  UPDATE public.workouts
     SET calories_burnt = ROUND(v_total_kcal)::integer,
         updated_at = now()
   WHERE id = _workout_id;

  RETURN ROUND(v_total_kcal)::integer;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. Triggers — exercises insert/update/delete recompute parent workout.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_exercises_recompute_kcal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_workout_calories(OLD.workout_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_workout_calories(NEW.workout_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS exercises_recompute_kcal ON public.exercises;
CREATE TRIGGER exercises_recompute_kcal
AFTER INSERT OR UPDATE OR DELETE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.trg_exercises_recompute_kcal();

-- Workout status change to/from completed also triggers recompute
CREATE OR REPLACE FUNCTION public.trg_workouts_recompute_kcal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.date IS DISTINCT FROM OLD.date THEN
    PERFORM public.recompute_workout_calories(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workouts_recompute_kcal ON public.workouts;
CREATE TRIGGER workouts_recompute_kcal
AFTER INSERT OR UPDATE OF date ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.trg_workouts_recompute_kcal();

-- ---------------------------------------------------------------------
-- 6. Step logs — weight-aware estimated_calories on insert/update.
--    Formula: kcal = round(weight_kg * 0.0005 * step_count)
--    (≈ 0.04 kcal/step at 80kg; scales linearly with body weight)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_step_logs_set_kcal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weight numeric;
BEGIN
  v_weight := public.get_client_weight_on(NEW.client_id, NEW.logged_date);
  NEW.estimated_calories := GREATEST(0, ROUND(v_weight * 0.0005 * COALESCE(NEW.step_count, 0)))::integer;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS step_logs_set_kcal ON public.step_logs;
CREATE TRIGGER step_logs_set_kcal
BEFORE INSERT OR UPDATE OF step_count, logged_date ON public.step_logs
FOR EACH ROW EXECUTE FUNCTION public.trg_step_logs_set_kcal();

-- ---------------------------------------------------------------------
-- 7. Backfill RPC — last 90 days, all users. Idempotent (uses recompute).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_calories_last_90_days()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workouts_updated integer := 0;
  v_steps_updated integer := 0;
  r record;
BEGIN
  -- Workouts
  FOR r IN
    SELECT id FROM public.workouts
     WHERE date >= (CURRENT_DATE - INTERVAL '90 days')::date
  LOOP
    PERFORM public.recompute_workout_calories(r.id);
    v_workouts_updated := v_workouts_updated + 1;
  END LOOP;

  -- Steps: re-trigger BEFORE-update by touching step_count to itself
  WITH updated AS (
    UPDATE public.step_logs
       SET step_count = step_count
     WHERE logged_date >= (CURRENT_DATE - INTERVAL '90 days')::date
     RETURNING 1
  )
  SELECT COUNT(*) INTO v_steps_updated FROM updated;

  RETURN jsonb_build_object(
    'workouts_updated', v_workouts_updated,
    'step_logs_updated', v_steps_updated,
    'window_days', 90,
    'as_of', now()
  );
END;
$$;

-- Lock down direct execution; only service role / admin invocation.
REVOKE ALL ON FUNCTION public.backfill_calories_last_90_days() FROM PUBLIC, anon, authenticated;
