-- Clean up any remaining permissive policies that weren't properly dropped
-- (The DROP IF EXISTS should have worked, but let's ensure clean state)

-- For trainer_referrals: Remove the old INSERT policy if it still exists
DROP POLICY IF EXISTS "System can insert referrals" ON public.trainer_referrals;

-- For trainer_validity_extensions: Remove old policies if they still exist  
DROP POLICY IF EXISTS "System can insert validity extensions" ON public.trainer_validity_extensions;
DROP POLICY IF EXISTS "System can update validity extensions" ON public.trainer_validity_extensions;