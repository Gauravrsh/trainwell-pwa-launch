## Goal

In the Steps card (used in both client and trainer Progress views), replace "yesterday's step count" with **average steps per day across the selected window**.

## Scope

Single file: `src/components/progress/StepsChart.tsx`. The component is shared by client view and trainer view (rendered from `Progress.tsx`), so one change covers both.

## Changes

1. **Compute `avgSteps`** = `Math.round(sum(d.steps ?? 0) / data.length)`. Missed/unlogged days count as 0 (per Binary Truth philosophy — confirmed).
2. **Big number** changes from `latestSteps` → `avgSteps`.
3. **Subtitle** below the number changes from a date (`"11 May 2026"`) to:  
   `"Avg steps per day, in last X days"` where `X = data.length`.
4. **km derived metric** = `(avgSteps * 0.0008).toFixed(1)` — recomputed off the average.
5. **kcal derived metric** = `Math.round(avgSteps * 0.04)` — recomputed off the average.
6. **Progress bar** = `(avgSteps / 10000) * 100`, capped at 100. Goal label `"Goal: 10,000"` stays.
7. **Empty-state guard** updated: show the summary block only if at least one day has logged steps (existing `hasAnySteps` logic kept).
8. **Bar chart below stays untouched** — it continues to show daily values across the window.
9. Drop the now-unused `latestLogged` / `latestSteps` derivations.

## Out of scope

- Date-range filter UI itself (already drives `data` length upstream).
- Action chart, Outcome chart, BMR/weight chart — only Steps card is changing.
- Backend / data-fetch logic.

## QA

After edit: open Progress page in client view and trainer view, verify big number reads as a sensible average, subtitle reads `"Avg steps per day, in last X days"` matching the date-range filter, km/kcal scale with the average, progress bar reflects avg vs 10k.
