
-- Add profile fields for user onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.height_cm IS 'Height in centimeters (for clients only)';
COMMENT ON COLUMN public.profiles.weight_kg IS 'Weight in kilograms (for clients only)';
COMMENT ON COLUMN public.profiles.profile_complete IS 'Whether user has completed profile setup';
