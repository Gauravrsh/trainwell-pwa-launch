-- Fix 2: Add subscription check to trainer exercise policies

-- UPDATE: Drop and recreate with subscription check
DROP POLICY IF EXISTS "Users can update exercises for accessible workouts" ON public.exercises;
CREATE POLICY "Users can update exercises for accessible workouts"
ON public.exercises FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (
      (w.client_id = get_user_profile_id(auth.uid()))
      OR (is_trainer_of_client(auth.uid(), w.client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())))
    )
  )
);

-- INSERT: Drop and recreate with subscription check
DROP POLICY IF EXISTS "Users can insert exercises for accessible workouts" ON public.exercises;
CREATE POLICY "Users can insert exercises for accessible workouts"
ON public.exercises FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (
      (w.client_id = get_user_profile_id(auth.uid()))
      OR (is_trainer_of_client(auth.uid(), w.client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())))
    )
  )
);

-- DELETE: Drop and recreate with subscription check
DROP POLICY IF EXISTS "Users can delete exercises for accessible workouts" ON public.exercises;
CREATE POLICY "Users can delete exercises for accessible workouts"
ON public.exercises FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (
      (w.client_id = get_user_profile_id(auth.uid()))
      OR (is_trainer_of_client(auth.uid(), w.client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())))
    )
  )
);
