-- Create enum for platform subscription status
CREATE TYPE platform_subscription_status AS ENUM ('trial', 'active', 'grace', 'expired', 'cancelled');

-- Create enum for platform subscription plan type
CREATE TYPE platform_plan_type AS ENUM ('trial', 'monthly', 'annual');

-- Create enum for training plan status
CREATE TYPE training_plan_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Create enum for billing model
CREATE TYPE billing_model AS ENUM ('prepaid', 'postpaid');

-- Create enum for service type
CREATE TYPE service_type AS ENUM ('workout', 'nutrition', 'both');

-- Create enum for session status
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled');

-- =====================================================
-- TABLE: trainer_platform_subscriptions
-- Tracks trainer subscriptions to TrainWell platform
-- =====================================================
CREATE TABLE public.trainer_platform_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type platform_plan_type NOT NULL DEFAULT 'trial',
  status platform_subscription_status NOT NULL DEFAULT 'trial',
  
  -- Pricing
  amount NUMERIC DEFAULT 0,
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  grace_end_date DATE, -- 3 days after end_date
  
  -- Trial specific
  is_trial_used BOOLEAN DEFAULT false,
  trial_clients_count INTEGER DEFAULT 0,
  max_trial_clients INTEGER DEFAULT 3,
  
  -- Payment tracking (for future Razorpay integration)
  payment_status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_plan_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_trial_clients CHECK (trial_clients_count <= max_trial_clients)
);

-- =====================================================
-- TABLE: client_training_plans
-- Tracks training plans between trainers and clients
-- =====================================================
CREATE TABLE public.client_training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Plan configuration
  plan_name TEXT NOT NULL,
  service_type service_type NOT NULL DEFAULT 'both',
  billing_model billing_model NOT NULL DEFAULT 'prepaid',
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Sessions
  total_sessions INTEGER NOT NULL,
  completed_sessions INTEGER DEFAULT 0,
  missed_sessions INTEGER DEFAULT 0,
  
  -- Pricing
  total_amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  amount_due NUMERIC GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  
  -- Status
  status training_plan_status NOT NULL DEFAULT 'draft',
  
  -- Termination tracking (whichever concludes first)
  terminated_by TEXT, -- 'duration' or 'sessions'
  termination_date DATE,
  
  -- Trainer notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_plan_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_sessions CHECK (completed_sessions + missed_sessions <= total_sessions)
);

-- =====================================================
-- TABLE: plan_sessions
-- Tracks individual sessions within a training plan
-- =====================================================
CREATE TABLE public.plan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.client_training_plans(id) ON DELETE CASCADE,
  
  -- Session details
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL,
  
  -- Status tracking
  status session_status NOT NULL DEFAULT 'scheduled',
  
  -- Linking to actual logs
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  food_log_id UUID REFERENCES public.food_logs(id) ON DELETE SET NULL,
  
  -- Notes
  trainer_notes TEXT,
  client_notes TEXT,
  reschedule_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.trainer_platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: trainer_platform_subscriptions
-- =====================================================

-- Trainers can view their own subscriptions
CREATE POLICY "Trainers can view own subscriptions"
ON public.trainer_platform_subscriptions
FOR SELECT
USING (trainer_id = get_user_profile_id(auth.uid()));

-- Trainers can insert their own subscriptions
CREATE POLICY "Trainers can insert own subscriptions"
ON public.trainer_platform_subscriptions
FOR INSERT
WITH CHECK (trainer_id = get_user_profile_id(auth.uid()));

-- Trainers can update their own subscriptions
CREATE POLICY "Trainers can update own subscriptions"
ON public.trainer_platform_subscriptions
FOR UPDATE
USING (trainer_id = get_user_profile_id(auth.uid()));

-- =====================================================
-- RLS POLICIES: client_training_plans
-- =====================================================

-- Trainers can view plans they created
CREATE POLICY "Trainers can view own training plans"
ON public.client_training_plans
FOR SELECT
USING (trainer_id = get_user_profile_id(auth.uid()));

-- Clients can view their own training plans
CREATE POLICY "Clients can view own training plans"
ON public.client_training_plans
FOR SELECT
USING (client_id = get_user_profile_id(auth.uid()));

