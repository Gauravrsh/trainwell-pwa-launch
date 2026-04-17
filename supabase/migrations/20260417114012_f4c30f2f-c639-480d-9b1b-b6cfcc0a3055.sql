ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS matched_dictionary_id uuid NULL
    REFERENCES public.food_dictionary(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_food_logs_matched_dictionary_id
  ON public.food_logs(matched_dictionary_id)
  WHERE matched_dictionary_id IS NOT NULL;