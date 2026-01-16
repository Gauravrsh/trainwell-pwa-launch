-- Fix: Explicitly deny public unauthenticated access to sensitive tables

-- Food logs: Require authentication for all access
CREATE POLICY "Require auth for food logs" ON food_logs
FOR SELECT USING (auth.uid() IS NOT NULL AND (
  client_id = public.get_user_profile_id(auth.uid())
  OR public.is_trainer_of_client(auth.uid(), client_id)
));

-- Drop the old overly permissive policies
DROP POLICY IF EXISTS "Clients can view own food logs" ON food_logs;
DROP POLICY IF EXISTS "Trainers can view client food logs" ON food_logs;

-- Payments: Already has proper policies, but add explicit auth check
-- Drop and recreate with auth requirement
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;
DROP POLICY IF EXISTS "Trainers can view client payments" ON payments;

CREATE POLICY "Authenticated clients can view own payments" ON payments
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = payments.subscription_cycle_id
    AND sc.client_id = public.get_user_profile_id(auth.uid())
  )
);

CREATE POLICY "Authenticated trainers can view client payments" ON payments
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = payments.subscription_cycle_id
    AND public.is_trainer_of_client(auth.uid(), sc.client_id)
  )
);