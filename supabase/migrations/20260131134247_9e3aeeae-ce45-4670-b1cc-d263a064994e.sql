-- Drop the overly permissive policy that allows any authenticated user to view trainer profiles
-- This policy exposes trainer personal health metrics (weight, BMR, DOB, height) to all authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to view trainer basic info for discovery" ON profiles;

-- The secure RPC function lookup_trainer_by_unique_id() should be used instead
-- It only returns safe fields: id, unique_id, role, created_at