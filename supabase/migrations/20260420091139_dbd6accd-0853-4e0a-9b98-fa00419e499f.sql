-- 1. Enable pg_cron in extensions schema (not public)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Internal heartbeat table (underscore prefix = internal)
CREATE TABLE IF NOT EXISTS public._system_heartbeat (
  id bigserial PRIMARY KEY,
  beat_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS with ZERO policies → invisible to anon, authenticated, trainers, clients.
-- Only service role / SECURITY DEFINER functions can touch it.
ALTER TABLE public._system_heartbeat ENABLE ROW LEVEL SECURITY;

-- 4. Heartbeat function: insert one row, prune anything older than 90 days
CREATE OR REPLACE FUNCTION public.record_heartbeat()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public._system_heartbeat DEFAULT VALUES;
  DELETE FROM public._system_heartbeat WHERE beat_at < now() - INTERVAL '90 days';
END;
$$;

-- 5. Unschedule any prior version of this job, then schedule fresh.
-- 03:17 UTC = 08:47 IST (off-peak; avoids 9:00 PM / 9:30 PM IST nudge jobs)
DO $$
BEGIN
  PERFORM cron.unschedule('vecto-daily-heartbeat')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vecto-daily-heartbeat');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'vecto-daily-heartbeat',
  '17 3 * * *',
  $$SELECT public.record_heartbeat();$$
);