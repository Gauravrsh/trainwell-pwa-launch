-- Drop the overly broad policy that allows any authenticated user to read all payment info
DROP POLICY IF EXISTS "Require authentication for payment info" ON payment_info;

-- The existing "Users can view own payment info" policy correctly restricts access to owner only