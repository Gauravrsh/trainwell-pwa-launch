-- Fix 1: Prevent users from self-mutating their trainer_id
-- Drop and recreate the "Users can update own profile" policy with trainer_id lock

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id)
  AND (role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid()))
  AND (trainer_id IS NOT DISTINCT FROM (SELECT p.trainer_id FROM profiles p WHERE p.user_id = auth.uid()))
);
