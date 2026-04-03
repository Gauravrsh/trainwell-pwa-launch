-- Fix 2: Tighten trainer_referrals INSERT policy to validate referrer_id

DROP POLICY IF EXISTS "Referees can insert their own referral record" ON public.trainer_referrals;
CREATE POLICY "Referees can insert their own referral record"
ON public.trainer_referrals FOR INSERT
TO public
WITH CHECK (
  referee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM profiles WHERE id = referrer_id AND role = 'trainer')
  AND referrer_id <> referee_id
);