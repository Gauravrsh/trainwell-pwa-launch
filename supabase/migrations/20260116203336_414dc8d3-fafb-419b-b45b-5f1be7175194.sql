-- Fix: Require authentication for trainer lookup policy
DROP POLICY IF EXISTS "Anyone can lookup trainer by unique_id" ON profiles;

CREATE POLICY "Authenticated users can lookup trainers" ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND role = 'trainer'
);