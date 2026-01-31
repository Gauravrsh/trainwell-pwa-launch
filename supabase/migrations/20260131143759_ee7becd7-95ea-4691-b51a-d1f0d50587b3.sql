-- Fix 1: Remove the overly permissive "Require authentication for profiles" policy
-- This policy allows any authenticated user to read ALL profiles, which is a security vulnerability
-- The existing specific policies already provide appropriate access control:
-- - 'Users can view own profile' - users see their own data (auth.uid() = user_id)
-- - 'Trainers can view their clients basic info' - trainers see assigned clients

DROP POLICY IF EXISTS "Require authentication for profiles" ON profiles;