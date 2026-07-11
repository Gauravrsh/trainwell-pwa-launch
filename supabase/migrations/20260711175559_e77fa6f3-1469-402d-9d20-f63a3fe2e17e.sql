
-- ============================================================
-- 1. app_role enum + user_roles table (separate from profiles)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read their own role rows" ON public.user_roles;
CREATE POLICY "Users can read their own role rows"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Deny anon on user_roles" ON public.user_roles;
CREATE POLICY "Deny anon on user_roles"
  ON public.user_roles FOR ALL
  TO anon
  USING (false) WITH CHECK (false);

-- Seed the founder as admin (Gaurav Sharma). Change/add via SQL as needed.
INSERT INTO public.user_roles (user_id, role)
VALUES ('8dce1938-20bd-4396-8bf7-e8d82d6d1222', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 2. trainer_leads table
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM (
    'new', 'dm_sent', 'call_booked', 'activated', 'dead'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.trainer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  whatsapp_no TEXT NOT NULL CHECK (char_length(whatsapp_no) BETWEEN 6 AND 20),
  instagram_handle TEXT CHECK (instagram_handle IS NULL OR char_length(instagram_handle) BETWEEN 1 AND 60),
  city TEXT CHECK (city IS NULL OR char_length(city) BETWEEN 1 AND 80),
  client_count_bucket TEXT CHECK (client_count_bucket IS NULL OR char_length(client_count_bucket) <= 30),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 1000),
  utm_source TEXT CHECK (utm_source IS NULL OR char_length(utm_source) <= 60),
  utm_medium TEXT CHECK (utm_medium IS NULL OR char_length(utm_medium) <= 60),
  utm_campaign TEXT CHECK (utm_campaign IS NULL OR char_length(utm_campaign) <= 60),
  utm_content TEXT CHECK (utm_content IS NULL OR char_length(utm_content) <= 60),
  referrer_url TEXT CHECK (referrer_url IS NULL OR char_length(referrer_url) <= 500),
  status public.lead_status NOT NULL DEFAULT 'new',
  admin_notes TEXT CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trainer_leads_created_at_idx ON public.trainer_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS trainer_leads_status_idx ON public.trainer_leads (status);

-- Grants
GRANT INSERT ON public.trainer_leads TO anon;         -- public form submissions
GRANT INSERT, SELECT, UPDATE, DELETE ON public.trainer_leads TO authenticated;
GRANT ALL ON public.trainer_leads TO service_role;

ALTER TABLE public.trainer_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can INSERT — but NOT specify status/notes.
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.trainer_leads;
CREATE POLICY "Anyone can submit a lead"
  ON public.trainer_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND admin_notes IS NULL
  );

-- Only admins can read / update / delete.
DROP POLICY IF EXISTS "Admins can read leads" ON public.trainer_leads;
CREATE POLICY "Admins can read leads"
  ON public.trainer_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update leads" ON public.trainer_leads;
CREATE POLICY "Admins can update leads"
  ON public.trainer_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete leads" ON public.trainer_leads;
CREATE POLICY "Admins can delete leads"
  ON public.trainer_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.trainer_leads_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trainer_leads_touch_updated_at ON public.trainer_leads;
CREATE TRIGGER trainer_leads_touch_updated_at
  BEFORE UPDATE ON public.trainer_leads
  FOR EACH ROW EXECUTE FUNCTION public.trainer_leads_touch_updated_at();
