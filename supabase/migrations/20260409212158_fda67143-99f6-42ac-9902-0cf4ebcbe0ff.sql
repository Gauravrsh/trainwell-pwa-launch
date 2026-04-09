
-- Create step_logs table
CREATE TABLE public.step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  step_count integer NOT NULL DEFAULT 0,
  estimated_calories integer GENERATED ALWAYS AS (CAST(ROUND(step_count * 0.04) AS integer)) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, logged_date)
);

-- Enable RLS
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

-- Client policies
CREATE POLICY "Clients can view own step logs"
ON public.step_logs FOR SELECT
USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can insert own step logs"
ON public.step_logs FOR INSERT
WITH CHECK (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can update own step logs"
ON public.step_logs FOR UPDATE
USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can delete own step logs"
ON public.step_logs FOR DELETE
USING (client_id = get_user_profile_id(auth.uid()));

-- Trainer policies
CREATE POLICY "Trainers can view client step logs"
ON public.step_logs FOR SELECT
USING (is_trainer_of_client(auth.uid(), client_id));

CREATE POLICY "Trainers can insert client step logs"
ON public.step_logs FOR INSERT
WITH CHECK (is_trainer_of_client(auth.uid(), client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())));

CREATE POLICY "Trainers can update client step logs"
ON public.step_logs FOR UPDATE
USING (is_trainer_of_client(auth.uid(), client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())));

CREATE POLICY "Trainers can delete client step logs"
ON public.step_logs FOR DELETE
USING (is_trainer_of_client(auth.uid(), client_id) AND has_active_platform_subscription(get_user_profile_id(auth.uid())));

-- Timestamp trigger
CREATE TRIGGER update_step_logs_updated_at
BEFORE UPDATE ON public.step_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Text validation trigger (reuse existing function - step_count is numeric so mainly for future-proofing)
-- Add to validate_text_lengths if needed later
