
# TW-032 — Food Log: session summary diverges from Today's Diary

## The inconsistency (visible in screenshot)

- "Today's Diary" header: **572 kcal**, 2 entries (Breakfast 322, Snack 250).
- "3 meals logged" pill: **882 kcal**, 3 entries (Breakfast 322, Snack **310**, Snack 250).
- Delta is exactly one Snack: **310 kcal, P4 / C36 / F18**. It exists in the session pill but not in the diary that drives Progress/Calendar/deficit.

User-visible damage: the client trusts the green pill ("882 kcal logged"), but the deficit engine, trainer view, and tomorrow's Progress chart will all use 572. Silent under/over-reporting in either direction destroys the "Mirror doesn't lie" promise.

## Root cause

`FoodLogModal.tsx` maintains **two independent stores** for the same fact set:

1. **`sessionMeals` (in-memory array)** — appended at lines 409 and 436 immediately after `await onSave(...)`. This is what the green "N meals logged" pill (`FoodSessionSummary`) renders.
2. **`food_logs` rows in DB** — fetched by `FoodDiaryPanel` whenever `refreshSignal` (`diaryRefresh`) bumps. This is what the "Today's Diary" header renders, and what every downstream feature reads.

These two stores can drift in three ways, all currently unhandled:

- **A — Silent save failure.** `onSave` is awaited but its error path only `toast`s; `setSessionMeals` still runs. If the insert RLS-fails, network-fails, or commits to a different `logged_date`/`client_id`, the pill grows but the diary doesn't.
- **B — Delete-from-diary doesn't prune the session.** `FoodDiaryPanel.handleDelete` removes the row from `rows` and the DB, but never tells `FoodLogModal` to drop the corresponding entry from `sessionMeals`. The screenshot is consistent with this: user logged the 310-kcal snack, then tapped the trash icon next to it in the diary list, leaving it stranded in the pill. (Most likely cause based on the data.)
- **C — Edit-from-diary doesn't update the session.** Same gap as B: editing macros via the pencil icon updates the DB row but the pill keeps the stale numbers.

The architectural mistake is having `sessionMeals` exist at all. It's a parallel write log of a thing the database is already authoritative about.

## Fix (server stays untouched, no schema changes)

**Single-source-of-truth refactor.** Delete `sessionMeals` state and derive the "meals logged" pill from the same `food_logs` rows the diary already fetches.

### Changes

1. **`src/components/modals/FoodSessionSummary.tsx`** — keep the component, but change its data contract: it now accepts the same `DiaryRow[]` shape the diary uses (or a slim projection), and shows totals/per-meal breakdown computed from it. Add a "session-only" filter prop so it can optionally show "meals logged in this modal session" by filtering rows whose `created_at >= modalOpenedAt`. Default to "today's diary totals" so it can never disagree with the diary header.

2. **`src/components/modals/FoodLogModal.tsx`** —
   - Remove `sessionMeals` state and the two `setSessionMeals(...)` appends (lines 409, 436) and the reset at 513.
   - Lift the diary fetch up: have `FoodDiaryPanel` accept an optional `onRowsChange(rows)` callback and surface the current rows to the modal. Modal passes those rows into `FoodSessionSummary`.
   - Capture `modalOpenedAt = useRef(new Date().toISOString())` on mount; pass to `FoodSessionSummary` so the pill still reads "N meals logged this session" by filtering on `created_at`. (We need `created_at` in the diary `select`, which it already returns implicitly — just add to the projection.)

3. **`src/components/modals/FoodDiaryPanel.tsx`** —
   - Add `created_at` to the select (line 48).
   - Add `onRowsChange?: (rows: DiaryRow[]) => void` to props; call it from inside the existing `setRows(...)` paths (initial fetch, optimistic delete, post-save refetch).
   - No UI changes.

4. **No DB migration, no edge function, no Progress/Calendar code touched.** The downstream truth (`food_logs` table) was already correct; we're only stopping the UI from lying about it.

### Why this is the right fix, not a patch

Patching B and C alone (prune `sessionMeals` on delete, update on edit) leaves A unfixed and re-opens the door every time a future contributor adds a new write path. Eliminating the parallel store closes the whole class of bug.

## Verification plan

- Manual: log a meal → appears in both panels with identical numbers. Delete it from diary → disappears from both. Edit macros → both reflect new numbers. Force a save failure (offline) → neither panel grows.
- Existing automated coverage: `progress-math.test.ts` unaffected (read path unchanged). Add a tiny vitest case asserting `FoodSessionSummary` totals === sum of diary rows it received, for a fixture with 0/1/many meals and a deleted-mid-session scenario.
- Spot-check production: query `food_logs` for affected user and confirm only 2 rows for `2026-05-09` (the diary is right, the pill is wrong).

## Files touched

- `src/components/modals/FoodLogModal.tsx` (remove sessionMeals state + plumbing)
- `src/components/modals/FoodSessionSummary.tsx` (new prop contract, derives from diary rows)
- `src/components/modals/FoodDiaryPanel.tsx` (expose rows + add `created_at` to select)
- `src/test/food-log-session-consistency.test.ts` (new)
- `docs/issue-repository-index.md` (append TW-032 row)
- `docs/issue-repository.md` (append TW-032 case file: report, RCA, fix, verification, files, regression check)

## Issue repo entries to add

**Index row (`docs/issue-repository-index.md`):**
```
TW-032 | High | Open → Fixed | Food Log modal "N meals logged" pill diverged from "Today's Diary" — pill counted in-memory session writes that no longer existed in DB after a delete (or never landed there on save failure), causing client/trainer to see two different daily totals in the same modal | FoodLogModal.tsx / FoodSessionSummary.tsx / FoodDiaryPanel.tsx
```

**Case file (`docs/issue-repository.md`):** full sections — Reported, RCA (the three drift modes A/B/C above), Fix (single-source-of-truth refactor), Verification, Files touched, Regression check (downstream untouched; aggregation tests still green), Out-of-scope (no schema, no UI redesign, no copy changes).

## Closing block (will be emitted post-implementation)

- **TW-ID:** TW-032
- **Files touched:** above
- **Repo updated:** ✅
- **Regression check:** progress-math + existing food-log tests green; new session-consistency test green; manual flow (log → delete → edit → offline-save) verified.

## Out of scope

- No UI/visual changes (per standing user constraint).
- No backfill needed — DB was always correct; only the pill lied.
- No change to Progress, Calendar, deficit math, or trainer view.
