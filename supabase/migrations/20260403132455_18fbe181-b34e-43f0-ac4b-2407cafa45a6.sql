-- Fix 3: Add explicit DELETE deny policy to trainer_validity_extensions

CREATE POLICY "Validity extensions cannot be deleted"
ON public.trainer_validity_extensions FOR DELETE
TO public
USING (false);