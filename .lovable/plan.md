## Goal
Split the single-tap "Analyse with AI & Save Meal" into an explicit two-step flow so users can review/edit the AI-detected item breakdown before the meal is persisted.

## Behavior

**Step 1 — Analyse**
- CTA label: **"Analyse with AI"**
- Tapping calls `analyzeFood()` (photo or text) exactly as today.
- On completion, the "Detected (N)" editable breakdown card remains rendered (items, per-item macros, add/remove/edit controls — all already built).
- No save is triggered. The auto-save-on-analyze effect is removed for this path.

**Step 2 — Save**
- Once `items.length > 0` (AI returned results OR cache hit populated items), the CTA swaps to **"Save Meal"**.
- Tapping calls `performSave(false)` → success toast → `finalizeAfterSave()` (same as today).
- User can freely edit the Detected list between step 1 and step 2.

**Cache-hit path**
- Vector cache hit still populates `items` directly (no AI call). CTA immediately shows "Save Meal" — user gets the same review-then-save affordance for consistency. (Confirming this in the plan; if you'd rather keep cache hits as single-tap auto-save, say so and I'll flip it.)

**Reset / cancel**
- Switching tabs, changing meal type, or clearing photo/text resets `items` → CTA reverts to "Analyse with AI".

## Technical Details

File: `src/components/modals/FoodLogModal.tsx`

1. **Remove** the auto-save `useEffect` at lines ~449–462 (`autoSaveAfterAnalyzeRef` block). Also remove the ref declaration and any places it's set to `true` before `analyzeFood()`.
2. **CTA label logic** — replace the current merged label with:
   ```
   items.length > 0 ? "Save Meal" : "Analyse with AI"
   ```
   Loading states unchanged (`"Analysing…"` / `"Saving…"`).
3. **CTA onClick** — branch on `items.length`:
   - `0` → `analyzeFood()`
   - `>0` → `performSave(false)` then toast + `finalizeAfterSave()`
4. Leave the Detected breakdown block (`FoodLogModal.tsx:762+`) as-is — it already renders whenever `items.length > 0`.
5. Ensure `resetForm()` / tab change / meal type change still clear `items` so CTA returns to step 1.

No changes to `FoodDiaryPanel`, `FoodSessionSummary`, edge functions, or DB.

## Verification
- Snap tab: upload photo → tap "Analyse with AI" → Detected list appears → CTA now says "Save Meal" → edit an item → tap "Save Meal" → toast + diary updates.
- Describe tab: same flow with text input.
- Cache hit: text describes a known meal → items populate without AI call → CTA shows "Save Meal" immediately.
- Cancel path: after step 1, clear text/photo → items reset → CTA returns to "Analyse with AI".
