# TW-035 — Trainer "View Workout" shows empty when client logs exercises trainer didn't prescribe

## Voice of customer (Vaishnavi → about client Ankita Mishu, 15 May 2026)

1. "When the client logged the workout, I'm not able to see what all is written and done." → Trainer opens the day, modal says "Client has logged their workout. View only." then renders the empty state "No workout logged for this date."
2. "I'm not able to see the check of the previous workout (which I logged for them) — those are not getting reflected." → Same modal, different days: the workouts she pre-logged for Ankita don't show the actuals the client filled in, so it feels like her prescription "disappeared."

Both complaints are the same bug surfaced from two angles.

## Definitive diagnosis (verified against production data)

Database snapshot for Ankita Mishu (`profiles.id = b9d6aa3a-…`), workout for **2026-05-15** (`workouts.id = ceeccc38-…`, status `completed`):

```text
exercise_name                          | recommended_* | actual_sets | actual_reps | actual_weight
Thread the Needle (Thoracic Mobility)  | all NULL      |     1       |     10      |     1.00
Band stretches                         | all NULL      |     1       |     10      |     1.00
```

Trainer load path in `src/pages/Calendar.tsx → handleTrainerLogWorkout` (lines 459–481):

```ts
const hasActualValues = exercises.some(isActualLogged);
setClientHasLogged(hasActualValues);                        // → true
setExistingExercises(parsePlannedExercises(exercises));     // → []  (filters by isRecommended)
```

`parsePlannedExercises` (Calendar.tsx 273–322) filters rows with `isRecommended(...)`. For the 15-May rows every `recommended_*` column is NULL, so the filter returns `[]`. The modal then hits the empty-state branch in `TrainerWorkoutLogModal.tsx` (lines 570–577):

```tsx
{exerciseBlocks.length === 0 && (
  <p>{isReadOnly ? 'No workout logged for this date' : 'Start by adding an exercise'}</p>
)}
```

Result: header correctly says "Client has logged their workout. View only." while the body says "No workout logged for this date." — the contradiction Vaishnavi screenshotted.

For complaint #2 (older days like 12-May, 13-May, 14-May): rows have both `recommended_*` AND `actual_*` populated, but `parsePlannedExercises` only reads the `recommended_*` columns. So when the client changed weight/reps from what was prescribed, the trainer's read-only view still renders the prescription, not what the client actually did — hence "those are not getting reflected."

## Root cause (one line)

Trainer's read-only "View Workout" modal is hydrated exclusively from `recommended_*` columns. It ignores `actual_*`, so any client-added exercise vanishes and any client edit to a prescribed exercise is invisible.

## Fix

Build a merged "actuals-first" view payload in `handleTrainerLogWorkout` whenever `clientHasLogged` is true, and pass that to `TrainerWorkoutLogModal`.

1. **`src/pages/Calendar.tsx → handleTrainerLogWorkout`** — when `hasActualValues` is true, build `existingExercises` from a new merge helper instead of `parsePlannedExercises`. When false (trainer prescription only, client hasn't logged yet), keep current behavior so the edit flow continues to work.
2. **`src/pages/Calendar.tsx`** — add `parseExercisesForTrainerView(rows)` that:
   - For each unique `exercise_name`, picks `actual_*` values when any are present on its rows, otherwise falls back to `recommended_*`.
   - Reuses the same per-metric-type branching already present in `parseLoggedActuals` / `parsePlannedExercises` (reps grouped per name, others one-row-one-entry).
   - Returns `PlannedExercisePayload[]` so the existing modal renders it unchanged.
3. **No changes** to `TrainerWorkoutLogModal.tsx` — it already disables inputs via `isReadOnly`, so showing actuals there is purely additive.

## Verification (post-fix, repeatable from DB)

- For Ankita 2026-05-15: trainer modal must render 2 blocks — "Thread the Needle (Thoracic Mobility) — 1×10 @ 1 kg" and "Band stretches — 1×10 @ 1 kg" — matching the `actual_*` columns above.
- For Ankita 2026-05-11 (`96ce4d22-…`): every exercise must show the `actual_weight` / `actual_reps` (e.g. Leg extension set 3 → 35 kg × 10, not the prescribed 30 kg × 10).
- Run `SELECT exercise_name, actual_sets, actual_reps, actual_weight, recommended_weight FROM exercises WHERE workout_id = '<id>'` and compare against what the modal renders — they must match the `actual_*` column row-for-row.

## Issue repository

Append **TW-035** to `docs/issue-repository-index.md` (To-investigate → ✅ Fixed after deploy) and the full entry to `docs/issue-repository.md` with:
- Reporter: Vaishnavi (trainer) re client Ankita Mishu
- Symptom, root-cause SQL evidence above
- Files touched, regression check (trainer create/edit flow for not-yet-logged days still works)

## Out of scope

- No DB migration. No schema change. No client-side write path changes. UI/data-mapping fix only.
