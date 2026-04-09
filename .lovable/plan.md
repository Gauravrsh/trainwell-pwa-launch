

## Plan: Add Trainer Leave / Client Leave / Holiday to Trainer Calendar

### What changes

**1. Database migration** — Add three new values to the `session_status` enum and create a new `day_marks` table to store TL/CL/HL per client per date (independent of plan_sessions, since a mark can exist even without a session).

```sql
-- New table for trainer day marks (TL, CL, HL)
CREATE TABLE public.day_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  mark_date date NOT NULL,
  mark_type text NOT NULL CHECK (mark_type IN ('trainer_leave', 'client_leave', 'holiday')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, mark_date)
);

ALTER TABLE public.day_marks ENABLE ROW LEVEL SECURITY;

-- RLS: Trainers can CRUD marks for their clients
CREATE POLICY "Trainers can view client day marks" ON public.day_marks
  FOR SELECT TO authenticated
  USING (is_trainer_of_client(auth.uid(), client_id));

CREATE POLICY "Trainers can insert client day marks" ON public.day_marks
  FOR INSERT TO authenticated
  WITH CHECK (
    trainer_id = get_user_profile_id(auth.uid())
    AND is_trainer_of_client(auth.uid(), client_id)
    AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  );

CREATE POLICY "Trainers can delete client day marks" ON public.day_marks
  FOR DELETE TO authenticated
  USING (
    trainer_id = get_user_profile_id(auth.uid())
    AND has_active_platform_subscription(get_user_profile_id(auth.uid()))
  );

-- Clients can view marks on their dates
CREATE POLICY "Clients can view own day marks" ON public.day_marks
  FOR SELECT TO authenticated
  USING (client_id = get_user_profile_id(auth.uid()));
```

**2. Trainer action sheet** — When a trainer clicks a date, instead of jumping straight to the workout modal, show a bottom sheet (same pattern as the client action sheet) with:
- **Log Workout** (large button, existing behavior)
- **Log Food** (large button, opens FoodLogModal for the client)
- Below those, a row of **three smaller buttons**: Trainer Leave, Client Leave, Holiday
- Date rule: today and future only

**3. Calendar chip rendering** — Fetch `day_marks` for the selected client alongside workouts. On the calendar grid:
- **TL**: Show "TL" text on the chip in muted/dull color, cell background turns dull gray
- **CL**: Show "CL" text on the chip in red, cell background turns red (same as missed/skipped)
- **HL**: Show "HL" text on the chip in muted/dull color, cell background turns dull gray (same as TL)
- Day marks take visual priority over workout status

**4. Session impact logic** (save handler):
- **CL**: Increment `missed_sessions` on the active `client_training_plan` for this client
- **TL**: Extend the `end_date` of the active plan by 1 day
- **HL**: No plan changes (already factored in)
- Deleting/changing a mark reverses the effect

**5. Legend update** — Add TL, CL, HL to the status legend below the current month section.

**6. Fix runtime error** — The `showStepLogger` reference error will be cleaned up as part of the calendar refactor.

### Files affected

| File | Change |
|------|--------|
| Migration SQL | New `day_marks` table with RLS |
| `src/pages/Calendar.tsx` | Add trainer action sheet, fetch day_marks, render chips, handle save/delete of marks, fix showStepLogger error |

### Design notes
- TL and HL share the same dull/muted visual treatment
- CL uses destructive/red treatment (same as missed)
- The three leave buttons are visually smaller than Log Workout / Log Food — compact row below the main actions
- Marking a day removes any existing mark for that client+date (one mark per day per client)
