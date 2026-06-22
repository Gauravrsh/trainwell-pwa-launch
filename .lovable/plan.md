## Goal
New trainers automatically get the free "Smart" plan (3 clients) on signup, so they never see the "No Active Subscription" dead-end banner.

## Changes

### 1. Auto-provision free plan on trainer creation (DB trigger)
Add an `AFTER INSERT` trigger on `public.profiles`:
- When a row is inserted with `role = 'trainer'`, insert a matching row into `trainer_platform_subscriptions` using the same logic as `start_trainer_free` (plan_type=`free`, status=`active`, 100-year end_date, max_trial_clients=3, payment_status=`not_required`).
- `SECURITY DEFINER` so it runs regardless of the inserting session.
- Guard with `ON CONFLICT DO NOTHING` / existence check so it never double-creates if a row already exists for that trainer.

This guarantees every future trainer — whether they sign up via referral link, direct invite, or any other path — lands on the dashboard with an active free subscription.

### 2. Backfill existing trainers without a subscription
One-time `INSERT ... SELECT` to create a free subscription row for any current trainer who has no row in `trainer_platform_subscriptions`. This immediately unblocks Ramakant (kirveramakant@gmail.com) and any other stranded trainer.

### 3. Remove the "No Active Subscription" banner from the dashboard
Since no trainer should ever be in the `!hasSubscription` state again, the `no_subscription` banner becomes dead UI. Plan:
- In `useSubscriptionAccess`, the `no_subscription` reason branch is unreachable in practice but I'll keep it as a defensive fallback that no longer surfaces a banner (returns `hasAccess: true` so the dashboard renders normally) — the trigger is the source of truth.
- In `TrainerDashboard` (and any other place rendering `SubscriptionEnforcementBanner` with `reason="no_subscription"`), remove that banner instance. The `subscription_expired` banner stays — that's still a valid state for paid trainers whose plan lapsed.
- The "Activate Free Plan" onboarding card in `TrainerPlatformSubscription.tsx` (Profile → Subscription) becomes unreachable too; I'll leave the code path intact as a safety net but it will not render under normal flow.

## Files touched
- New migration: trigger + backfill on `trainer_platform_subscriptions`
- `src/components/dashboard/TrainerDashboard.tsx` — remove `no_subscription` banner rendering
- `src/hooks/useSubscriptionAccess.tsx` — soften `no_subscription` branch to non-blocking

## Out of scope
- Paid plan / expiry / grace-period banners — untouched
- Free-tier 3-client cap enforcement — untouched (still gates `canInviteClients`)
