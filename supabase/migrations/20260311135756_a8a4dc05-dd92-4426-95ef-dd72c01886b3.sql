
-- Webhook-specific functions (called by service role, no auth.uid() check)
CREATE OR REPLACE FUNCTION public.renew_trainer_subscription_webhook(
  p_subscription_id uuid,
  p_plan_type platform_plan_type,
  p_duration_days integer,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE trainer_platform_subscriptions
  SET status = 'active',
      payment_status = 'verified',
      razorpay_payment_id = p_razorpay_payment_id,
      razorpay_order_id = p_razorpay_order_id,
      plan_type = p_plan_type,
      start_date = CURRENT_DATE,
      end_date = CURRENT_DATE + p_duration_days,
      grace_end_date = NULL
  WHERE id = p_subscription_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_trainer_subscription_webhook(
  p_trainer_id uuid,
  p_plan_type platform_plan_type,
  p_duration_days integer,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO trainer_platform_subscriptions (
    trainer_id, plan_type, status, payment_status,
    razorpay_payment_id, razorpay_order_id,
    start_date, end_date
  ) VALUES (
    p_trainer_id, p_plan_type, 'active', 'verified',
    p_razorpay_payment_id, p_razorpay_order_id,
    CURRENT_DATE, CURRENT_DATE + p_duration_days
  );
END;
$$;
