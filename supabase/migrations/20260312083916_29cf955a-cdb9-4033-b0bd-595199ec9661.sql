
-- Revoke public execute access on webhook-only RPC functions
-- These are only called by the razorpay-webhook edge function using the service role key
REVOKE EXECUTE ON FUNCTION public.renew_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.renew_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.create_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_trainer_subscription_webhook(uuid, platform_plan_type, integer, text, text) FROM anon;
