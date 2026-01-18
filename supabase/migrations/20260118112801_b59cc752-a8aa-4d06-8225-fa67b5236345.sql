-- Step 1: Create new payment_info table for sensitive payment data
CREATE TABLE public.payment_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    vpa_address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Step 2: Enable RLS on the new table
ALTER TABLE public.payment_info ENABLE ROW LEVEL SECURITY;

-- Step 3: Create OWNER-ONLY RLS policies (trainers CANNOT access this data)
CREATE POLICY "Users can view own payment info"
ON public.payment_info
FOR SELECT
USING (profile_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Users can insert own payment info"
ON public.payment_info
FOR INSERT
WITH CHECK (profile_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Users can update own payment info"
ON public.payment_info
FOR UPDATE
USING (profile_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Payment info cannot be deleted directly"
ON public.payment_info
FOR DELETE
USING (false);

-- Step 4: Migrate existing vpa_address data to new table
INSERT INTO public.payment_info (profile_id, vpa_address)
SELECT id, vpa_address FROM public.profiles WHERE vpa_address IS NOT NULL;

-- Step 5: Add updated_at trigger for payment_info
CREATE TRIGGER update_payment_info_updated_at
BEFORE UPDATE ON public.payment_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Remove vpa_address column from profiles table
ALTER TABLE public.profiles DROP COLUMN vpa_address;