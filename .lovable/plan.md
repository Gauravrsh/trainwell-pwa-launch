

## Plan: Remove Service Type from Create Training Plan Modal

### What changes

**Single file: `src/components/training-plans/CreatePlanModal.tsx`**

- Remove the entire "Service Type" section (the label + the 2-tile grid with Workout / Workout & Nutrition buttons) from the JSX
- Hard-code `serviceType` to `'workout'` as the default (already is), and remove the `setServiceType` state setter usage
- Keep the `serviceType` state variable itself so it still passes `'workout'` to `onSubmit` — backend schema, hook, and types remain untouched

No backend, database, or hook changes needed.

