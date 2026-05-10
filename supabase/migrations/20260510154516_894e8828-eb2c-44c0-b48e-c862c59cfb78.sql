UPDATE public.bmr_logs
SET bmr = 1750
WHERE client_id = 'a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f';

UPDATE public.profiles
SET bmr = 1750,
    bmr_updated_at = now()
WHERE id = 'a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f';