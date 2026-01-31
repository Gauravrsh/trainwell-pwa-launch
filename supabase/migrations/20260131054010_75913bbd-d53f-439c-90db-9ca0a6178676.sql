-- Add BMR columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bmr INTEGER CHECK (bmr > 0 AND bmr <= 10000);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bmr_updated_at TIMESTAMPTZ DEFAULT now();

-- Add calories_burnt to workouts
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS calories_burnt INTEGER CHECK (calories_burnt >= 0 AND calories_burnt <= 50000);

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 500),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, logged_date)
);

-- RLS Policies for weight_logs
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own weight logs
CREATE POLICY "Clients can view own weight logs" ON weight_logs
  FOR SELECT USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can insert own weight logs" ON weight_logs
  FOR INSERT WITH CHECK (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can update own weight logs" ON weight_logs
  FOR UPDATE USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can delete own weight logs" ON weight_logs
  FOR DELETE USING (client_id = get_user_profile_id(auth.uid()));

-- Trainers can view their clients' weight logs
CREATE POLICY "Trainers can view client weight logs" ON weight_logs
  FOR SELECT USING (is_trainer_of_client(auth.uid(), client_id));