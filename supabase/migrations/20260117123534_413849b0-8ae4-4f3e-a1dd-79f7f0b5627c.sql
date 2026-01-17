-- Fix 1: Recreate trainers_public view with security_invoker and add a proper policy
-- Drop existing view first
DROP VIEW IF EXISTS public.trainers_public;

-- Recreate view with security_invoker = on
CREATE VIEW public.trainers_public
WITH (security_invoker = on) AS
  SELECT id, unique_id, role, created_at
  FROM public.profiles
  WHERE role = 'trainer';

-- Add a permissive policy to allow public read of trainer basic info
-- This is specifically for trainer discovery (clients finding trainers by unique_id)
CREATE POLICY "Allow authenticated users to view trainer basic info for discovery"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'trainer');

-- Fix 2: Create a function to get client profile without sensitive data
-- This will be used by trainers instead of direct table access
CREATE OR REPLACE FUNCTION public.get_client_profile_for_trainer(_client_profile_id uuid)
RETURNS TABLE(
  id uuid,
  unique_id text,
  full_name text,
  date_of_birth date,
  height_cm numeric,
  weight_kg numeric,
  city text,
  profile_complete boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify the caller is the trainer of this client
  IF NOT is_trainer_of_client(auth.uid(), _client_profile_id) THEN
    RAISE EXCEPTION 'Access denied: not the trainer of this client';
  END IF;
  
  -- Return client profile WITHOUT vpa_address
  RETURN QUERY
  SELECT 
    p.id,
    p.unique_id,
    p.full_name,
    p.date_of_birth,
    p.height_cm,
    p.weight_kg,
    p.city,
    p.profile_complete,
    p.created_at
  FROM public.profiles p
  WHERE p.id = _client_profile_id;
END;
$$;