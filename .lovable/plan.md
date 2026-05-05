## Goal

Automatically compute a close approximation of `calories_burnt` for every workout (and refine step calorie estimates) based on user's weight, age, BMR, and the exercise details the user/trainer logs. Zero UI changes. No manual override. Backfill last 90 days for all users.

## Approach

### 1. Calorie engine (new file, no UI impact)
Create `src/lib/exerciseCalories.ts` with a pure function:
```
estimateCaloriesBurnt({ exerciseName, metricType, sets, reps, weightKg (load), durationSeconds, distanceMeters }, user: { weightKg, ageYears, bmrKcal })
```
- Uses MET values from a curated table keyed by exercise name / category (swimming, running, cycling, rowing, strength, yoga/stretch, plank, jump rope, etc.) with sensible fallbacks per `metric_type`.
- Formula: `kcal = MET × userWeightKg × hours`.
- Time inferred from:
  - `time` → `durationSeconds`
  - `distance_time` → use `durationSeconds` if present; else infer via activity pace table (e.g., swim 2 min/100m, run 6 min/km, row 5 min/km, cycle 3 min/km).
  - `reps_weight` / `reps_only` → `sets × reps × ~3s` + rest assumption (~30s/set), with MET adjusted up for heavy compound lifts.
  - `amrap` / `emom` → use the prescribed minutes.
- Light age/BMR adjustment factor (caps ±10%) so users with very low/high BMR get nudged proportionally; primary driver remains weight×MET×time per ACSM convention.

### 2. Step calories upgrade
Replace flat `steps × 0.04` with weight-aware:
`stepKcal = round(weightKg × 0.0005 × steps)` (≈0.04 at 80kg, scales with body mass).
Applied in `step_logs.estimated_calories` on insert/update and during backfill.

### 3. Auto-write into DB on workout completion (no UI changes)
Hook into the existing save paths in `ClientWorkoutLogModal.tsx`, `TrainerWorkoutLogModal.tsx`, `WorkoutLogModal.tsx`, and `StepLogModal.tsx`:
- After the existing insert/update of `exercises` / `workouts` / `step_logs`, run a small helper that:
  1. Fetches the just-saved exercise rows for the workout.
  2. Pulls the client's current `weight_kg`, `bmr`, `date_of_birth` from `profiles`.
  3. Sums per-exercise estimates → `UPDATE workouts SET calories_burnt = <sum>` for that workout (when status = `completed`).
  4. For steps: writes computed `estimated_calories` on the `step_logs` row.
- No new buttons, fields, labels, or copy. UI components render the same; only DB values change.

### 4. Backfill (last 90 days, all users) — one-shot edge function
Create `supabase/functions/backfill-workout-calories/index.ts` (POST + `MAINTENANCE_TOKEN` per house rules, manual JWT not needed since it's maintenance):
- Iterate every `workouts` row in last 90 days where `status='completed'`.
- For each, load its `exercises` rows + the client's historical weight (latest `weight_logs` ≤ workout date, else `profiles.weight_kg`) + historical BMR (latest `bmr_logs` ≤ workout date, else `profiles.bmr`) + age from `profiles.date_of_birth`.
- Compute total via the same `exerciseCalories.ts` logic ported to Deno (shared constants duplicated in the function file — edge functions can't import `src/`).
- `UPDATE workouts SET calories_burnt = <sum>` only where currently NULL or 0 (idempotent; never overwrites a non-zero existing value to be safe).
- Same loop for `step_logs` last 90 days: recompute `estimated_calories` using historical weight.
- Idempotent and safe to re-run.

### 5. Read path
`src/hooks/useProgressData.tsx` already reads `workouts.calories_burnt` and `step_logs.estimated_calories` — once populated, deficits self-correct. No change needed there.

### 6. Tests
Add `src/test/exercise-calories.test.ts` covering:
- Swim 900m for 80kg user ≈ 280–360 kcal.
- 10k steps at 75kg ≈ 375 kcal.
- Plank 60s, AMRAP 12min, EMOM 10×8 sanity bounds.
- Idempotency: re-running backfill on a populated workout doesn't change value.

## Files

**New**
- `src/lib/exerciseCalories.ts`
- `supabase/functions/backfill-workout-calories/index.ts`
- `src/test/exercise-calories.test.ts`

**Edited (logic only — zero JSX/UI text/style changes)**
- `src/components/modals/ClientWorkoutLogModal.tsx` — append calorie compute+update after save
- `src/components/modals/TrainerWorkoutLogModal.tsx` — same
- `src/components/modals/WorkoutLogModal.tsx` — same
- `src/components/modals/StepLogModal.tsx` — compute weight-aware kcal before insert (the `0.04` shown in UI is preserved as-is per your instruction; only DB value changes)

**No schema migration required** — `workouts.calories_burnt` and `step_logs.estimated_calories` columns already exist.

## Guardrails per your rules
- No UI line touched. The `0.04` preview in `StepLogModal` stays visually identical (it is just a hint label). DB stores the accurate weight-aware value.
- No trainer/client manual override surfaced.
- All calculations done by the system; users only enter what they did.
- Backfill scoped strictly to 90 days, idempotent, never overwrites existing non-zero values.

## Execution order
1. Add `exerciseCalories.ts` + tests.
2. Wire into 4 modals (logic-only).
3. Deploy backfill edge function and run it once.
4. Verify with Gaurav's 4 May swim → deficit recomputes correctly in Progress view.
