## TW-028 — Progress page math is wrong (Avg Deficit) and BMR mutates history

### What I verified against live DB for Gaurav Sharma (`a1bb2e3b…`, BMR 1859)

Screenshot shows "View last **3** days" with these numbers:

| Card | Screenshot | Math from DB | Match? |
|---|---|---|---|
| Avg Daily Deficit | **+1114** | (1859 + 1859 + 168 + 569) / 4 = **1114** | Yes — but the inputs are wrong |
| Days Logged | **2** | Apr 27 + Apr 28 had logs | Correct |
| Days Missed | **2** | Apr 25 + Apr 26 nothing logged | Correct |
| Weight Change | — | Only one weight log | Correct (needs ≥2) |

The **calculation code itself is internally consistent**, but it produces a misleading number for two distinct reasons. The graphs and the cards then disagree because the graphs implicitly highlight the missed days as "Missed" while the card silently rolls them in.

---

### Bug 1 — Off-by-one date window

`useProgressData.tsx`:
```ts
const endDate = new Date();                  // Apr 28
const startDate = subDays(endDate, dateRange); // Apr 25 when dateRange=3
const days = eachDayOfInterval({ start, end });// 4 days, not 3
```

User typed "3"; UI generates 4 days. Same off-by-one applies to every date range (7 → 8, 30 → 31, etc.). **Fix:** `subDays(endDate, dateRange - 1)`.

### Bug 2 — Missed days are counted in the average

On Apr 25 & 26 the user logged nothing. Today's code still calculates:
```ts
totalExpenditure = bmr + (burnt||0) + stepCalories  // = 1859
netDeficit = totalExpenditure - (intake||0)         // = 1859
```
…and then averages this **1859 fake deficit** into "Avg Daily Deficit". A day with no intake logged is not a real 1859 deficit; the user just didn't track. The card label "Avg Daily Deficit" implies "average over the days where deficit could be measured."

**Fix:** Average only over `!isMissed` days. With the same data:
- Apr 27: deficit 168, Apr 28: deficit 569 → real avg = **368**, not 1114.

Also: Action chart bars and Outcome chart "Net Deficit" line should treat missed days as null (gap in the line, no expenditure bar) instead of plotting BMR-only synthetic expenditure. This stops the chart from showing tall green bars on missed days that don't match the "Days Missed" count.

### Bug 3 — BMR mutates retroactively

`profiles.bmr` is a single mutable scalar. `useProgressData` reads today's value of `profiles.bmr` and applies it to **every** day in the chart range. If the trainer/client updates BMR today, yesterday's "Total Expenditure" silently changes too — historical truth gets rewritten.

User requirement: "for BMR make sure the number on each successive value entered stays from that point onwards… BMR should not change/get updated retrospectively."

**Fix:** introduce a historical BMR log and use the BMR that was in force on each given date.

---

## Implementation plan

### A. Database — historical BMR log

New table `bmr_logs`:
```sql
create table public.bmr_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,         -- profiles.id (no FK; same convention as other *_logs)
  bmr integer not null check (bmr between 500 and 10000),
  effective_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (client_id, effective_date)            -- one BMR value per client per date
);
create index bmr_logs_client_date_idx on public.bmr_logs (client_id, effective_date desc);
alter table public.bmr_logs enable row level security;
```

