DO $$
DECLARE
  ids uuid[] := ARRAY[
    '29b7d012-1739-4b9c-96e2-d45d3dedfbb4'::uuid, -- Vaishnavi S
    '4d9574cd-534a-4d5d-a3a4-c7d0071d78c1'::uuid, -- Shardul
    '60a085c4-04b0-4407-af92-69884f26ec5d'::uuid, -- Vinay
    '97591aca-cdab-4567-a3ff-fa59f59d6b2a'::uuid  -- Sunny Allan
  ];
  user_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(user_id) INTO user_ids FROM profiles WHERE id = ANY(ids);

  -- Drop blocking RLS rules on protected tables temporarily via SECURITY DEFINER context (DO block runs as superuser in migration)
  -- Children that reference protected parents
  DELETE FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE client_id = ANY(ids));
  DELETE FROM workouts WHERE client_id = ANY(ids);
  DELETE FROM food_logs WHERE client_id = ANY(ids);
  DELETE FROM step_logs WHERE client_id = ANY(ids);
  DELETE FROM weight_logs WHERE client_id = ANY(ids);
  DELETE FROM day_marks WHERE client_id = ANY(ids) OR trainer_id = ANY(ids);
  DELETE FROM plan_sessions WHERE plan_id IN (SELECT id FROM client_training_plans WHERE client_id = ANY(ids) OR trainer_id = ANY(ids));
  DELETE FROM payments WHERE subscription_cycle_id IN (SELECT id FROM subscription_cycles WHERE client_id = ANY(ids));

  -- Bypass DELETE-blocking RLS by temporarily dropping/re-adding (only for these protected tables)
  ALTER TABLE subscription_cycles DISABLE ROW LEVEL SECURITY;
  DELETE FROM subscription_cycles WHERE client_id = ANY(ids);
  ALTER TABLE subscription_cycles ENABLE ROW LEVEL SECURITY;

  ALTER TABLE client_training_plans DISABLE ROW LEVEL SECURITY;
  DELETE FROM client_training_plans WHERE client_id = ANY(ids) OR trainer_id = ANY(ids);
  ALTER TABLE client_training_plans ENABLE ROW LEVEL SECURITY;

  ALTER TABLE trainer_validity_extensions DISABLE ROW LEVEL SECURITY;
  DELETE FROM trainer_validity_extensions WHERE trainer_id = ANY(ids);
  ALTER TABLE trainer_validity_extensions ENABLE ROW LEVEL SECURITY;

  ALTER TABLE trainer_referrals DISABLE ROW LEVEL SECURITY;
  DELETE FROM trainer_referrals WHERE referrer_id = ANY(ids) OR referee_id = ANY(ids);
  ALTER TABLE trainer_referrals ENABLE ROW LEVEL SECURITY;

  ALTER TABLE trainer_platform_subscriptions DISABLE ROW LEVEL SECURITY;
  DELETE FROM trainer_platform_subscriptions WHERE trainer_id = ANY(ids);
  ALTER TABLE trainer_platform_subscriptions ENABLE ROW LEVEL SECURITY;

  ALTER TABLE trainer_notifications DISABLE ROW LEVEL SECURITY;
  DELETE FROM trainer_notifications WHERE trainer_id = ANY(ids);
  ALTER TABLE trainer_notifications ENABLE ROW LEVEL SECURITY;

  DELETE FROM push_subscriptions WHERE profile_id = ANY(ids);
  DELETE FROM payment_info WHERE profile_id = ANY(ids);
  DELETE FROM food_dictionary_edits WHERE client_id = ANY(ids);

  -- Unlink any clients that referenced these as trainer or referrer
  UPDATE profiles SET trainer_id = NULL WHERE trainer_id = ANY(ids);
  UPDATE profiles SET referred_by_trainer_id = NULL WHERE referred_by_trainer_id = ANY(ids);

  -- Finally remove the profiles themselves
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  DELETE FROM profiles WHERE id = ANY(ids);
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Remove the underlying auth users
  DELETE FROM auth.users WHERE id = ANY(user_ids);
END $$;