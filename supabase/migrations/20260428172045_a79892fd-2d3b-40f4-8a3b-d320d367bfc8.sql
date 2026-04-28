-- TW-029: Clean up duplicate client-added "Swimming - Freestyle" rows that
-- accumulated for workout ffb7b51a-e1cb-4caf-9b82-ed3f38cacf5e (Gaurav, 2026-04-28)
-- due to the additive re-save bug. Keeps the earliest row per (workout_id,
-- exercise_name) where recommended_sets IS NULL.
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY workout_id, exercise_name
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.exercises
  WHERE workout_id = 'ffb7b51a-e1cb-4caf-9b82-ed3f38cacf5e'
    AND recommended_sets IS NULL
)
DELETE FROM public.exercises
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);