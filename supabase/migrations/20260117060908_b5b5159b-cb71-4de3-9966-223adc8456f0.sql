-- IMPORTANT: The previous policy "Authenticated can lookup trainers via view" on profiles
-- still allows direct queries to profiles table exposing vpa_address.
-- We need to remove this policy and rely on the view only.

-- 1) Drop the problematic policy that exposes all trainer columns
DROP POLICY IF EXISTS "Authenticated can lookup trainers via view" ON public.profiles;

-- 2) Create the view WITHOUT security_invoker so it uses definer permissions
--    But since that causes linter warnings, we'll use security_invoker = on
--    and ensure base table access is properly restricted through existing policies
CREATE OR REPLACE VIEW public.trainers_public
WITH (security_invoker = on) AS
  SELECT
    id,
    unique_id,
    role,
    created_at
  FROM public.profiles
  WHERE role = 'trainer'::public.user_role;

-- The view with security_invoker relies on the caller's RLS permissions.
-- Without a specific trainer lookup policy on profiles, authenticated users
-- can only see trainers if they match existing policies:
-- - "Users can view own profile" (user_id = auth.uid())
-- - "Trainers can view their clients" (trainer_id = their profile id)
-- 
-- This means the trainers_public view won't return results for arbitrary trainer lookups.
-- We need a SECURE way to allow trainer lookup without exposing vpa_address.

-- The solution: Use a SECURITY DEFINER function that returns only safe fields
CREATE OR REPLACE FUNCTION public.lookup_trainer_by_unique_id(p_unique_id text)
RETURNS TABLE(id uuid, unique_id text, role public.user_role, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.unique_id, p.role, p.created_at
  FROM public.profiles p
  WHERE p.unique_id = p_unique_id
    AND p.role = 'trainer'::public.user_role;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_trainer_by_unique_id(text) TO authenticated;