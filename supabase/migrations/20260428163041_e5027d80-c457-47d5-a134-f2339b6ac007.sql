-- TW-028: Historical BMR log to prevent retroactive recomputation
CREATE TABLE public.bmr_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  bmr integer NOT NULL CHECK (bmr BETWEEN 500 AND 10000),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, effective_date)
);

CREATE INDEX bmr_logs_client_date_idx
  ON public.bmr_logs (client_id, effective_date DESC);

ALTER TABLE public.bmr_logs ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Block anon access to bmr_logs"
  ON public.bmr_logs
  FOR SELECT
  TO anon
  USING (false);

-- Clients can view own
CREATE POLICY "Clients can view own bmr logs"
  ON public.bmr_logs
  FOR SELECT
  TO authenticated
  USING (client_id = get_user_profile_id(auth.uid()));

-- Clients can insert own
CREATE POLICY "Clients can insert own bmr logs"
  ON public.bmr_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_user_profile_id(auth.uid()));

-- Trainers can view client BMR logs
CREATE POLICY "Trainers can view client bmr logs"
  ON public.bmr_logs
  FOR SELECT
  TO authenticated
  USING (is_trainer_of_client(auth.uid(), client_id));

-- Trainers can insert client BMR logs (subscription-gated)
CREATE POLICY "Trainers can insert client bmr logs"
  ON public.bmr_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_trainer_of_client(auth.uid(), client_id)
    AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  );

-- BMR history is immutable: no updates, no deletes
CREATE POLICY "BMR logs cannot be updated"
  ON public.bmr_logs
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "BMR logs cannot be deleted"
  ON public.bmr_logs
  FOR DELETE
  TO public
  USING (false);

-- Backfill from existing profiles.bmr so Progress charts work immediately.
INSERT INTO public.bmr_logs (client_id, bmr, effective_date, created_at)
SELECT
  p.id,
  p.bmr,
  COALESCE(p.bmr_updated_at::date, CURRENT_DATE) AS effective_date,
  COALESCE(p.bmr_updated_at, now())              AS created_at
FROM public.profiles p
WHERE p.bmr IS NOT NULL
ON CONFLICT (client_id, effective_date) DO NOTHING;