-- Add subscription checks to trainer INSERT/UPDATE/DELETE policies
-- Trainers must have active subscription to write data

-- ===== WORKOUTS =====
DROP POLICY IF EXISTS "Trainers can insert client workouts" ON public.workouts;
CREATE POLICY "Trainers can insert client workouts"
ON public.workouts FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can update client workouts" ON public.workouts;
CREATE POLICY "Trainers can update client workouts"
ON public.workouts FOR UPDATE
TO public
USING (
  (auth.uid() IS NOT NULL)
  AND is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can delete client workouts" ON public.workouts;
CREATE POLICY "Trainers can delete client workouts"
ON public.workouts FOR DELETE
TO public
USING (
  (auth.uid() IS NOT NULL)
  AND is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

-- ===== FOOD_LOGS =====
DROP POLICY IF EXISTS "Trainers can insert client food logs" ON public.food_logs;
CREATE POLICY "Trainers can insert client food logs"
ON public.food_logs FOR INSERT
TO public
WITH CHECK (
  is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can update client food logs" ON public.food_logs;
CREATE POLICY "Trainers can update client food logs"
ON public.food_logs FOR UPDATE
TO public
USING (
  is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can delete client food logs" ON public.food_logs;
CREATE POLICY "Trainers can delete client food logs"
ON public.food_logs FOR DELETE
TO public
USING (
  is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

-- ===== CLIENT_TRAINING_PLANS =====
DROP POLICY IF EXISTS "Trainers can insert training plans" ON public.client_training_plans;
CREATE POLICY "Trainers can insert training plans"
ON public.client_training_plans FOR INSERT
TO public
WITH CHECK (
  (trainer_id = get_user_profile_id(auth.uid()))
  AND is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can update training plans" ON public.client_training_plans;
CREATE POLICY "Trainers can update training plans"
ON public.client_training_plans FOR UPDATE
TO public
USING (
  (trainer_id = get_user_profile_id(auth.uid()))
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Trainers can delete draft training plans" ON public.client_training_plans;
CREATE POLICY "Trainers can delete draft training plans"
ON public.client_training_plans FOR DELETE
TO public
USING (
  (trainer_id = get_user_profile_id(auth.uid()))
  AND (status = 'draft'::training_plan_status)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);

-- ===== PROFILES (trainer updating client) =====
DROP POLICY IF EXISTS "Trainers can update their clients" ON public.profiles;
CREATE POLICY "Trainers can update their clients"
ON public.profiles FOR UPDATE
TO public
USING (
  is_trainer_of_client(auth.uid(), id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);