-- Trainers can insert training plans for their clients
CREATE POLICY "Trainers can insert training plans"
ON public.client_training_plans
FOR INSERT
WITH CHECK (
  trainer_id = get_user_profile_id(auth.uid()) 
  AND is_trainer_of_client(auth.uid(), client_id)
);

-- Trainers can update their training plans
CREATE POLICY "Trainers can update training plans"
ON public.client_training_plans
FOR UPDATE
USING (trainer_id = get_user_profile_id(auth.uid()));

-- Trainers can delete draft training plans
CREATE POLICY "Trainers can delete draft training plans"
ON public.client_training_plans
FOR DELETE
USING (
  trainer_id = get_user_profile_id(auth.uid()) 
  AND status = 'draft'
);

-- =====================================================
-- RLS POLICIES: plan_sessions
-- =====================================================

-- Trainers can view sessions for their plans
CREATE POLICY "Trainers can view plan sessions"
ON public.plan_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.trainer_id = get_user_profile_id(auth.uid())
  )
);

-- Clients can view their plan sessions
CREATE POLICY "Clients can view own plan sessions"
ON public.plan_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.client_id = get_user_profile_id(auth.uid())
  )
);

-- Trainers can insert sessions
CREATE POLICY "Trainers can insert plan sessions"
ON public.plan_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.trainer_id = get_user_profile_id(auth.uid())
  )
);

-- Trainers can update sessions
CREATE POLICY "Trainers can update plan sessions"
ON public.plan_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.trainer_id = get_user_profile_id(auth.uid())
  )
);

-- Clients can update session status (for marking completion)
CREATE POLICY "Clients can update session status"
ON public.plan_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.client_id = get_user_profile_id(auth.uid())
  )
);

-- Trainers can delete sessions
CREATE POLICY "Trainers can delete plan sessions"
ON public.plan_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM client_training_plans ctp
    WHERE ctp.id = plan_sessions.plan_id
    AND ctp.trainer_id = get_user_profile_id(auth.uid())
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_trainer_subscriptions_updated_at
BEFORE UPDATE ON public.trainer_platform_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_training_plans_updated_at
BEFORE UPDATE ON public.client_training_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_sessions_updated_at
BEFORE UPDATE ON public.plan_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION: Check if trainer has active subscription
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_active_platform_subscription(_trainer_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trainer_platform_subscriptions
    WHERE trainer_id = _trainer_profile_id
    AND (
      status IN ('trial', 'active')
      OR (status = 'grace' AND grace_end_date >= CURRENT_DATE)
    )
  )
$$;

-- =====================================================
-- HELPER FUNCTION: Get trainer subscription status
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_trainer_subscription_status(_trainer_profile_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  plan_type platform_plan_type,
  status platform_subscription_status,
  end_date date,
  grace_end_date date,
  days_remaining integer,
  is_read_only boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tps.id,
    tps.plan_type,
    tps.status,
    tps.end_date,
    tps.grace_end_date,
    (tps.end_date - CURRENT_DATE)::integer,
    CASE 
      WHEN tps.status = 'expired' THEN true
      WHEN tps.status = 'grace' AND tps.grace_end_date < CURRENT_DATE THEN true
      ELSE false
    END
  FROM trainer_platform_subscriptions tps
  WHERE tps.trainer_id = _trainer_profile_id
  ORDER BY tps.created_at DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_trainer_subscriptions_trainer_id ON public.trainer_platform_subscriptions(trainer_id);
CREATE INDEX idx_trainer_subscriptions_status ON public.trainer_platform_subscriptions(status);
CREATE INDEX idx_client_training_plans_trainer_id ON public.client_training_plans(trainer_id);
CREATE INDEX idx_client_training_plans_client_id ON public.client_training_plans(client_id);
CREATE INDEX idx_client_training_plans_status ON public.client_training_plans(status);
CREATE INDEX idx_plan_sessions_plan_id ON public.plan_sessions(plan_id);
CREATE INDEX idx_plan_sessions_date ON public.plan_sessions(session_date);