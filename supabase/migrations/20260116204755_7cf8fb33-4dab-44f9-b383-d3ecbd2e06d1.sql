-- Fix workouts table: Add explicit auth checks to all policies
DROP POLICY IF EXISTS "Clients can view own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Clients can insert own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Clients can update own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Clients can delete own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Trainers can view client workouts" ON public.workouts;
DROP POLICY IF EXISTS "Trainers can insert client workouts" ON public.workouts;
DROP POLICY IF EXISTS "Trainers can update client workouts" ON public.workouts;
DROP POLICY IF EXISTS "Trainers can delete client workouts" ON public.workouts;

-- Recreate with explicit auth checks
CREATE POLICY "Clients can view own workouts" ON public.workouts
FOR SELECT USING (auth.uid() IS NOT NULL AND client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can insert own workouts" ON public.workouts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can update own workouts" ON public.workouts
FOR UPDATE USING (auth.uid() IS NOT NULL AND client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can delete own workouts" ON public.workouts
FOR DELETE USING (auth.uid() IS NOT NULL AND client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Trainers can view client workouts" ON public.workouts
FOR SELECT USING (auth.uid() IS NOT NULL AND is_trainer_of_client(auth.uid(), client_id));

CREATE POLICY "Trainers can insert client workouts" ON public.workouts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND is_trainer_of_client(auth.uid(), client_id));

CREATE POLICY "Trainers can update client workouts" ON public.workouts
FOR UPDATE USING (auth.uid() IS NOT NULL AND is_trainer_of_client(auth.uid(), client_id));

CREATE POLICY "Trainers can delete client workouts" ON public.workouts
FOR DELETE USING (auth.uid() IS NOT NULL AND is_trainer_of_client(auth.uid(), client_id));

-- Fix payments table: Recreate policies as PERMISSIVE with explicit auth checks
DROP POLICY IF EXISTS "Authenticated clients can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated trainers can view client payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers can insert client payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers can update client payments" ON public.payments;
DROP POLICY IF EXISTS "Payment records cannot be deleted" ON public.payments;

-- Recreate as PERMISSIVE policies (default) with explicit auth checks
CREATE POLICY "Clients can view own payments" ON public.payments
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM subscription_cycles sc
  WHERE sc.id = payments.subscription_cycle_id 
  AND sc.client_id = get_user_profile_id(auth.uid())
));

CREATE POLICY "Trainers can view client payments" ON public.payments
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM subscription_cycles sc
  WHERE sc.id = payments.subscription_cycle_id 
  AND is_trainer_of_client(auth.uid(), sc.client_id)
));

CREATE POLICY "Trainers can insert client payments" ON public.payments
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM subscription_cycles sc
  WHERE sc.id = payments.subscription_cycle_id 
  AND is_trainer_of_client(auth.uid(), sc.client_id)
));

CREATE POLICY "Trainers can update client payments" ON public.payments
FOR UPDATE USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM subscription_cycles sc
  WHERE sc.id = payments.subscription_cycle_id 
  AND is_trainer_of_client(auth.uid(), sc.client_id)
));

CREATE POLICY "Payment records cannot be deleted" ON public.payments
FOR DELETE USING (false);