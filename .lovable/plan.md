## Plan: Two-Layer Daily Nudge System (Client 9 AM + Trainer 9:30 AM)

### Overview

Two scheduled cron jobs check daily logging compliance and send push notifications:

1. **9:00 PM IST** — Notify clients who haven't logged all three (workout, food, steps) for today
2. **9:30 PM IST** — Notify trainers whose clients still have incomplete logs

### Current State

- `push_subscriptions` table exists but has **no service worker, no VAPID keys, and no push-sending code** anywhere in the codebase
- The existing `generate-expiry-notifications` edge function is a good pattern to follow (maintenance-token-secured cron job)

### What Needs to Be Built

**1. Push notification infrastructure (prerequisite)**

This is the biggest piece. Web Push requires:

- **VAPID key pair** — generate once, store public key in frontend code, private key as a secret
- **Service worker** (`public/sw.js`) — listens for `push` events, shows the notification, handles `notificationclick` to open `/calendar`
- **Frontend permission flow** — prompt client to allow notifications (after first successful log, or on calendar page), save subscription to `push_subscriptions` table
- **Edge function helper** — `send-push-notification` utility that reads `push_subscriptions` and fires `web-push` calls

**2. Edge function:** `nudge-clients` **(9 PM IST cron)**

- Secured with `MAINTENANCE_TOKEN` (same pattern as expiry notifications)
- Query: For each client with an active trainer, check today's date against `workouts`, `food_logs`, `step_logs`
- Build a list of missing items per client (e.g. "Workout, Steps")
- For each defaulter, fetch their `push_subscriptions` and send:
  - **Title**: "Hey, something is pending"
  - **Body**: "Workout/Meal/Steps are yet to be logged for the day" (dynamically lists only missing items)
  - **CTA**: "Log Now" → opens `/calendar?date=YYYY-MM-DD`

**3. Edge function:** `nudge-trainers` **(9:30 PM IST cron)**

- Same security pattern
- Query: For each trainer with active subscription, check if ANY of their clients still have incomplete logs (workout OR food OR steps missing)
- If yes, send push to the trainer:
  - **Title**: "100% logging not done"
  - **Body**: "Go to calendar to check which clients are yet to log"
  - **CTA**: "Go to Calendar" → opens `/calendar`

**4. Cron jobs (pg_cron + pg_net)**

Two scheduled HTTP calls:

- `nudge-clients` at `30 3 * * *` ( 9:00 PM IST)
- `nudge-trainers` at `0 4 * * *` ( 9:30 PM IST)

**5. Service worker click handling**

When user clicks the notification:

- Client notification → `navigateClients.openWindow('/calendar?date=2026-04-09')`
- Trainer notification → `navigateClients.openWindow('/calendar')`

### Files to Create/Modify


| File                                         | Change                                                         |
| -------------------------------------------- | -------------------------------------------------------------- |
| `public/sw.js`                               | New — service worker for push events + notification click      |
| `src/hooks/usePushSubscription.tsx`          | New — request permission, register SW, save subscription to DB |
| `src/pages/Calendar.tsx`                     | Trigger push permission prompt (once, after first log)         |
| `supabase/functions/nudge-clients/index.ts`  | New — 9 PM check + send push to defaulting clients             |
| `supabase/functions/nudge-trainers/index.ts` | New — 9:30 PM check + send push to trainers                    |
| Secret: `VAPID_PUBLIC_KEY`                   | New — needed for web-push                                      |
| Secret: `VAPID_PRIVATE_KEY`                  | New — needed for web-push                                      |
| pg_cron SQL (via insert tool)                | Two cron schedules                                             |


### Key Design Decisions

- **No in-app inbox for this nudge** — these are pure push notifications, not stored. The calendar itself is the "inbox" showing red/green status.
- **IST-only timing** — hardcoded UTC offsets since all users are Indian market. 9 PM IST = , 9:30 PM IST.
- **"Clients with an active trainer"** — only nudge clients who have a `trainer_id` set (they're in an active coaching relationship).
- **Deduplication** — the cron runs daily; if a client already logged everything by 9 PM, they get no notification. No need for a dedup table since push is fire-and-forget.
- **Graceful degradation** — if a client hasn't granted push permission, nothing happens. No fallback channel for now.

### Risks and Caveats

1. **iOS PWA limitations** — push notifications only work if the app is added to home screen on iOS 16.4+. Most Indian users are on Android where this works reliably.
2. **VAPID keys** — need to be generated once and stored as secrets. Will walk you through this.
3. **No "Remind me in 15 mins"** — per your simplified spec, this is a one-shot nudge. Clean and simple.
4. **Service worker caching conflicts** — the SW will be minimal (push-only, no caching) to avoid the PWA preview issues documented in the project constraints.