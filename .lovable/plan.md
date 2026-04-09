

## Plan: Add Steps Chart to Progress Page

Based on the Samsung Health reference screenshot, create a dedicated Steps card in the Progress page.

### New component: `src/components/progress/StepsChart.tsx`

A card containing:
1. **Bar chart** — daily step bars over the selected date range. Green bars for days with steps logged, gray for no data. A dashed green reference line at the 10,000 target.
2. **Latest day summary** — large "7,923 steps" style display for the most recent logged day.
3. **Progress bar** — green fill showing steps vs 10,000 target (hardcoded default for now).
4. **Derived metrics row** — two stats separated by dividers: estimated **km** (`steps × 0.0008`) and estimated **kcal** (`steps × 0.04`). Skipping "floors" since we don't track that.

### Updated files

| File | Change |
|------|--------|
| `src/components/progress/StepsChart.tsx` | New component |
| `src/components/progress/index.ts` | Export StepsChart |
| `src/pages/Progress.tsx` | Render StepsChart card between Action and Outcome charts, with Footprints icon header |

### Design
- Dark card matching existing Action/Outcome chart cards
- Emerald/green color for bars and progress bar (consistent with the reference)
- Gray bars and muted text for no-data days
- No database or hook changes needed — `useProgressData` already returns `steps` and `stepCalories`

