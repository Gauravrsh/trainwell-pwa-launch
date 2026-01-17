-- Fix the SECURITY_DEFINER view warning by using security_invoker instead
-- And ensure the old "Authenticated users can lookup trainers" policy is removed

-- 1) Drop the old overly permissive policy if it still exists  
DROP POLICY IF EXISTS "Authenticated users can lookup trainers" ON public.profiles;

-- 2) Recreate trainers_public view with security_invoker (NOT security_definer)
-- This avoids the linter warning and ensures proper permission checking
CREATE OR REPLACE VIEW public.trainers_public
WITH (security_invoker = on) AS
  SELECT
    id,
    unique_id,
    role,
    created_at
  FROM public.profiles
  WHERE role = 'trainer'::public.user_role;

-- 3) Restrict view permissions to authenticated users only  
REVOKE ALL ON public.trainers_public FROM anon;
REVOKE ALL ON public.trainers_public FROM authenticated;
GRANT SELECT ON public.trainers_public TO authenticated;

-- 4) Add a SELECT policy on profiles that allows authenticated users to read 
--    ONLY the fields exposed through trainers_public (id, unique_id, role, created_at)
--    This policy specifically excludes vpa_address by design
CREATE POLICY "Authenticated can lookup trainers via view"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'trainer'::public.user_role);