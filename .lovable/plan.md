

# Plan: Clean Up Defunct UI Elements

## Changes

### 1. Profile Menu — Remove 4 dead links (items 1-4)
**File: `src/pages/Profile.tsx`**
- Remove Settings, Notifications, Privacy, Help & Support from `menuItems` array
- Keep only Terms & Conditions
- Clean up unused icon imports (`Settings`, `Bell`, `Shield`, `HelpCircle`)

### 2. "Client Training Plans" button — Fix navigation (item 5)
**File: `src/components/subscription/SubscriptionSection.tsx`**
- Wire `onNavigateToClientPlans` to actually navigate to `/plans`

**File: `src/pages/Profile.tsx`**
- Change `onNavigateToClientPlans` callback from `console.log` to `navigate('/plans')`

### 3. Trainer Dashboard: Remove ChevronRight button (item 6)
**File: `src/components/dashboard/TrainerDashboard.tsx`**
- Remove the `<Button size="sm" variant="ghost"><ChevronRight /></Button>` from client cards (lines 259-261)
- Remove `ChevronRight` from imports if no longer used

### 4. Trainer Dashboard: Remove "Request Payment" button (item 7)
**File: `src/components/dashboard/TrainerDashboard.tsx`**
- Remove the "Request Payment" button and related handler (`handleRequestPayment`)
- Remove `PaymentRequestModal` usage and import
- Remove `IndianRupee` import, `selectedClient` state, `showPaymentModal` state
- Remove the entire Actions div wrapper since both buttons are being removed

### 5. Client Subscription View: Remove service type label (item 8)
**File: `src/components/subscription/ClientSubscriptionView.tsx`**
- Remove the `<p>` tag at lines 82-86 that shows "Workout & Nutrition" / service_type
- Just show the plan name and Active badge, no service type subtitle

### 6. Client Dashboard: Remove "Tasks Done" stat (item 9)
**File: `src/components/dashboard/ClientDashboard.tsx`**
- Remove the Trophy/Tasks Done card from the stats grid (lines 468-474)
- Change grid from `grid-cols-3` to `grid-cols-2` (Steps + Calories remain)
- Remove `Trophy` from imports

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Remove 4 menu items, fix Client Plans nav |
| `src/components/subscription/SubscriptionSection.tsx` | No change needed (callback comes from Profile) |
| `src/components/dashboard/TrainerDashboard.tsx` | Remove Request Payment button, ChevronRight button, related state/imports |
| `src/components/subscription/ClientSubscriptionView.tsx` | Remove service type label |
| `src/components/dashboard/ClientDashboard.tsx` | Remove Tasks Done stat, adjust grid |

