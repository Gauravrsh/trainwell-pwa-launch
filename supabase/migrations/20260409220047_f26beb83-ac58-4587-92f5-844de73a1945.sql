
-- New table for trainer day marks (TL, CL, HL)
CREATE TABLE public.day_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES public.profiles(id),
  client_id uuid NOT NULL REFERENCES public.profiles(id),
  mark_date date NOT NULL,
  mark_type text NOT NULL CHECK (mark_type IN ('trainer_leave', 'client_leave', 'holiday')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, mark_date)
);

ALTER TABLE public.day_marks ENABLE ROW LEVEL SECURITY;

-- Block anon access
CREATE POLICY "Block anon access to day_marks" ON public.day_marks
  FOR SELECT TO anon
  USING (false);

-- Trainers can view client day marks
CREATE POLICY "Trainers can view client day marks" ON public.day_marks
  FOR SELECT TO authenticated
  USING (trainer_id = get_user_profile_id(auth.uid()));

-- Trainers can insert client day marks
CREATE POLICY "Trainers can insert client day marks" ON public.day_marks
  FOR INSERT TO authenticated
  WITH CHECK (
    trainer_id = get_user_profile_id(auth.uid())
    AND is_trainer_of_client(auth.uid(), client_id)
    AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  );

-- Trainers can delete client day marks
CREATE POLICY "Trainers can delete client day marks" ON public.day_marks
  FOR DELETE TO authenticated
  USING (
    trainer_id = get_user_profile_id(auth.uid())
    AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  );

-- Clients can view marks on their dates
CREATE POLICY "Clients can view own day marks" ON public.day_marks
  FOR SELECT TO authenticated
  USING (client_id = get_user_profile_id(auth.uid()));
