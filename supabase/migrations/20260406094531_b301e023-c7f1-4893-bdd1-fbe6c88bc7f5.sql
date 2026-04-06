
-- Step 1: Delete exercises linked to workouts of these profiles
DELETE FROM public.exercises
WHERE workout_id IN (
  SELECT id FROM public.workouts
  WHERE client_id IN (
    '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
    'cd088554-c0db-4d77-a698-535f4ccf151a',
    'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
  )
);

-- Step 2: Delete plan_sessions linked to training plans of these profiles
DELETE FROM public.plan_sessions
WHERE plan_id IN (
  SELECT id FROM public.client_training_plans
  WHERE trainer_id = '286cc0cc-8df2-418a-9b8a-dae879db7bfb'
     OR client_id IN (
       '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
       'cd088554-c0db-4d77-a698-535f4ccf151a',
       'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
     )
);

-- Step 3: Delete training plans
DELETE FROM public.client_training_plans
WHERE trainer_id = '286cc0cc-8df2-418a-9b8a-dae879db7bfb'
   OR client_id IN (
     '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
     'cd088554-c0db-4d77-a698-535f4ccf151a',
     'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
   );

-- Step 4: Delete workouts
DELETE FROM public.workouts
WHERE client_id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 5: Delete food logs
DELETE FROM public.food_logs
WHERE client_id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 6: Delete weight logs
DELETE FROM public.weight_logs
WHERE client_id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 7: Delete trainer platform subscriptions
DELETE FROM public.trainer_platform_subscriptions
WHERE trainer_id = '286cc0cc-8df2-418a-9b8a-dae879db7bfb';

-- Step 8: Delete trainer notifications
DELETE FROM public.trainer_notifications
WHERE trainer_id = '286cc0cc-8df2-418a-9b8a-dae879db7bfb';

-- Step 9: Delete push subscriptions
DELETE FROM public.push_subscriptions
WHERE profile_id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 10: Delete payment info
DELETE FROM public.payment_info
WHERE profile_id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 11: Unlink Shardul (client of trainer gaurav.rsh) so his profile isn't orphaned
UPDATE public.profiles
SET trainer_id = NULL
WHERE trainer_id = '286cc0cc-8df2-418a-9b8a-dae879db7bfb'
  AND id NOT IN (
    '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
    'cd088554-c0db-4d77-a698-535f4ccf151a',
    'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
  );

-- Step 12: Delete profiles
DELETE FROM public.profiles
WHERE id IN (
  '286cc0cc-8df2-418a-9b8a-dae879db7bfb',
  'cd088554-c0db-4d77-a698-535f4ccf151a',
  'a4078a71-a23f-4fdf-b856-a8cc75a66bf5'
);

-- Step 13: Delete auth users
DELETE FROM auth.users
WHERE id IN (
  'c3772de5-50b9-4c1d-a187-f592843cc25b',
  '22cd546f-aaf2-450d-b8ab-5c2682a513c0',
  '0ea796c8-5908-4814-af49-7af1e185bc04'
);
