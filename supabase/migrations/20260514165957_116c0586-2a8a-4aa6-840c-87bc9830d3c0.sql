CREATE TABLE public.client_error_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  profile_id uuid,
  message text,
  stack text,
  component_stack text,
  route text,
  user_agent text,
  build_id text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;

-- Block SELECT for everyone (only service role can read)
CREATE POLICY "No one can read error reports"
  ON public.client_error_reports FOR SELECT
  USING (false);

-- Block anon entirely
CREATE POLICY "Block anon insert to error reports"
  ON public.client_error_reports FOR INSERT
  TO anon
  WITH CHECK (false);

-- Authenticated users can insert their own report (must match auth.uid)
CREATE POLICY "Users can insert own error reports"
  ON public.client_error_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No updates, no deletes
CREATE POLICY "Error reports cannot be updated"
  ON public.client_error_reports FOR UPDATE
  USING (false);

CREATE POLICY "Error reports cannot be deleted"
  ON public.client_error_reports FOR DELETE
  USING (false);

CREATE INDEX idx_client_error_reports_user_id ON public.client_error_reports(user_id);
CREATE INDEX idx_client_error_reports_captured_at ON public.client_error_reports(captured_at DESC);