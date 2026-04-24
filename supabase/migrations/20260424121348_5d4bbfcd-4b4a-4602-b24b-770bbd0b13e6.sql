-- ============================================================
-- Item 6: Trainer Profile fields + avatars storage bucket
-- ============================================================

-- 1) Extend profiles with optional trainer-facing fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}'::text[];

-- 2) Range check on years_experience (nullable allowed)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_years_experience_range;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_years_experience_range
  CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 60));

-- 3) Extend validate_text_lengths trigger to cover the new fields
CREATE OR REPLACE FUNCTION public.validate_text_lengths()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cert text;
  v_spec text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'exercises' THEN
      IF length(NEW.exercise_name) > 200 THEN
        RAISE EXCEPTION 'Exercise name must be 200 characters or less';
      END IF;
    WHEN 'food_logs' THEN
      IF NEW.raw_text IS NOT NULL AND length(NEW.raw_text) > 2000 THEN
        RAISE EXCEPTION 'Food log text must be 2000 characters or less';
      END IF;
    WHEN 'client_training_plans' THEN
      IF length(NEW.plan_name) > 200 THEN
        RAISE EXCEPTION 'Plan name must be 200 characters or less';
      END IF;
      IF NEW.notes IS NOT NULL AND length(NEW.notes) > 5000 THEN
        RAISE EXCEPTION 'Notes must be 5000 characters or less';
      END IF;
    WHEN 'profiles' THEN
      IF NEW.full_name IS NOT NULL AND length(NEW.full_name) > 200 THEN
        RAISE EXCEPTION 'Full name must be 200 characters or less';
      END IF;
      IF NEW.city IS NOT NULL AND length(NEW.city) > 100 THEN
        RAISE EXCEPTION 'City must be 100 characters or less';
      END IF;
      IF NEW.bio IS NOT NULL AND length(NEW.bio) > 500 THEN
        RAISE EXCEPTION 'Bio must be 500 characters or less';
      END IF;
      IF NEW.avatar_url IS NOT NULL AND length(NEW.avatar_url) > 500 THEN
        RAISE EXCEPTION 'Avatar URL must be 500 characters or less';
      END IF;
      IF NEW.certifications IS NOT NULL THEN
        IF array_length(NEW.certifications, 1) > 10 THEN
          RAISE EXCEPTION 'A maximum of 10 certifications is allowed';
        END IF;
        FOREACH v_cert IN ARRAY NEW.certifications LOOP
          IF length(v_cert) > 100 THEN
            RAISE EXCEPTION 'Each certification must be 100 characters or less';
          END IF;
        END LOOP;
      END IF;
      IF NEW.specializations IS NOT NULL THEN
        IF array_length(NEW.specializations, 1) > 10 THEN
          RAISE EXCEPTION 'A maximum of 10 specializations is allowed';
        END IF;
        FOREACH v_spec IN ARRAY NEW.specializations LOOP
          IF length(v_spec) > 50 THEN
            RAISE EXCEPTION 'Each specialization must be 50 characters or less';
          END IF;
        END LOOP;
      END IF;
    WHEN 'plan_sessions' THEN
      IF NEW.trainer_notes IS NOT NULL AND length(NEW.trainer_notes) > 2000 THEN
        RAISE EXCEPTION 'Trainer notes must be 2000 characters or less';
      END IF;
      IF NEW.client_notes IS NOT NULL AND length(NEW.client_notes) > 2000 THEN
        RAISE EXCEPTION 'Client notes must be 2000 characters or less';
      END IF;
      IF NEW.reschedule_reason IS NOT NULL AND length(NEW.reschedule_reason) > 500 THEN
        RAISE EXCEPTION 'Reschedule reason must be 500 characters or less';
      END IF;
  END CASE;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on profiles (idempotent)
DROP TRIGGER IF EXISTS validate_profiles_text_lengths ON public.profiles;
CREATE TRIGGER validate_profiles_text_lengths
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_text_lengths();

-- ============================================================
-- 4) Avatars storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars are publicly readable (so client can see trainer photo without auth gymnastics)
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload only into their own folder (folder name = auth.uid())
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- 5) Public-read RPC for clients to view their trainer's profile
--    (Avoids broadening profiles RLS. Returns only public-safe fields.)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_trainer_profile()
RETURNS TABLE(
  id uuid,
  unique_id text,
  full_name text,
  city text,
  whatsapp_no text,
  avatar_url text,
  years_experience integer,
  bio text,
  certifications text[],
  specializations text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trainer_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Find the calling client's mapped trainer
  SELECT p.trainer_id INTO v_trainer_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  IF v_trainer_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.unique_id,
    t.full_name,
    t.city,
    t.whatsapp_no,
    t.avatar_url,
    t.years_experience,
    t.bio,
    t.certifications,
    t.specializations
  FROM public.profiles t
  WHERE t.id = v_trainer_id
    AND t.role = 'trainer'::user_role;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_trainer_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_trainer_profile() TO authenticated;