-- Remove the automatic profile creation trigger
-- This ensures users MUST go through role selection to create their profile

-- Drop the trigger that auto-creates profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function (no longer needed)
DROP FUNCTION IF EXISTS public.handle_new_user();