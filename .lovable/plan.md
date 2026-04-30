## Weight Carry-Forward Logic — Implementation Plan

### Goal
Treat the **latest logged weight as the user's weight for every consecutive day until a fresh weight is logged**, across all weight displays and the Weight Change stat. No fabrication for days before the first-ever weight log. BMR is never recomputed from this.

### Confirmed scope (per your answers)
1. **Seed before window:** YES — fetch the latest weight log strictly before the window start and carry it into day 1.
2. **Days before any weight ever existed:** stay `null` (no fabricated history, gap on chart).
3. **Weight Change stat:** use carried-forward values (true change across the window).
4. **No BMR recomputation.** Weight carry-forward applies only to the Outcome chart (Chart 2) + Weight Change stat. No other math touched.

---

### Files to change

**1. `src/hooks/useProgressData.tsx`** (single source of truth)
- Add a 7th parallel query: latest `weight_logs` row strictly **before** `startDateStr` (limit 1, descending). Mirrors the existing `bmrPriorRes` pattern exactly.
- Replace the current "weight = `weightByDate[dateStr] ?? null`" mapping with a carry-forward walk:
  - Initialize `currentWeight = seedWeightFromPrior ?? null`.
  - For each day ascending: if `weightByDate[dateStr]` exists → update `currentWeight` to that value. Then assign `weight = currentWeight` (which stays `null` until the first-ever log appears).
- The `DailyProgress.weight` field now means "effective weight on that day" instead of "logged that day". This is the only behavioural change in the hook.

**2. `src/components/progress/OutcomeChart.tsx`**
- No code change needed — it already reads `day.weight` and `connectNulls`. With carry-forward in the hook, the line will now render a flat segment between logs (correct visual for "weight held steady until next log") instead of interpolating a slope between two distant points.
- Tooltip text "No weight logged" still triggers correctly for pre-first-log days (where `weight` remains `null`).

**3. `src/pages/Progress.tsx`** (Weight Change stat)
- Currently computes weight delta from first vs last **logged** entry in the window. Switch to: first non-null vs last non-null of the now-carried-forward `data[].weight` array.
- If everything is still `null` (no log ever) → render `—` as today.

**4. `src/test/progress-math.test.ts`**
- Add a new `describe` block: **"Weight carry-forward"** with these cases:
  - Log on day 1 (72), log on day 6 (71): days 1–5 = 72, days 6+ = 71.
  - Seed from before window: latest prior log = 70 → day 1 of window = 70 until next log inside window.
  - No prior log + first in-window log on day 10: days 1–9 = `null`, days 10+ = that value.
  - Weight Change stat uses carried-forward first vs last (not raw logged first vs last).
  - No log ever → weight array all `null`, Weight Change = `—`.

---

### What I will NOT touch
- BMR logic, deficit math, Action chart, Steps chart, Calendar — untouched.
- No DB schema changes, no migrations, no RLS changes.
- No data backfill for any user.
- `weight_logs` table and `WeightLogModal` flow — unchanged. Users still log discrete weight events; carry-forward is purely a read-side derivation.

### Risk
Low. Single hook change + one stat recalculation + tests. The chart component is unchanged. If carry-forward ever feels wrong, reverting the hook restores prior behaviour.

### Verification after build
- Run the test suite (`vitest run`) — all existing TW-028 tests must still pass + new weight tests pass.
- Spot-check Gaurav's profile: Outcome chart should now show a flat-then-step weight line instead of dotted gaps, and the Weight Change number should reflect carried-forward delta.

Approve to proceed.