# Backfill TW-031 into the Issue Repository

## What I missed
The "calories_burnt never populated → swimming/cycling/etc. contribute 0 to deficit" bug was diagnosed, fixed (two migrations: server-side MET engine + triggers + 90-day backfill), and verified against Gaurav's May 4 data — but I never opened a TW-### entry, never appended a row to `docs/issue-repository-index.md`, and never wrote a full case file in `docs/issue-repository.md`. SOP-2 violation: the `Bug:` trigger should have forced repo-first, even with a capital B.

## Changes

### 1. `docs/issue-repository-index.md`
Append one line:

```
TW-031 | High | Fixed | Non-step exercises (swimming, cycling, HIIT, etc.) contributed 0 kcal to "Avg Daily Deficit" because workouts.calories_burnt was never populated by the app; step calories were also weight-blind (flat 0.04/step) | migrations 20260505020821 + 20260505020906 / step_logs schema / useProgressData.tsx (read path unchanged)
```

### 2. `docs/issue-repository.md`
Append a full TW-031 case file with these sections:

- **Reported:** Gaurav, May 4 2026 — 900m swim + ~10K steps, deficit only 192 kcal. Investigation showed every non-step workout in the DB had `calories_burnt = 0` or `NULL` for every user.
- **Root cause:**
  1. `workouts.calories_burnt` was a writable column with no app code path that ever wrote to it. Every modal (Client / Trainer / generic Workout) saved exercise rows but never computed or persisted a calorie estimate.
  2. `step_logs.estimated_calories` used a flat `step_count * 0.04` heuristic that ignored body weight, so a 60kg and a 110kg client logging 10K steps got identical credit.
  3. `useProgressData.tsx` faithfully summed `workouts.calories_burnt` → 0 for everyone except step contributions, silently understating the deficit.
- **Fix (server-side, zero UI changes — per user constraint):**
  - **Migration `20260505020821`** — Created SQL functions `met_for_exercise(name, category)` (MET table for swim strokes, run, cycle, row, HIIT, yoga, strength, mobility, etc.) and `estimate_exercise_seconds(...)` (infers duration from distance via activity-specific pace, or from reps at ~3s/rep + rest), plus `get_client_weight_on(client_id, date)` (resolves historical weight from `weight_logs` → `profiles.weight_kg` fallback). Added `BEFORE INSERT/UPDATE` triggers on `public.exercises` and `public.workouts` that recompute `calories_burnt = MET × weightKg × hours`.
  - **Migration `20260505020906`** — Converted `step_logs.estimated_calories` from a generated column to a regular column; added trigger using weight-aware formula `weightKg × 0.0005 × steps`.
  - **One-shot backfill** (idempotent SQL inside the same migration) — Recomputed `calories_burnt` for all completed workouts and `estimated_calories` for all step logs in the trailing 90 days for every client, using historical weight at the workout's date.
- **Verification:**
  - Gaurav 2026-05-04: 900m freestyle now resolves to ~901 kcal (was 0). Daily deficit corrected from 192 → ~1,144 kcal.
  - Spot-checked 5 random non-Gaurav clients with at least one non-step workout in the last 90 days — all now have non-zero `calories_burnt`.
  - `useProgressData.tsx` read path was deliberately untouched; the same `workouts.calories_burnt` sum it has always done now returns real numbers.
- **Files touched:**
  - `supabase/migrations/20260505020821_872a6f0f-5029-4bf0-9d9e-a09c6a5579c2.sql` (engine + triggers on workouts/exercises + backfill)
  - `supabase/migrations/20260505020906_7f09037a-2776-4eee-a96c-976ed9e8cb47.sql` (step_logs schema swap + trigger + backfill)
  - `src/integrations/supabase/types.ts` (auto-regen from schema change; no hand edits)
  - `.lovable/plan.md`
- **Regression check:** Step-only days unchanged in magnitude (formula now weight-aware but matches old 0.04 baseline at ~80kg, which is close to median user weight); workout-only days previously read 0 and now read MET-based estimates; mixed days sum both. `progress-math.test.ts` still green (it exercises the aggregation, not the per-row source).
- **Out of scope / known limits:** MET table is a finite map; unknown custom exercise names fall back to a conservative 4.0 MET. No UI surface for the estimate (per user directive); trainers cannot override.

## Closing Block (the one I owed last turn)

- **TW-ID:** TW-031
- **Files touched:** the two migrations above + auto-regen of `types.ts`
- **Repo updated:** ✅ (this change)
- **Regression check:** progress-math suite still green; spot checks across 5 clients confirm non-zero burns; step-only days unchanged at median weight.

No code or schema changes in this task — purely documentation backfill into the two repository markdown files.
