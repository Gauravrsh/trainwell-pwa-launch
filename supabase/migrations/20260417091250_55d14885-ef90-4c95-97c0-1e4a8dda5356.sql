ALTER TABLE public.food_logs
ADD COLUMN IF NOT EXISTS pending_analysis boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_food_logs_pending_analysis
ON public.food_logs (client_id, pending_analysis)
WHERE pending_analysis = true;