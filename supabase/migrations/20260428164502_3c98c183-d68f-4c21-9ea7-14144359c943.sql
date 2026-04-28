-- Fix 1: Make avatars bucket private. Code already uses createSignedUrl.
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop any legacy public-read policies on avatars
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- Allow only authenticated users to read avatars (signed URLs still work via service role)
DROP POLICY IF EXISTS "Authenticated can read avatars" ON storage.objects;
CREATE POLICY "Authenticated can read avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Fix 2a: update_trainer_activity — restrict so callers can only mark themselves,
-- OR allow when invoked from a trigger context where the caller is the client of that trainer.
CREATE OR REPLACE FUNCTION public.update_trainer_activity(p_trainer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile uuid;
  v_caller_trainer uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_caller_profile := get_user_profile_id(auth.uid());

  -- Allowed if: caller IS the trainer, OR caller is a client mapped to this trainer
  SELECT trainer_id INTO v_caller_trainer FROM profiles WHERE id = v_caller_profile;

  IF v_caller_profile = p_trainer_id OR v_caller_trainer = p_trainer_id THEN
    UPDATE profiles
    SET last_activity_date = CURRENT_DATE
    WHERE id = p_trainer_id AND role = 'trainer';
  ELSE
    RAISE EXCEPTION 'Unauthorized: cannot update activity for another trainer';
  END IF;
END;
$function$;

-- Fix 2b: get_active_client_count — allow only the trainer themself to query their count
CREATE OR REPLACE FUNCTION public.get_active_client_count(p_trainer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_profile_owner(p_trainer_id) THEN
    RAISE EXCEPTION 'Unauthorized: not your profile';
  END IF;

  RETURN (
    SELECT COUNT(DISTINCT client_id)::integer
    FROM client_training_plans
    WHERE trainer_id = p_trainer_id
      AND status = 'active'
  );
END;
$function$;