# TW-025 — Completed workout re-prompts client to log again

## RCA (Root Cause Analysis) — verified against DB

User: gaurav.rsh@gmail.com — workout for 2026-04-28 (id `ffb7b51a…`) is already `status='completed'` (updated 08:26 UTC, after the original 04:44 log). DB confirms: 8 exercise rows, all with `recommended_sets=1`; 7 of them have `actual_reps=10, actual_sets=1` (logged), one ("Shoulder flies") has `actual_reps=NULL` (the user simply didn't fill that row when first logging).

Despite the workout being `completed`, the app let the user reopen the same logging flow and shows "Workout logged successfully!" again. Three concrete bugs combine to produce this:

1. **No status gate on the "Log Workout" CTA.** In `src/pages/Calendar.tsx` (~line 1414–1428), the client action sheet renders the "Log Workout" tile whenever `canEdit` is true. There is **no check on `workout.status === 'completed'`** — only the bottom "Quick status update" buttons are gated by `pending`. So a completed workout still exposes the full re-log path.

2. **Modal always re-seeds from trainer plan, ignoring prior actuals.** `ClientWorkoutLogModal` (`useEffect` at line 76–101) re-builds `exerciseBlocks` from `trainerExercises` every time `open` flips to `true`. `clientTrainerExercises` is fetched in `handleDateClick` directly from the `exercises` table — it pulls planned rows but **never reads `actual_*` fields**, so previously-entered weights/reps are not shown back. To the user it looks like "nothing was saved" even though the workout is `completed`.

3. **`handleWorkoutSave` blindly upserts again.** It re-sets `status='completed'`, deletes any non-planned actual rows (`recommended_sets IS NULL`), and re-applies actuals onto planned rows. There's no idempotency check, no "already logged — confirm overwrite" prompt, and no audit trail. Hence the duplicate "Workout logged successfully!" toast.

Net effect: the completed state is invisible in the modal → user thinks they need to log again → save path runs as if it were the first log → false confirmation toast. The bug is purely client-side; DB integrity is intact (re-save is effectively a no-op for the matched rows in this case, but it is destructive for any non-planned actuals the client may have added — those get deleted by the cleanup step on line 694–698).

## Fix

### A. Gate the action sheet by workout status
In `src/pages/Calendar.tsx` client action sheet:
- If `workout?.status === 'completed'` → replace the "Log Workout" tile with a **"View / Edit Workout"** tile (same icon, different label, success-tinted border).
- Keep "Log Food" and "Log Steps" tiles as-is.
- The existing "Assigned Workout — completed" status pill already conveys state; reinforce by hiding the "Quick status update" Done/Missed buttons (already hidden — they only show for `pending`, good).

### B. Hydrate the modal from saved actuals when re-opening a completed workout
- New prop on `ClientWorkoutLogModal`: `existingActuals?: ClientLoggedExercise[]` and `mode?: 'log' | 'edit'`.
- In `handleDateClick` (client branch), when `workout` exists and is `completed`, fetch `exercises` and reconstruct `existingActuals` by reading `actual_sets / actual_reps / actual_weight / actual_duration_seconds / actual_distance_meters / actual_rounds / actual_emom_minutes` together with `metric_type`. Pass them to the modal.
- In the modal's `useEffect`, if `existingActuals?.length`, seed `exerciseBlocks` from those (with `isFromTrainer` preserved by name match against `trainerExercises`); else fall back to the current trainer-plan seeding.
- Title + CTA copy switch by `mode`: "Log Workout" / "Save Workout" vs "Edit Workout" / "Update Workout".

### C. Make `handleWorkoutSave` idempotent and honest
- If `existingWorkout?.status === 'completed'` and the user is re-saving, show toast **"Workout updated"** (not "logged successfully").
- Remove the destructive cleanup on line 694–698 when in edit mode (don't wipe extra actuals the user added previously without an explicit "Remove" click).
- No DB schema change needed.

### D. Regression coverage
Add `src/test/client-workout-relog.test.ts`:
1. Completed workout → action sheet shows "View / Edit Workout", not "Log Workout".
2. Opening edit mode hydrates blocks with previously-saved `actual_*` values, not zeros.
3. Saving in edit mode triggers the "updated" toast, not "logged successfully".
4. Pending workout still opens in fresh "Log Workout" mode with trainer recommendations.
5. Workout with no trainer plan still allows free-form log (current behavior).

Manually verify in preview after deploy:
- Today's tile (already completed) → reopen → modal shows actuals → Save → toast says "updated".
- Tomorrow's tile (pending) → original log flow unchanged.
- Trainer view unchanged (TrainerWorkoutLogModal not touched).

## Issue repository

Append to `docs/issue-repository.md`:

```
### TW-025 — Completed client workout re-prompts logging
Status: Fixed
Severity: High (data UX, false confirmation, destructive re-save risk)
Reported: 2026-04-28 by gaurav.rsh@gmail.com
RCA: Action sheet did not gate "Log Workout" by status; modal re-seeded only
from trainer plan and ignored saved actuals; save path was non-idempotent and
destructively wiped non-planned actuals on every save.
Fix: Status-aware CTA ("View/Edit"), modal hydrates from actuals, save toast
distinguishes log vs update, cleanup gated to log mode only.
Files: src/pages/Calendar.tsx, src/components/modals/ClientWorkoutLogModal.tsx,
       src/test/client-workout-relog.test.ts
Regression check: vitest suite + manual verify on completed + pending tiles.
```

Append the one-line entry to `docs/issue-repository-index.md` under TW-024b.

## Files touched

- `src/pages/Calendar.tsx` — gate CTA, fetch actuals on click, pass to modal, idempotent save toast, cleanup guard.
- `src/components/modals/ClientWorkoutLogModal.tsx` — `existingActuals` + `mode` props, hydration logic, copy switch.
- `src/test/client-workout-relog.test.ts` — new regression suite.
- `docs/issue-repository.md`, `docs/issue-repository-index.md` — TW-025 entry.

No DB migration. No edge function changes. No SW changes.
