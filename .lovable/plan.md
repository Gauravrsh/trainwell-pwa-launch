

## Plan: Add "Log Steps" Feature

### Overview
Add a step count logging tile for clients alongside Log Workout and Log Food. Steps will be stored as one entry per day (overwritable), converted to estimated calories (~0.04 cal/step) for the daily burn calculation, and displayed as a separate metric in Progress charts.

### 1. Database: New `step_logs` table

```sql
CREATE TABLE public.step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  step_count integer NOT NULL,
  estimated_calories integer GENERATED ALWAYS AS (ROUND(step_count * 0.04)) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, logged_date)
);
```

RLS policies mirroring `food_logs`: clients can CRUD own rows, trainers can read client rows.

### 2. UI: Third tile in client action sheet

Update `Calendar.tsx` client action sheet from a 2-column to a 3-column grid:
- **Log Workout** (Dumbbell icon)
- **Log Food** (Utensils icon)  
- **Log Steps** (Footprints icon) — new tile

The Log Steps tile opens a simple inline input (no modal needed): numeric text field + "Log Steps" CTA button. If a log already exists for that date, pre-fill the value and allow overwrite.

Same pattern applied to `ClientDashboard.tsx` — add steps as a third daily task.

### 3. Progress integration

Update `useProgressData.tsx`:
- Fetch from `step_logs` table in the parallel query batch
- Add `steps: number | null` and `stepCalories: number` to `DailyProgress` interface
- Add step-based calories to `totalExpenditure`: `BMR + workout_burnt + step_estimated_calories`

Update `ActionChart.tsx`:
- Include step calories in the expenditure bar (stacked or combined)
- Show steps in tooltip

Update `OutcomeChart.tsx` or add a new steps trend line — **waiting on your screenshot** for the exact Progress UI treatment before implementing this part.

### 4. Files changed

| File | Change |
|------|--------|
| Migration SQL | New `step_logs` table + RLS |
| `src/pages/Calendar.tsx` | 3-col grid, steps tile, log handler |
| `src/components/dashboard/ClientDashboard.tsx` | Steps task tile + query |
| `src/hooks/useProgressData.tsx` | Fetch steps, add to expenditure |
| `src/components/progress/ActionChart.tsx` | Steps in tooltip + burn calc |
| `src/integrations/supabase/types.ts` | Auto-updated |

### Waiting on you
You mentioned you'll share a screenshot for how steps should appear in Progress. I'll hold off building until you share that. Everything else above is ready to implement.

