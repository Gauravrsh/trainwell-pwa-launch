-- Remove the overly permissive policy that exposes trainer payment addresses
-- The lookup_trainer_by_unique_id() RPC function provides secure trainer lookup
DROP POLICY IF EXISTS "Authenticated users can lookup trainers" ON public.profiles;