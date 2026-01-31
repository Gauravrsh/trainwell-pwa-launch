
# Progress Tracking & Monitoring Module - Implementation Plan

## Overview
This plan implements a unified progress visualization module that tracks client **Action** (intake/burn consistency) and **Outcome** (weight trends). The implementation carefully preserves all existing functionality.

---

## Current State Analysis

### Existing Data Infrastructure
| Data Point | Location | Notes |
|------------|----------|-------|
| Weight | `profiles.weight_kg` | Single static value, set during profile setup |
| Calories Intake | `food_logs.calories` | Per meal, per day |
| Protein/Carbs/Fat | `food_logs` | Available |
| BMR | **Not tracked** | Needs to be added |
| Active Calories | **Not tracked** | Needs to be added to `workouts` table |
| Weight History | **Not tracked** | Needs new `weight_logs` table |

### Existing Patterns Observed
- **Hooks pattern**: Custom hooks like `useProfile`, `useTrainerSubscription` manage data fetching
- **RLS approach**: All tables use RPC functions like `get_user_profile_id()`, `is_trainer_of_client()` for row-level security
- **Navigation**: `BottomNav.tsx` uses role-based filtering (`trainerOnly` flag)
- **Modals**: Consistent pattern with `DialogContent`, `DialogHeader`, scroll areas
- **Charts**: `recharts` already installed and wrapped via `src/components/ui/chart.tsx`

---

## Risk Mitigation Strategy

### 1. Database Changes (Low Risk)
| Change | Risk Assessment | Mitigation |
|--------|----------------|------------|
| Add `bmr` column to `profiles` | **Low** - nullable column, no breaking change | Default to NULL, existing profiles unaffected |
| Add `calories_burnt` to `workouts` | **Low** - nullable column | Default to NULL, existing workout logic unchanged |
| Create `weight_logs` table | **None** - new table | New table with FK to profiles |

### 2. Frontend Changes (Medium Risk)
| Change | Risk Assessment | Mitigation |
|--------|----------------|------------|
| Add `/progress` route | **Low** - new route | No existing route conflicts |
| Add Progress nav item | **Low** - additive | Insert between existing items, role filtering preserved |
| Update `Profile.tsx` | **Medium** - existing component | Add BMR field and weight log button in a new section, no modifications to existing layout |
| Update workout modals | **Medium** - existing components | Add optional `calories_burnt` field at the end of forms, does not change existing fields |

---

## Database Schema Changes

### Migration 1: Add `bmr` column to `profiles`
```sql
ALTER TABLE profiles 
ADD COLUMN bmr INTEGER CHECK (bmr > 0 AND bmr <= 10000);

-- Add bmr_updated_at for staleness tracking
ALTER TABLE profiles 
ADD COLUMN bmr_updated_at TIMESTAMPTZ DEFAULT now();
```

### Migration 2: Add `calories_burnt` to `workouts`
```sql
ALTER TABLE workouts 
ADD COLUMN calories_burnt INTEGER CHECK (calories_burnt >= 0 AND calories_burnt <= 50000);
```

### Migration 3: Create `weight_logs` table
```sql
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 500),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, logged_date)
);

-- RLS Policies
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own weight logs
CREATE POLICY "Clients can view own weight logs" ON weight_logs
  FOR SELECT USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can insert own weight logs" ON weight_logs
  FOR INSERT WITH CHECK (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can update own weight logs" ON weight_logs
  FOR UPDATE USING (client_id = get_user_profile_id(auth.uid()));

CREATE POLICY "Clients can delete own weight logs" ON weight_logs
  FOR DELETE USING (client_id = get_user_profile_id(auth.uid()));

-- Trainers can view their clients' weight logs
CREATE POLICY "Trainers can view client weight logs" ON weight_logs
  FOR SELECT USING (is_trainer_of_client(auth.uid(), client_id));
```

---

## Frontend Implementation

### Phase 1: New Files (No Risk)

#### 1. `src/pages/Progress.tsx`
Main progress dashboard with:
- Date range filter (default 30, max 730 days)
- Client selector dropdown (trainer view only)
- Two synchronized charts (Action and Outcome)
- Uses existing patterns from `Calendar.tsx` and `TrainerDashboard.tsx`

#### 2. `src/components/progress/ActionChart.tsx`
- ComposedChart with stacked bars (Intake, Total Expenditure)
- Line overlay for Net Deficit trend
- Red bars with "Missed" label for days without logs

#### 3. `src/components/progress/OutcomeChart.tsx`
- ComposedChart with weight trend line (connects dots, no drops to 0)
- Net Deficit line mirrored from Action chart
- Surplus/deficit zones clearly marked

