## One-off Data Patch — BMR Backfill for Gaurav Sharma

### Confirmed inputs (already verified via DB read)
- **Profile ID:** `a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f`
- **Email:** gaurav.rsh@gmail.com
- **Current `profiles.bmr`:** **1859**
- **Existing `bmr_logs`:** 1 row (`1859` on `2026-04-28`) — left untouched

### Why a migration (not the insert tool)
The `bmr_logs` INSERT policy requires `client_id = get_user_profile_id(auth.uid())` — only the user themselves can insert their own row. A migration runs as table owner and bypasses RLS, which is the only way to insert this row on Gaurav's behalf without him being logged in.

### Exact action — single migration, single SQL statement
Create file: `supabase/migrations/<timestamp>_backfill_bmr_gaurav_jan1.sql`

```sql
-- One-off data patch: backfill BMR for user Gaurav (gaurav.rsh@gmail.com)
-- Inserts a single bmr_logs row dated 2026-01-01 with current BMR value (1859)
-- so progress calculations from Jan 1 onward use this BMR.
-- Scoped strictly to one profile_id. No schema changes. No other users affected.

INSERT INTO public.bmr_logs (client_id, bmr, effective_date)
VALUES ('a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f', 1859, '2026-01-01');
```

### What I will NOT do
- No code changes (no .ts/.tsx files touched)
- No RLS / policy / schema / function changes
- No other users' data touched
- No tests added
- No issue repository entry (per your instruction — not a bug)
- No memory updates

### Post-execution verification
Re-query `bmr_logs` for `client_id = 'a1bb2e3b-…'` and show you the resulting 2 rows:
- `2026-01-01 → 1859` (new)
- `2026-04-28 → 1859` (existing)

Effective historical BMR = flat 1859 from Jan 1 → today, matching Option 2 intent.

### Risk
Near-zero. Single INSERT of one row, hard-coded UUID, no joins, no cascades, no triggers on `bmr_logs`.

Approve to proceed.