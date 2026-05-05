
ALTER TABLE public.step_logs DROP COLUMN estimated_calories;
ALTER TABLE public.step_logs ADD COLUMN estimated_calories integer;
