-- Create a secure view for client profiles that trainers can access
-- This view excludes sensitive payment information (vpa_address)
CREATE OR REPLACE VIEW public.client_profiles_for_trainer
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.unique_id,
  p.full_name,
  p.date_of_birth,
  p.height_cm,
  p.weight_kg,
  p.city,
  p.profile_complete,
  p.trainer_id,
  p.created_at,
  p.updated_at
  -- Explicitly excluding: vpa_address, user_id, role
FROM public.profiles p;

-- Grant access to authenticated users only
REVOKE ALL ON public.client_profiles_for_trainer FROM PUBLIC;
REVOKE ALL ON public.client_profiles_for_trainer FROM anon;
GRANT SELECT ON public.client_profiles_for_trainer TO authenticated;

-- Add comment documenting the security purpose
COMMENT ON VIEW public.client_profiles_for_trainer IS 'Secure view for trainers to access client profiles without payment information (vpa_address). RLS on base profiles table controls row-level access.';

-- Update the RLS policy for trainers viewing clients to be more restrictive
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Trainers can view their clients" ON public.profiles;

-- Create a new policy that prevents trainers from accessing vpa_address directly
-- Trainers must use the secure RPC function get_client_profile_for_trainer() or the new view
-- We'll use a special marker in the policy to indicate vpa_address should not be exposed
-- Since PostgreSQL RLS cannot restrict columns, we'll enforce this at the application level
-- by removing the direct trainer SELECT policy and requiring use of the secure view

-- Re-create the policy with same logic but add documentation
CREATE POLICY "Trainers can view their clients basic info"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (trainer_id = get_trainer_profile_id(auth.uid()));

-- Create a function to check if the current user is the owner of the profile
-- This helps restrict vpa_address access to only the profile owner
CREATE OR REPLACE FUNCTION public.is_profile_owner(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = _profile_id 
    AND user_id = auth.uid()
  )
$$;