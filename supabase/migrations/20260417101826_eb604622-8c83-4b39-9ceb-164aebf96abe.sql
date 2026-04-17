-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Food dictionary table (global shared cache)
CREATE TABLE public.food_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name text NOT NULL,
  quantity_unit text NOT NULL DEFAULT 'serving',
  base_quantity numeric NOT NULL DEFAULT 1,
  base_kcal numeric NOT NULL DEFAULT 0,
  base_protein numeric NOT NULL DEFAULT 0,
  base_carbs numeric NOT NULL DEFAULT 0,
  base_fat numeric NOT NULL DEFAULT 0,
  embedding vector(768),
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  original_raw_text text,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for fast cosine search
CREATE INDEX idx_food_dictionary_embedding
  ON public.food_dictionary
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_food_dictionary_needs_review
  ON public.food_dictionary (needs_review)
  WHERE needs_review = false;

-- Edit feedback log
CREATE TABLE public.food_dictionary_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dictionary_id uuid NOT NULL REFERENCES public.food_dictionary(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  original_kcal numeric,
  original_protein numeric,
  original_carbs numeric,
  original_fat numeric,
  edited_kcal numeric,
  edited_protein numeric,
  edited_carbs numeric,
  edited_fat numeric,
  kcal_delta_pct numeric,
  edited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_dictionary_edits_dictionary_id
  ON public.food_dictionary_edits (dictionary_id);

-- RLS
ALTER TABLE public.food_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_dictionary_edits ENABLE ROW LEVEL SECURITY;

-- Dictionary: authenticated read; no direct writes (edge function uses service role)
CREATE POLICY "Authenticated can read dictionary"
  ON public.food_dictionary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Block anon read of dictionary"
  ON public.food_dictionary FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "No direct inserts to dictionary"
  ON public.food_dictionary FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct updates to dictionary"
  ON public.food_dictionary FOR UPDATE
  USING (false);

CREATE POLICY "No direct deletes from dictionary"
  ON public.food_dictionary FOR DELETE
  USING (false);

-- Edits log: users can insert/view their own
CREATE POLICY "Users can insert own dictionary edits"
  ON public.food_dictionary_edits FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Users can view own dictionary edits"
  ON public.food_dictionary_edits FOR SELECT
  TO authenticated
  USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Block anon access to dictionary edits"
  ON public.food_dictionary_edits FOR SELECT
  TO anon
  USING (false);

-- Trigger: flip needs_review when 3+ significant edits accumulate
CREATE OR REPLACE FUNCTION public.check_dictionary_needs_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  significant_edit_count integer;
BEGIN
  -- Count edits with >25% kcal delta for this dictionary entry
  SELECT COUNT(*) INTO significant_edit_count
  FROM food_dictionary_edits
  WHERE dictionary_id = NEW.dictionary_id
    AND ABS(COALESCE(kcal_delta_pct, 0)) > 25;

  IF significant_edit_count >= 3 THEN
    UPDATE food_dictionary
    SET needs_review = true, updated_at = now()
    WHERE id = NEW.dictionary_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_dictionary_needs_review
  AFTER INSERT ON public.food_dictionary_edits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_dictionary_needs_review();

-- updated_at triggers
CREATE TRIGGER trg_food_dictionary_updated_at
  BEFORE UPDATE ON public.food_dictionary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: vector search (avoids exposing raw vector ops to clients; called from edge function via service role)
CREATE OR REPLACE FUNCTION public.search_food_dictionary(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.20,
  match_count integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  food_name text,
  quantity_unit text,
  base_quantity numeric,
  base_kcal numeric,
  base_protein numeric,
  base_carbs numeric,
  base_fat numeric,
  distance float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fd.id,
    fd.food_name,
    fd.quantity_unit,
    fd.base_quantity,
    fd.base_kcal,
    fd.base_protein,
    fd.base_carbs,
    fd.base_fat,
    (fd.embedding <=> query_embedding)::float AS distance
  FROM public.food_dictionary fd
  WHERE fd.needs_review = false
    AND fd.embedding IS NOT NULL
    AND (fd.embedding <=> query_embedding) < match_threshold
  ORDER BY fd.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RPC: bump usage stats on cache hit (callable by authenticated users)
CREATE OR REPLACE FUNCTION public.bump_dictionary_usage(p_dictionary_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.food_dictionary
  SET usage_count = usage_count + 1,
      last_used_at = now()
  WHERE id = p_dictionary_id;
$$;

REVOKE ALL ON FUNCTION public.search_food_dictionary FROM public, anon;
GRANT EXECUTE ON FUNCTION public.search_food_dictionary TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.bump_dictionary_usage FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bump_dictionary_usage TO authenticated, service_role;