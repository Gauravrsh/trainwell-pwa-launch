-- Fitness PWA Supabase Schema for TrainWell

-- Enums
CREATE TYPE user_role AS ENUM ('trainer', 'client');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE workout_status AS ENUM ('completed', 'skipped', 'pending');
CREATE TYPE subscription_status AS ENUM ('active', 'pending_renewal', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Profiles table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    unique_id TEXT NOT NULL UNIQUE,
    trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    vpa_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX idx_profiles_trainer_id ON profiles(trainer_id);
CREATE INDEX idx_profiles_unique_id ON profiles(unique_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Workouts table
CREATE TABLE workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status workout_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date)
);

-- Exercises table
CREATE TABLE exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    recommended_sets INTEGER,
    recommended_reps INTEGER,
    recommended_weight DECIMAL(5,2),
    actual_sets INTEGER,
    actual_reps INTEGER,
    actual_weight DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food logs table
CREATE TABLE food_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    meal_type meal_type NOT NULL,
    raw_text TEXT,
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    logged_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription cycles table
CREATE TABLE subscription_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status subscription_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_cycle_id UUID REFERENCES subscription_cycles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    payment_status payment_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for foreign keys and performance
CREATE INDEX idx_workouts_client_id ON workouts(client_id);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX idx_food_logs_client_id ON food_logs(client_id);
CREATE INDEX idx_food_logs_date ON food_logs(logged_date);
CREATE INDEX idx_subscription_cycles_client_id ON subscription_cycles(client_id);
CREATE INDEX idx_payments_subscription_cycle_id ON payments(subscription_cycle_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_of_client(_trainer_user_id uuid, _client_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = _client_profile_id 
    AND trainer_id = (SELECT id FROM profiles WHERE user_id = _trainer_user_id AND role = 'trainer')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_trainer_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = _user_id AND role = 'trainer' LIMIT 1
$$;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients" ON profiles
FOR SELECT USING (
  trainer_id = public.get_trainer_profile_id(auth.uid())
);

CREATE POLICY "Anyone can lookup trainer by unique_id" ON profiles
FOR SELECT USING (role = 'trainer');

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update their clients" ON profiles
FOR UPDATE USING (
  public.is_trainer_of_client(auth.uid(), id)
);

-- RLS Policies for Workouts
CREATE POLICY "Clients can view own workouts" ON workouts
FOR SELECT USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can view client workouts" ON workouts
FOR SELECT USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Clients can insert own workouts" ON workouts
FOR INSERT WITH CHECK (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can insert client workouts" ON workouts
FOR INSERT WITH CHECK (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Clients can update own workouts" ON workouts
FOR UPDATE USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can update client workouts" ON workouts
FOR UPDATE USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

-- RLS Policies for Exercises
CREATE POLICY "Users can view exercises for accessible workouts" ON exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (w.client_id = public.get_user_profile_id(auth.uid()) 
         OR public.is_trainer_of_client(auth.uid(), w.client_id))
  )
);

CREATE POLICY "Users can insert exercises for accessible workouts" ON exercises
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_id
    AND (w.client_id = public.get_user_profile_id(auth.uid()) 
         OR public.is_trainer_of_client(auth.uid(), w.client_id))
  )
);

CREATE POLICY "Users can update exercises for accessible workouts" ON exercises
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (w.client_id = public.get_user_profile_id(auth.uid()) 
         OR public.is_trainer_of_client(auth.uid(), w.client_id))
  )
);

-- RLS Policies for Food Logs
CREATE POLICY "Clients can view own food logs" ON food_logs
FOR SELECT USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can view client food logs" ON food_logs
FOR SELECT USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Clients can insert own food logs" ON food_logs
FOR INSERT WITH CHECK (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can insert client food logs" ON food_logs
FOR INSERT WITH CHECK (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Clients can update own food logs" ON food_logs
FOR UPDATE USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can update client food logs" ON food_logs
FOR UPDATE USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

-- RLS Policies for Subscription Cycles
CREATE POLICY "Clients can view own subscription cycles" ON subscription_cycles
FOR SELECT USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can view client subscription cycles" ON subscription_cycles
FOR SELECT USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Trainers can insert client subscription cycles" ON subscription_cycles
FOR INSERT WITH CHECK (
  public.is_trainer_of_client(auth.uid(), client_id)
);

CREATE POLICY "Trainers can update client subscription cycles" ON subscription_cycles
FOR UPDATE USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

-- RLS Policies for Payments
CREATE POLICY "Clients can view own payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = payments.subscription_cycle_id
    AND sc.client_id = public.get_user_profile_id(auth.uid())
  )
);

CREATE POLICY "Trainers can view client payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = payments.subscription_cycle_id
    AND public.is_trainer_of_client(auth.uid(), sc.client_id)
  )
);

CREATE POLICY "Trainers can insert client payments" ON payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = subscription_cycle_id
    AND public.is_trainer_of_client(auth.uid(), sc.client_id)
  )
);

CREATE POLICY "Trainers can update client payments" ON payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM subscription_cycles sc
    WHERE sc.id = payments.subscription_cycle_id
    AND public.is_trainer_of_client(auth.uid(), sc.client_id)
  )
);

-- Function to generate unique ID
CREATE OR REPLACE FUNCTION generate_unique_id(p_role user_role)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_length INTEGER := CASE WHEN p_role = 'trainer' THEN 6 ELSE 7 END;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        new_id := LPAD(FLOOR(RANDOM() * POWER(10, id_length))::TEXT, id_length, '0');
        
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE unique_id = new_id) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique ID after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, role, unique_id)
    VALUES (
        NEW.id,
        'client',
        generate_unique_id('client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_logs_updated_at
    BEFORE UPDATE ON food_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_cycles_updated_at
    BEFORE UPDATE ON subscription_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate trainer-client relationship
CREATE OR REPLACE FUNCTION validate_trainer_client_relationship()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trainer_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = NEW.trainer_id
            AND profiles.role = 'trainer'
        ) THEN
            RAISE EXCEPTION 'Referenced trainer_id must belong to a user with trainer role';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to validate trainer-client relationship
CREATE TRIGGER validate_trainer_client_relationship_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION validate_trainer_client_relationship();

-- Function to automatically set end_date for subscription cycles
CREATE OR REPLACE FUNCTION set_subscription_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NULL THEN
        NEW.end_date := NEW.start_date + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to set end_date
CREATE TRIGGER set_subscription_end_date_trigger
    BEFORE INSERT ON subscription_cycles
    FOR EACH ROW EXECUTE FUNCTION set_subscription_end_date();