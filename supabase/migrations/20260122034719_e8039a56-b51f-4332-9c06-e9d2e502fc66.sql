-- Add unique constraint on user_id to prevent duplicate profiles
-- This is the root cause of the infinite loop - without this constraint,
-- each render was creating a new profile row

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);