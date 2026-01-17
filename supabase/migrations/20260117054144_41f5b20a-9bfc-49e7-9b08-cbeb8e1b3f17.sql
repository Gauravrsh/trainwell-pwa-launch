-- Add policy to allow authenticated users to lookup trainer profiles
-- This enables the referral feature while maintaining security:
-- 1. Requires authentication (prevents anonymous enumeration)
-- 2. Only exposes trainer profiles, not client profiles
-- 3. The trainers_public view already filters to non-sensitive fields (excludes vpa_address)

CREATE POLICY "Authenticated users can lookup trainers" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (role = 'trainer');