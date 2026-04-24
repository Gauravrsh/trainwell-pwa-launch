-- Fix linter: "Public Bucket Allows Listing"
-- Replace the broad public-read policy with an authenticated-read policy.
-- Avatars remain accessible via direct URL for any signed-in user (which
-- includes all mapped clients), but no anonymous bulk listing is allowed.

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;

CREATE POLICY "Avatars readable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Flip the bucket to non-public so anon can't bypass via getPublicUrl.
-- We'll use createSignedUrl on the client side; signed URLs work regardless.
UPDATE storage.buckets SET public = false WHERE id = 'avatars';