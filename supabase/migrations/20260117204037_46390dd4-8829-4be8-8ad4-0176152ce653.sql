-- Recreate the trainers_public view with SECURITY INVOKER off (definer mode)
-- This allows the view to access profiles data directly
-- The view only exposes safe fields: id, unique_id, role, created_at
-- No sensitive data like DOB, weight, height, VPA address, etc. is exposed

DROP VIEW IF EXISTS public.trainers_public;

CREATE VIEW public.trainers_public AS
  SELECT 
    id,
    unique_id,
    role,
    created_at
  FROM public.profiles
  WHERE role = 'trainer'::public.user_role;

-- Grant SELECT access to authenticated users
GRANT SELECT ON public.trainers_public TO authenticated;