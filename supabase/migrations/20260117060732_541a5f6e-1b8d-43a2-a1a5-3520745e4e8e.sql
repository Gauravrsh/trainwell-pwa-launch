-- Fix: prevent exposing trainer UPI/VPA to all authenticated users via broad profiles SELECT policy

-- 1) Remove the overly-broad trainer lookup policy (if present)
DROP POLICY IF EXISTS "Authenticated users can lookup trainers" ON public.profiles;

-- 2) Ensure trainer lookup happens through a safe view that excludes vpa_address
--    Use default view security (no security_invoker) so the view does not depend on base-table SELECT policies.
--    Also require authentication so unauthenticated callers get zero rows.
CREATE OR REPLACE VIEW public.trainers_public AS
  SELECT
    id,
    unique_id,
    role,
    created_at
  FROM public.profiles
  WHERE role = 'trainer'::public.user_role
    AND auth.uid() IS NOT NULL;

-- 3) Restrict view permissions to authenticated users only
REVOKE ALL ON public.trainers_public FROM anon;
REVOKE ALL ON public.trainers_public FROM authenticated;
GRANT SELECT ON public.trainers_public TO authenticated;
