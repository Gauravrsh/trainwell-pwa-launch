-- Create a public view for trainer lookup that excludes sensitive VPA address
CREATE VIEW public.trainers_public
WITH (security_invoker = on) AS
SELECT id, unique_id, role, created_at
FROM public.profiles
WHERE role = 'trainer';

-- Drop the overly permissive trainer lookup policy
DROP POLICY IF EXISTS "Authenticated users can lookup trainers" ON public.profiles;

-- Create a more restrictive policy - users can only lookup trainers by unique_id through the view
-- The base table policy for trainers is no longer needed since we use the view