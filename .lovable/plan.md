

## Comprehensive Pre-GTM Testing Plan

Given that you're onboarding real trainers and clients, here's a structured approach combining automated checks, manual flows, and production readiness validation.

### 1. Automated Code & Security Checks (I can run now)
- **Database linter** — check for missing RLS, permissive policies, exposed tables
- **Security scan** — identify vulnerabilities before real user data flows in
- **Edge function smoke tests** — hit each function (`nudge-clients`, `nudge-trainers`, `analyze-food`, `razorpay-webhook`, `generate-expiry-notifications`) and verify responses
- **Build verification** — confirm no TypeScript errors, no dead imports

### 2. Critical User Flow Testing (Browser-based, I can do)
Walk through every flow as both trainer and client:

| Flow | What to check |
|------|---------------|
| Signup → Role Selection → Profile Setup | No blank screens, correct redirects, validation works |
| Trainer: Log workout/meal/steps for client | Calendar renders, modals open/close, data persists |
| Client: View and mark as done | Correct data shows, can't edit past dates |
| Push notification opt-in | Permission prompt triggers, subscription saves to DB |
| Subscription purchase | Razorpay flow, plan enforcement banner, grace period |
| Referral flow | Code generation, sharing, redemption |
| Progress charts | Data renders, no blank charts, date filters work |
| Training plans | Create, assign, view as client |
| Landing page (logged out) | All sections render, CTA links work, responsive |

### 3. Cross-Device Responsive Testing
Test on key Indian market viewports:
- iPhone SE (375×667) — budget iPhone segment
- Samsung Galaxy A series (360×800) — dominant Android
- iPad (768×1024) — tablet trainers
- Desktop (1440×900) — gym desktop

Check: modals centered, no overflow, bottom nav usable, text readable

### 4. Data Integrity Checks (DB queries)
- Profiles with missing `trainer_id` or incomplete setup
- Orphaned records (workouts without valid client, subscriptions without trainer)
- Push subscriptions table health
- Cron job schedule verification (`cron.job` table)

### 5. Edge Cases & Error States
- What happens with no internet? (PWA offline behavior)
- Empty states — new trainer with 0 clients, new client with no logs
- Expired subscription behavior
- Invalid/expired push subscriptions cleanup

### 6. Production Readiness Checklist
- PWA manifest and icons correct
- Service worker registered
- `robots.txt` configured
- Error boundary catches crashes gracefully
- Splash screen doesn't hang indefinitely

### Recommended Approach

I can start right now by running the **automated checks** (security scan, DB linter, edge function tests, data integrity queries) — these require no manual interaction and will surface issues immediately. Then we move to **browser-based flow testing** for the critical paths.

This gives you a prioritized punch list of fixes before onboarding real users.

