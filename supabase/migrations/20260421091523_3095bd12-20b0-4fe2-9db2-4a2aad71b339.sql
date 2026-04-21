DROP POLICY IF EXISTS "Referees can insert their own referral record" ON public.trainer_referrals;

CREATE POLICY "Referees can insert their own referral record"
ON public.trainer_referrals
FOR INSERT
WITH CHECK (
  referee_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = trainer_referrals.referrer_id
      AND p.role = 'trainer'::public.user_role
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'trainer'::public.user_role
  )
  AND referrer_id <> referee_id
);