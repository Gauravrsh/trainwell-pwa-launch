-- Secure the trainers_public view by restricting access to authenticated users only
-- This is a view, not a table, so we use GRANT/REVOKE instead of RLS policies

-- Revoke all access from public and anon roles
REVOKE ALL ON public.trainers_public FROM PUBLIC;
REVOKE ALL ON public.trainers_public FROM anon;

-- Grant SELECT access only to authenticated users
GRANT SELECT ON public.trainers_public TO authenticated;

-- Document this security decision
COMMENT ON VIEW public.trainers_public IS 'Public view of trainer profiles for discovery. Access restricted to authenticated users only via GRANT permissions.';