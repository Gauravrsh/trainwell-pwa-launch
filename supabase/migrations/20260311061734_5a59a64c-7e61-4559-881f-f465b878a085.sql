-- Block anonymous (unauthenticated) SELECT on profiles
CREATE POLICY "Require authentication for profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- Block anonymous (unauthenticated) SELECT on payment_info
CREATE POLICY "Require authentication for payment_info"
ON public.payment_info FOR SELECT
TO anon
USING (false);