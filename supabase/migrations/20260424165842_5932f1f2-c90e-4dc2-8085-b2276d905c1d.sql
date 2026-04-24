-- Finding 2: Use role-filtered get_trainer_profile_id() for trainer-only policies

-- trainer_notifications
DROP POLICY IF EXISTS "Trainers can view own notifications" ON public.trainer_notifications;
CREATE POLICY "Trainers can view own notifications"
ON public.trainer_notifications
FOR SELECT
USING (trainer_id = public.get_trainer_profile_id(auth.uid()));

DROP POLICY IF EXISTS "Trainers can update own notifications" ON public.trainer_notifications;
CREATE POLICY "Trainers can update own notifications"
ON public.trainer_notifications
FOR UPDATE
TO authenticated
USING (trainer_id = public.get_trainer_profile_id(auth.uid()));

-- Finding 1: Replace misleading "System inserts notifications" policy with explicit deny
DROP POLICY IF EXISTS "System inserts notifications" ON public.trainer_notifications;
CREATE POLICY "Deny client inserts to trainer_notifications"
ON public.trainer_notifications
FOR INSERT
TO public
WITH CHECK (false);

-- trainer_platform_subscriptions
DROP POLICY IF EXISTS "Trainers can view own subscriptions" ON public.trainer_platform_subscriptions;
CREATE POLICY "Trainers can view own subscriptions"
ON public.trainer_platform_subscriptions
FOR SELECT
USING (trainer_id = public.get_trainer_profile_id(auth.uid()));

-- trainer_validity_extensions
DROP POLICY IF EXISTS "Trainers can view own validity extensions" ON public.trainer_validity_extensions;
CREATE POLICY "Trainers can view own validity extensions"
ON public.trainer_validity_extensions
FOR SELECT
USING (trainer_id = public.get_trainer_profile_id(auth.uid()));