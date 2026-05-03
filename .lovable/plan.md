## Remove Renew CTA from expiry warning banner

**Files:**

1. `src/components/subscription/SubscriptionExpiryWarning.tsx`
   - Remove `onRenew` from props interface
   - Remove `onRenew` from destructured params
   - Remove the `<Button>` element and unused `Button` import

2. `src/components/subscription/TrainerPlatformSubscription.tsx`
   - Remove `onRenew={() => setShowPlanModal(true)}` from `<SubscriptionExpiryWarning />` call

The lime "Renew Plan" button on the plan card remains the single CTA. Banner stays informational (icon, headline, expiry date, dismiss).