
User wants: minimal pg_cron daily heartbeat to prevent Supabase Free-tier 7-day idle auto-pause. No UI, no edge function complexity, no banner. Observability comes later in admin panel.

Cheapest possible keep-alive: a `pg_cron` job that runs a trivial SQL `SELECT 1` (or writes a row to a tiny `_heartbeat` table) once a day. This counts as DB activity and resets the idle timer. No edge function needed, no `pg_net`, no auth — pure in-database work.

Going with the table-write approach over `SELECT 1` because:
1. `SELECT 1` inside cron may not register as "API/DB activity" the same way a write does (Supabase's auto-pause heuristic is based on connection/query activity, and writes are unambiguously activity).
2. A tiny audit row gives us a free record of "system was alive on day X" — useful when the admin panel arrives, zero cost now.
3. Auto-prunes itself to last 90 rows so it never bloats.

Plan is one migration. No code changes, no UI.

---

## Plan: Daily DB heartbeat (anti-pause)

**Goal:** Prevent the Supabase Free-tier 7-day idle auto-pause by generating one trivial DB write per day via `pg_cron`. Zero user-facing surface.

### What gets built (one migration)

1. **Enable `pg_cron` extension** (in `extensions` schema, not `public` — also resolves the open "Extension in Public" lint warning for any future extension work).
2. **Create `_system_heartbeat` table** (underscore prefix = internal):
   - `id bigserial`, `beat_at timestamptz default now()`
   - RLS enabled, **zero policies** → invisible to anon, authenticated, trainers, clients. Only service role / cron sees it.
3. **Create `record_heartbeat()` function** (`SECURITY DEFINER`, `search_path = public`):
   - Inserts one row.
   - Deletes rows older than 90 days (self-pruning, stays tiny).
4. **Schedule cron job** `vecto-daily-heartbeat` to run `SELECT public.record_heartbeat();` daily at **03:17 UTC** (08:47 IST — off-peak, avoids clashing with the 9 PM / 9:30 PM IST nudge jobs).

### Why this works
Supabase Free-tier auto-pauses after ~7 consecutive days of zero API/DB activity. A daily `INSERT` from `pg_cron` is real DB write activity → idle counter resets every 24h → project never reaches the 7-day threshold.

### Why no edge function / no `pg_net`
The user explicitly asked for minimal. An edge function ping would need `pg_net`, the function URL, and the anon key embedded in cron SQL — more moving parts, more failure modes, and the keep-alive value is identical. In-DB write is the floor.

### Out of scope (deferred to admin panel, per user)
- No dashboard banner
- No `health_checks` UI table for trainers/clients
- No alerting / Slack webhook
- No exposing heartbeat data via RPC

### Files touched
- One new migration: `supabase/migrations/<timestamp>_daily_heartbeat.sql`
- No frontend changes
- No edge function changes
- No `config.toml` changes

### Verification after apply
Single read query: `SELECT * FROM cron.job WHERE jobname = 'vecto-daily-heartbeat';` — confirms schedule is registered.
