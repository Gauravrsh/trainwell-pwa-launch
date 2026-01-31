-- Fix security vulnerability: Add explicit authentication requirement for profiles table
-- Prevents unauthenticated access to sensitive user data (name, DOB, weight, city, BMR)
CREATE POLICY "Require authentication for profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix security vulnerability: Add explicit authentication requirement for payment_info table
-- Prevents unauthenticated access to sensitive VPA payment identifiers
CREATE POLICY "Require authentication for payment info"
ON payment_info FOR SELECT
USING (auth.uid() IS NOT NULL);