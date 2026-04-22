-- 1) trainer_notifications: scope INSERT and UPDATE policies to authenticated role
DROP POLICY IF EXISTS "System inserts notifications" ON public.trainer_notifications;
CREATE POLICY "System inserts notifications"
ON public.trainer_notifications
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Trainers can update own notifications" ON public.trainer_notifications;
CREATE POLICY "Trainers can update own notifications"
ON public.trainer_notifications
FOR UPDATE
TO authenticated
USING (trainer_id = get_user_profile_id(auth.uid()));

-- 2) day_marks: DELETE must also verify trainer-client relationship
DROP POLICY IF EXISTS "Trainers can delete client day marks" ON public.day_marks;
CREATE POLICY "Trainers can delete client day marks"
ON public.day_marks
FOR DELETE
TO authenticated
USING (
  trainer_id = get_user_profile_id(auth.uid())
  AND is_trainer_of_client(auth.uid(), client_id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
);