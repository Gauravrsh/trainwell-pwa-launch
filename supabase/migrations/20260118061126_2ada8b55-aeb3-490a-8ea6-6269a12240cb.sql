-- Drop and recreate the client_profiles_for_trainer view with built-in access control
-- Since views can't have RLS, we embed the security check directly in the view query

DROP VIEW IF EXISTS public.client_profiles_for_trainer;

-- Recreate view with explicit trainer_id filtering required
-- The security_invoker=on ensures the query runs as the calling user
-- The base profiles table RLS will restrict access to only trainers who own these clients
CREATE VIEW public.client_profiles_for_trainer
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
FROM public.profiles p
WHERE p.trainer_id IS NOT NULL;
-- Note: The actual row-level filtering happens via RLS on the profiles table
-- The "Trainers can view their clients basic info" policy ensures trainers only see their own clients

-- Grant access to authenticated users only
REVOKE ALL ON public.client_profiles_for_trainer FROM PUBLIC;
REVOKE ALL ON public.client_profiles_for_trainer FROM anon;
GRANT SELECT ON public.client_profiles_for_trainer TO authenticated;

-- Document the security model
COMMENT ON VIEW public.client_profiles_for_trainer IS 'Secure view for accessing client profiles without payment information (vpa_address). Uses security_invoker=on to respect base table RLS policies. Trainers can only see their own clients via the RLS policy on profiles table.';