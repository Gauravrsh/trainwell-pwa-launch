-- FIX 1: Prevent role self-escalation
-- Add WITH CHECK that prevents changing the role column
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- FIX 2: Remove overly permissive referral INSERT/UPDATE policies
DROP POLICY IF EXISTS "System can insert referrals" ON public.trainer_referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.trainer_referrals;