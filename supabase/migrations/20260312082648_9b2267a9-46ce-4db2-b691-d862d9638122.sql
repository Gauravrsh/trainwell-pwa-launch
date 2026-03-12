
-- Fix: Prevent trainers from changing client's role via UPDATE
DROP POLICY IF EXISTS "Trainers can update their clients" ON public.profiles;
CREATE POLICY "Trainers can update their clients"
ON public.profiles FOR UPDATE TO public
USING (
  is_trainer_of_client(auth.uid(), id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
)
WITH CHECK (
  is_trainer_of_client(auth.uid(), id)
  AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = profiles.id)
);
