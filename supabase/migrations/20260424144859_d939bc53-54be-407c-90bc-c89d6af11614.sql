-- Restrict avatars bucket SELECT to owner OR the mapped trainer of the requesting client.
-- Previously: any authenticated user could read any avatar.

DROP POLICY IF EXISTS "Avatars readable by authenticated users" ON storage.objects;

-- Owners can read their own avatar (path = <auth-uid>/...)
CREATE POLICY "Users can read their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Clients can read the avatar of their mapped trainer.
-- Trainer avatars live at <trainer_auth_uid>/..., and a client's profiles.trainer_id
-- references the trainer's profiles.id (not auth uid). We resolve via a join.
CREATE POLICY "Clients can read their trainer's avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles client_p
    JOIN public.profiles trainer_p
      ON trainer_p.id = client_p.trainer_id
     AND trainer_p.role = 'trainer'::public.user_role
    WHERE client_p.user_id = auth.uid()
      AND (trainer_p.user_id)::text = (storage.foldername(name))[1]
  )
);

-- Trainers can read their mapped clients' avatars (parity — clients may upload avatars too).
CREATE POLICY "Trainers can read their clients' avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles trainer_p
    JOIN public.profiles client_p
      ON client_p.trainer_id = trainer_p.id
    WHERE trainer_p.user_id = auth.uid()
      AND trainer_p.role = 'trainer'::public.user_role
      AND (client_p.user_id)::text = (storage.foldername(name))[1]
  )
);