RLS policies (mirror `weight_logs` & `step_logs`):
- `select`: `client_id = get_user_profile_id(auth.uid())` OR `is_trainer_of_client(auth.uid(), client_id)`.
- `insert`: same conditions, plus trainer needs `has_active_platform_subscription(...)` (per existing pattern).
- `update`/`delete`: **disallow.** BMR history is immutable; correcting a wrong entry means inserting a new one for tomorrow. (Codifies the user's "stays from that point onwards" rule.)
- Anon: deny.

Backfill: insert one row per existing profile that has a BMR set, using `bmr_updated_at::date` as `effective_date`.

`profiles.bmr` & `profiles.bmr_updated_at` stay as the convenient "current BMR" projection (used by Profile card, badges, "BMR may be outdated" banner). Both are kept in sync via the BMR write path so existing UI does not break.

### B. BMR write path

Update `BMRLogModal.handleSave`:
1. `INSERT INTO bmr_logs (client_id, bmr, effective_date=current_date)` with `ON CONFLICT (client_id, effective_date) DO UPDATE SET bmr = EXCLUDED.bmr` — so re-saving on the same day corrects today's value but past days stay frozen.
2. Continue to update `profiles.bmr` and `profiles.bmr_updated_at` (so the Profile card and stale banner keep working without further changes).

### C. Progress hook — read historical BMR per day

`src/hooks/useProgressData.tsx`:
1. Fix the off-by-one: `subDays(endDate, dateRange - 1)`.
2. Fetch `bmr_logs` for this client where `effective_date <= endDate`, ordered ascending. Also fetch the latest `bmr_logs` row strictly before `startDate` (to know the BMR in force on day 1 of the window).
3. Build a per-day BMR resolver: walk the day list ascending, advancing the "current BMR" pointer whenever `effective_date` matches today. Each day uses the BMR active **on that day**, not today's profile BMR. If no BMR was ever logged before a given day, BMR for that day is `0` (matches existing "no silent fallback" comment).
4. Recompute `totalExpenditure` & `netDeficit` per day using that historical BMR.
5. Keep `isMissed` definition the same.

### D. Progress page — correct the Avg Deficit math

`src/pages/Progress.tsx`:
```ts
const loggedDays = data.filter(d => !d.isMissed);
const avgDeficit = loggedDays.length > 0
  ? Math.round(loggedDays.reduce((s, d) => s + d.netDeficit, 0) / loggedDays.length)
  : 0;
```
The card already says "Avg Daily Deficit"; we now keep that promise. If `loggedDays.length === 0`, render `—` instead of `+0` so users do not misread "0 deficit" as "perfect maintenance".

### E. Charts — do not paint missed days as expenditure

`ActionChart.tsx` and `OutcomeChart.tsx`:
- For days where `isMissed` is true, set `intake`, `burnt`, `totalExpenditure`, `deficitValue` to `null` so Recharts leaves a gap (line) and skips the bar (bar). Tooltip on a missed day shows the existing "Missed" label only — no synthetic numbers.
- This makes the cards and the charts tell the same story.

### F. Regression tests

New `src/test/progress-math.test.ts`:
1. `useProgressData` produces exactly N days for `dateRange = N` (off-by-one guard for 1, 3, 7, 30).
2. `Progress.avgDeficit` excludes missed days. With Gaurav's exact 4 days, asserts `avgDeficit === 368` (not 1114) and `loggedDays === 2`, `missedDays === 2`.
3. Historical BMR: given two `bmr_logs` rows (1700 effective Apr 1, 1900 effective Apr 20) and a 30-day window ending Apr 28, day 14 uses 1700 and day 25 uses 1900. Updating today's BMR to 2000 does NOT change day 14's value.
4. Missed days emit `null` totals to charts — protects against future authors re-adding synthetic BMR-only bars.

### G. Documentation & memory

- Add **TW-028** entry to `docs/issue-repository.md` and `docs/issue-repository-index.md` with the RCA above and exact-numbers worked example for Gaurav.
- New memory: `mem://features/progress/calculation-rules` — codifies "Avg deficit excludes missed days; BMR is historical via `bmr_logs`; date window is inclusive of today." Linked from the index.

---

## Files to be touched

- New migration: `bmr_logs` table + RLS + backfill.
- `src/components/modals/BMRLogModal.tsx` — also insert into `bmr_logs`.
- `src/hooks/useProgressData.tsx` — date-range fix + historical BMR resolver.
- `src/pages/Progress.tsx` — exclude missed days from avg; render `—` when no logged days.
- `src/components/progress/ActionChart.tsx` — null-out missed days.
- `src/components/progress/OutcomeChart.tsx` — null-out missed days.
- `src/test/progress-math.test.ts` — new.
- `docs/issue-repository.md`, `docs/issue-repository-index.md` — TW-028 entry.
- `mem://features/progress/calculation-rules` — new memory + index update.

### Worked example after fix (Gaurav, last 3 days)

Window becomes Apr 26, 27, 28 (3 days, off-by-one fixed). Apr 26 missed → excluded from avg. `avgDeficit = (168 + 569) / 2 = 369`. Days Logged = 2, Days Missed = 1, charts show no bars/line on Apr 26.

---

Approve to implement.