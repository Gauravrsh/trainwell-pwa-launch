## Goal

Rewrite Gaurav's BMR to **1750** for **all past dates** and make 1750 the current value going forward. Every chart, calculation, and profile surface must reflect 1750.

User: `Gaurav.rsh@gmail.com` → profile id `a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f`

## Current state (verified earlier)

- `profiles.bmr` = **1859**, `bmr_updated_at` = 2026-04-28
- `bmr_logs` has **one row**: `effective_date = 2026-01-01`, `bmr = 1859`
- Progress page resolver (`useProgressData.tsx`) walks `bmr_logs` ascending and seeds with the latest row before the window. Because there's only one historical row dated 2026-01-01, every day from then onward currently resolves to 1859.

## What changes

### 1. Database (one-off migration, bypasses RLS as service role)

```sql
-- a) Rewrite the single historical row so all past days resolve to 1750
UPDATE public.bmr_logs
SET bmr = 1750
WHERE client_id = 'a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f';

-- b) Make 1750 the "current" projection used by Profile card / banner
UPDATE public.profiles
SET bmr = 1750,
    bmr_updated_at = now()
WHERE id = 'a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f';
```

This is a one-off migration — `bmr_logs` keeps its UPDATE/DELETE blocking RLS for normal app use. The history-immutability rule (TW-028) is intentionally being overridden here at your explicit request.

### 2. App code

**No code changes.** Both `useProgressData.tsx` (Progress page: Action chart, Outcome chart, Steps chart, Days Missed card, Avg Deficit) and the Profile card already read directly from these two tables. They will recompute on next load.

### 3. Verification (after migration runs)

- Re-query `bmr_logs` and `profiles` for Gaurav → confirm both show 1750.
- Recompute the daily report (same script as last turn) and confirm every BMR cell shows 1750 and Total Burnt drops by 109/day.

## Out of scope

- No change to `weight_logs`, `food_logs`, `step_logs`, `workouts`, or any cached/derived tables. (The Progress page derives expenditure live; nothing to invalidate.)
- No change to the BMR-logging UI or RLS rules.

## Risk

Once executed, the original 1859 value is **lost** (single row overwrite). If you ever want to restore it I'd need to re-insert manually. Confirm you're OK with this before approving.

Approve to proceed and I'll run the migration.