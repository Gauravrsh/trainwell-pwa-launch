## Goal

1. Add the 5 exercises you requested (with IYTW expanded into 4 separate variants, "hypertension" corrected to "Hyperextension").
2. Add a brand-new **Cardio & Endurance** category with 25 of the most common cardio exercises/sports (Swimming lives here).
3. Upgrade the static exercise vault so each exercise carries a **default metric type**, and the workout modals auto-seed that metric instead of always defaulting to `Sets × Reps × Weight`.

No DB schema change needed — `metric_type` is already a per-row column on `exercises`. This is a frontend-only data + small UX change.

---

## 1. New exercises being added

### Strength & Weight Training > Shoulders
- Prone IYTW (Weighted) — *default metric: reps_only*

### Strength & Weight Training > Back
- Prone Hyperextension (Bodyweight) — *reps_only*
- Weighted Prone Hyperextension — *reps_weight*

### Machine-Based Training > Upper Body (Push/Pull/Shoulder)
- Banded IYTW (Standing, Cable/Band) — *reps_only*

### Functional & Dynamics > Bodyweight Dynamics
- Standing IYTW (Bodyweight) — *reps_only*
- Prone IYTW (Bodyweight) — *reps_only*

### Mobility & Flexibility > Spine, Torso & Lower Body
- Mountain Pose / Tadasana Hold — *time*
- Adductor Stretch (Seated Butterfly) — *time*

### NEW Category: Cardio & Endurance > Cardio Machines & Sports (25 entries)

Default metric for each is shown in brackets.

1. Outdoor Running (distance_time)
2. Treadmill Running (distance_time)
3. Treadmill Walking (distance_time)
4. Treadmill Incline Walk (distance_time)
5. Outdoor Cycling (distance_time)
6. Stationary Bike (distance_time)
7. Spin Bike Intervals (time)
8. Assault Bike (Air Bike) (distance_time)
9. Indoor Rowing (Erg) (distance_time)
10. SkiErg (distance_time)
11. Stair Climber (Stepmill) (time)
12. Elliptical Trainer (time)
13. Arc Trainer (time)
14. Jump Rope — Steady Pace (time)
15. Jump Rope — Double Unders (reps_only)
16. Swimming — Freestyle (distance_time)
17. Swimming — Breaststroke (distance_time)
18. Swimming — Backstroke (distance_time)
19. Swimming — Butterfly (distance_time)
20. Open Water Swim (distance_time)
21. Hill Sprints (distance_time)
22. Track Sprints (100m / 200m / 400m) (distance_time)
23. Stadium Stair Run (time)
24. Hiking / Trekking (distance_time)
25. Boxing — Bag Round (3 min) (time)

---

## 2. Code changes

### `src/data/gymExercises.ts`

Switch the `exercises: string[]` shape to also support an object form so each entry can carry a default metric, while staying backward-compatible with the current flat `gymExercises: string[]` export.

```text
ExerciseEntry = string | { name: string; defaultMetric: MetricType }

ExerciseCategory.subcategories[i].exercises: ExerciseEntry[]
```

- Existing entries stay as plain strings (implicitly default to `reps_weight`, matching today's behavior).
- New entries that need a non-default metric are written as objects.
- Add helpers:
  - `gymExercises: string[]` — unchanged contract (auto-derived from names) so the modals keep working.
  - `getDefaultMetricForExercise(name: string): MetricType` — returns the declared default, falls back to `reps_weight`.

Add the 8 new strength/mobility/functional entries under their respective subcategories above.

Add the new top-level **Cardio & Endurance** category with one subcategory **Cardio Machines & Sports** containing the 25 entries above.

### `src/components/modals/TrainerWorkoutLogModal.tsx` and `src/components/modals/ClientWorkoutLogModal.tsx`

When a new exercise block is created OR when the trainer picks an exercise from the autocomplete, seed `metricType` from `getDefaultMetricForExercise(exerciseName)` instead of always using `DEFAULT_METRIC_TYPE`. Trainer can still override via the existing metric dropdown.

### `src/data/gymExercises.ts` legacy `muscleGroups` export

Append `"Cardio Machines & Sports"` to the legacy union so anything keying off it doesn't break.

---

## 3. Regression check

- Add a small Vitest in `src/test/exercise-vault.test.ts` covering:
  - All 8 specifically-requested entries are searchable via `gymExercises`.
  - `getDefaultMetricForExercise('Mountain Pose / Tadasana Hold')` returns `'time'`.
  - `getDefaultMetricForExercise('Outdoor Running')` returns `'distance_time'`.
  - `getDefaultMetricForExercise('Barbell Back Squats (High Bar)')` falls back to `'reps_weight'` (legacy entries unaffected).
  - `exerciseCategories` includes `'Cardio & Endurance'`.

Manual smoke after deploy:
- Trainer Workout Log modal → search "swimming" → pick Freestyle → metric pre-selects "Distance + time".
- Search "mountain" → pick Tadasana → metric pre-selects "Time hold".
- Search "squat" → existing behavior preserved (Reps × Weight default).

---

## 4. Issue tracking

Not a bug — feature/data addition. Will be tracked as a normal change in `docs/issue-repository.md` under a new entry **TW-027 — Exercise Vault Expansion (Cardio category + IYTW + per-exercise default metrics)** with the list of additions and the modal seeding change documented for future reference.

---

## Files touched (preview)

- `src/data/gymExercises.ts` — data + helper + new category
- `src/components/modals/TrainerWorkoutLogModal.tsx` — seed metric from helper
- `src/components/modals/ClientWorkoutLogModal.tsx` — seed metric from helper
- `src/test/exercise-vault.test.ts` — new
- `docs/issue-repository.md` + `docs/issue-repository-index.md` — TW-027 entry

Approve and I'll implement.