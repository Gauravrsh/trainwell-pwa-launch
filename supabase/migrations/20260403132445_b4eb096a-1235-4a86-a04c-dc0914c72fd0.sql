-- Fix 1: Add subscription enforcement to plan_sessions trainer write policies

DROP POLICY IF EXISTS "Trainers can insert plan sessions" ON public.plan_sessions;
CREATE POLICY "Trainers can insert plan sessions"
ON public.plan_sessions FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
      AND ctp.trainer_id = get_user_profile_id(auth.uid())
      AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Trainers can update plan sessions" ON public.plan_sessions;
CREATE POLICY "Trainers can update plan sessions"
ON public.plan_sessions FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
      AND ctp.trainer_id = get_user_profile_id(auth.uid())
      AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Trainers can delete plan sessions" ON public.plan_sessions;
CREATE POLICY "Trainers can delete plan sessions"
ON public.plan_sessions FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
      AND ctp.trainer_id = get_user_profile_id(auth.uid())
      AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  )
);