## Decision Alignment

**I agree with your decision.** Here's why:

### Arguments FOR (your position, which I endorse)

1. **"Whatever gets tracked, gets done"** — Steps are manually tracked active effort. Denying visual reinforcement for tracked activity contradicts the core philosophy. If a client walks 12,000 steps and logs them, that IS compliance.
2. **Real-world training reality** — Not every day has a prescribed gym workout. Rest days with active recovery (walking, steps) are part of any sensible program. A calendar full of blank tiles on "rest days" despite the client logging 10K+ steps sends the wrong signal — it looks like the client did nothing.
3. **Trainer-client alignment** — Trainers already see step logs in progress charts. If the calendar doesn't reflect this, there's a disconnect between what the trainer sees in Progress vs Calendar. Same data, inconsistent visual treatment.
4. **Motivation flywheel** — The neon border is the primary dopamine hit. Withholding it from step-logging days breaks the streak visual, which is the single most powerful retention mechanic in the calendar.

### Arguments AGAINST (acknowledged, but overridden)

1. **Signal dilution** — A trainer can no longer distinguish "did prescribed workout" from "just walked" at a glance. *Counter: this is a feature, not a bug. The calendar tracks compliance/effort, not workout type. The workout detail modal already shows what was done.*
2. **Low-effort gaming** — A client could log 100 steps to get the neon border. *Counter: the trainer sees the step count in the detail view. The "Mirror Doesn't Lie" — gaming is self-evident and self-defeating.*

---

## Build Plan

### Current State

- The month grid renders `border-success` (neon) only when a `workout` exists with `status === 'completed'`
- Step logs are fetched on-demand when a date is tapped, NOT pre-fetched for the month grid
- No step data is available during grid rendering

### Changes Required

**1. `src/pages/Calendar.tsx**`

- **Add a month-level step log query** — new `useQuery` that fetches all `step_logs` rows for the visible month range (same pattern as the existing workouts query). Select only `logged_date` since we just need presence, not counts.
- **Build a `stepDatesSet**` — a `Set<string>` of dates that have step logs, for O(1) lookup during cell rendering.
- **Update the date cell border logic** (line ~1194) — change from:
  ```
  const statusBorder = workout ? getStatusBorder(workout.status) : null;
  ```
  to:
  ```
  const hasCompletedWorkout = workout?.status === 'completed';
  const hasStepLog = stepDatesSet.has(dateStr);
  const statusBorder = (hasCompletedWorkout || hasStepLog) ? 'border-success' : null;
  ```
- **Update legend label** — Change "Logged" to "Logged" (no change needed if already generic) to cover both workout and step logging.
- **Invalidate step query on step save** — after `handleStepSave` succeeds, invalidate the step-dates query so the neon border appears immediately without page refresh.

**2. `src/test/calendar-boundary-ui.test.ts**`

- No structural changes needed — existing tests verify border classes exist, not what triggers them. The `border-success` class and `getStatusBorder` references remain. Will verify tests still pass.

### What does NOT change

- Trainer view step queries (already separate)
- Progress charts, deficit math, carry-forward logic — untouched
- Day mark priority (marks still override step/workout borders)
- Step logging modal and save flow — unchanged
- No DB migrations, no RLS changes

### Risk

Low. Single file change (Calendar.tsx) adding one read query and adjusting one conditional. The step_logs table already has RLS and indexes on `client_id` + `logged_date`.

Accordingly, make sure the for user [Gaurav.rsh@gmail.com](mailto:Gaurav.rsh@gmail.com) boundary is made neon for 30 April, since active steps have been logged. Apply this logic since 1April for all users trainers or clients if they have logged steps. 