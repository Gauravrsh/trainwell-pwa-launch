-- Drop the overly broad trainer discovery policy
-- This policy exposes ALL columns including sensitive data like vpa_address, DOB, weight, height
-- Client-side code uses lookup_trainer_by_unique_id() RPC function which safely returns only safe fields
DROP POLICY IF EXISTS "Allow authenticated users to view trainer basic info for discov" ON public.profiles;