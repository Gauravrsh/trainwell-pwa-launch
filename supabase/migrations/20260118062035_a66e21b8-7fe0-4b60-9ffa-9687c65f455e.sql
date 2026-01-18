-- Fix: Replace the client_profiles_for_trainer VIEW with a secure RPC and remove the view entirely.
-- Reason: Automated scanners treat the view like a table and require RLS, which cannot be applied to views.
-- This change preserves app behavior while removing the repeatedly-flagged surface area.

-- 1) Create an RPC that returns trainer-accessible client fields (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_trainer_clients()
RETURNS TABLE(
  id uuid,
  unique_id text,
  full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.unique_id, p.full_name
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.trainer_id = public.get_trainer_profile_id(auth.uid());
$$;

COMMENT ON FUNCTION public.get_trainer_clients() IS 'Returns the authenticated trainer client list with non-sensitive fields only (id, unique_id, full_name). Used to avoid exposing client PII via views flagged by scanners.';

-- 2) Remove the view that is repeatedly flagged as missing RLS
DROP VIEW IF EXISTS public.client_profiles_for_trainer;