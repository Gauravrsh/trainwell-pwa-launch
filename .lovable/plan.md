

## Plan: Fix Timezone Consistency & Move Date Logic Server-Side

### Problem
All subscription date calculations (`startTrial`, `selectPlan`, `renewPlan`) use `new Date()` on the client (browser local time), while the database uses `CURRENT_DATE` (UTC). A user in IST at 11 PM could get a different date than the server, causing off-by-one issues on subscription start/end dates.

### Approach

**1. Create three server-side database functions** that encapsulate all date arithmetic using `CURRENT_DATE` (UTC):

- `start_trainer_trial(p_trainer_id uuid)` — inserts a 14-day trial with 3-day grace, returns the row
- `create_trainer_subscription(p_trainer_id uuid, p_plan_type platform_plan_type, p_is_trial_used boolean)` — inserts a paid plan with correct duration (30d / 365d) + 3-day grace
- `renew_trainer_subscription(p_subscription_id uuid, p_plan_type platform_plan_type, p_is_active boolean)` — updates existing subscription, extending from `end_date` if active or from `CURRENT_DATE` if expired

All three use `SECURITY DEFINER` with auth checks so date math stays on the server.

**2. Update `useTrainerSubscription.tsx`** to call these RPCs instead of computing dates locally:

- `startTrial()` → `supabase.rpc('start_trainer_trial', { p_trainer_id: profile.id })`
- `selectPlan()` → `supabase.rpc('create_trainer_subscription', { ... })`
- `renewPlan()` → `supabase.rpc('renew_trainer_subscription', { ... })`

Remove all client-side `new Date()` calls for subscription date generation.

**3. Normalize `getStatus()` date comparison to UTC** — change `new Date()` to extract a UTC-based "today" so the client-side status check aligns with server-stored dates.

**4. Update Razorpay webhook** — replace `new Date()` date arithmetic with Postgres `CURRENT_DATE` by having the webhook use an SQL query for date computation instead of JavaScript dates.

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Create 3 database functions |
| `src/hooks/useTrainerSubscription.tsx` | Replace client date logic with RPC calls; normalize getStatus to UTC |
| `supabase/functions/razorpay-webhook/index.ts` | Use SQL-based date computation instead of JS `new Date()` |

### What Is NOT Touched
- Calendar UI, food logs, workout logs, training plans, profile setup — all unchanged
- RLS policies — unchanged
- No other hooks or components modified