#### 4. `src/components/progress/DateRangeFilter.tsx`
- Numeric input with validation
- Defaults to 30, caps at 730
- Shared state for synchronized chart updates

#### 5. `src/hooks/useProgressData.tsx`
```typescript
interface DailyProgress {
  date: string;
  intake: number | null;      // sum of food_logs.calories
  burnt: number | null;       // workouts.calories_burnt
  bmr: number;                // from profile
  totalExpenditure: number;   // bmr + burnt
  netDeficit: number;         // totalExpenditure - intake
  weight: number | null;      // from weight_logs
  isMissed: boolean;          // no intake AND no burnt
}
```

#### 6. `src/components/modals/WeightLogModal.tsx`
- Simple modal with weight input (20-500 kg range)
- Date selector (defaults to today)
- Saves to `weight_logs` table

---

### Phase 2: Minimal Updates to Existing Files

#### 1. `src/App.tsx` (Add route only)
```typescript
// Add new import
import Progress from './pages/Progress';

// Add route inside ProtectedRoute block
<Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
```

#### 2. `src/components/layout/BottomNav.tsx` (Add nav item)
```typescript
// Add TrendingUp import
import { Home, Gift, User, ClipboardList, TrendingUp } from 'lucide-react';

// Add Progress nav item (visible to both roles)
const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },  // NEW
  { to: '/plans', icon: ClipboardList, label: 'Plans', trainerOnly: true },
  { to: '/refer', icon: Gift, label: 'Refer' },
  { to: '/profile', icon: User, label: 'Profile' },
];
```

#### 3. `src/pages/Profile.tsx` (Add new section, preserve existing)
- Add "Body Metrics" section between stats and subscription
- Include editable BMR field with staleness warning (>90 days)
- Add "Log Weight" button opening WeightLogModal
- Display current weight from latest weight_log or profile.weight_kg

#### 4. `src/components/modals/ClientWorkoutLogModal.tsx` (Add optional field)
- Add "Calories Burnt (optional)" numeric field at the bottom of the form
- Does not change existing exercise logging behavior
- Value passed through to `workouts.calories_burnt` on save

#### 5. `src/hooks/useProfile.tsx` (Extend interface)
- Add `bmr` and `bmr_updated_at` to Profile interface
- No changes to existing logic

---

## Edge Case Handling

| Scenario | Implementation |
|----------|---------------|
| Missed Data | Red bar with "Missed" label when both `intake` and `burnt` are null |
| Stale BMR (>90 days) | Yellow banner: "Consider updating your BMR for better accuracy" |
| Invalid Filter Input | Reset to 30 if non-numeric or 0; cap at 730 if exceeded |
| Incomplete Weight Data | Line connects existing entries only; no interpolation or drops to 0 |
| Negative Deficit (Surplus) | Deficit line dips below 0-axis with "Surplus" zone styling |
| No BMR Set | Use default estimate based on weight/height/age or show prompt to set |

---

## File Changes Summary

| File | Type | Description |
|------|------|-------------|
| `src/pages/Progress.tsx` | **Create** | Main progress dashboard |
| `src/components/progress/ActionChart.tsx` | **Create** | Intake/burn visualization |
| `src/components/progress/OutcomeChart.tsx` | **Create** | Weight trend visualization |
| `src/components/progress/DateRangeFilter.tsx` | **Create** | Shared date range input |
| `src/components/progress/ClientSelector.tsx` | **Create** | Trainer's client dropdown |
| `src/components/progress/index.ts` | **Create** | Barrel exports |
| `src/components/modals/WeightLogModal.tsx` | **Create** | Weight logging modal |
| `src/hooks/useProgressData.tsx` | **Create** | Progress data fetching hook |
| `src/App.tsx` | **Update** | Add `/progress` route (1 line) |
| `src/components/layout/BottomNav.tsx` | **Update** | Add Progress nav item (2 lines) |
| `src/pages/Profile.tsx` | **Update** | Add Body Metrics section |
| `src/components/modals/ClientWorkoutLogModal.tsx` | **Update** | Add optional calories burnt field |
| `src/hooks/useProfile.tsx` | **Update** | Add bmr fields to interface |
| Database migration | **Create** | Add columns and weight_logs table |

---

## Implementation Order

1. **Database migrations** - Add columns and create weight_logs table
2. **New hooks** - Create `useProgressData.tsx`
3. **New components** - Create progress components and WeightLogModal
4. **New page** - Create `Progress.tsx`
5. **Navigation updates** - Update BottomNav and App.tsx routes
6. **Profile updates** - Add BMR field and weight logging to Profile.tsx
7. **Workout modal update** - Add optional calories burnt field

This order ensures all dependencies are in place before connecting them.
