-- Create trainer_notifications table for subscription expiry notifications
CREATE TABLE public.trainer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'subscription_expiry',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  day_offset INTEGER NOT NULL,
  cta_text TEXT DEFAULT 'Select Plan',
  cta_action TEXT DEFAULT 'open_plan_selection',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  scheduled_for DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate notifications for the same day offset
  UNIQUE(trainer_id, notification_type, day_offset, scheduled_for)
);

-- Enable RLS
ALTER TABLE public.trainer_notifications ENABLE ROW LEVEL SECURITY;

-- Trainers can view their own notifications
CREATE POLICY "Trainers can view own notifications"
ON public.trainer_notifications
FOR SELECT
USING (trainer_id = get_user_profile_id(auth.uid()));

-- Trainers can update their own notifications (mark as read/dismissed)
CREATE POLICY "Trainers can update own notifications"
ON public.trainer_notifications
FOR UPDATE
USING (trainer_id = get_user_profile_id(auth.uid()));

-- Only system can insert notifications (via edge function with service role)
CREATE POLICY "System inserts notifications"
ON public.trainer_notifications
FOR INSERT
WITH CHECK (false);

-- Notifications cannot be deleted
CREATE POLICY "Notifications cannot be deleted"
ON public.trainer_notifications
FOR DELETE
USING (false);

-- Create index for efficient queries
CREATE INDEX idx_trainer_notifications_trainer_scheduled
ON public.trainer_notifications(trainer_id, scheduled_for DESC);

CREATE INDEX idx_trainer_notifications_unread
ON public.trainer_notifications(trainer_id, is_read, is_dismissed)
WHERE is_read = FALSE AND is_dismissed = FALSE;

-- Create push_subscriptions table for PWA push notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(profile_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own push subscriptions
CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (profile_id = get_user_profile_id(auth.uid()));

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (profile_id = get_user_profile_id(auth.uid()));

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (profile_id = get_user_profile_id(auth.uid()));

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (profile_id = get_user_profile_id(auth.uid()));

-- Create index for profile lookup
CREATE INDEX idx_push_subscriptions_profile
ON public.push_subscriptions(profile_id);

-- Add trigger for updated_at on trainer_notifications
CREATE TRIGGER update_trainer_notifications_updated_at
BEFORE UPDATE ON public.trainer_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();