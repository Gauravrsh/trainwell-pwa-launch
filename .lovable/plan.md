

## All decisions locked

| # | Decision |
|---|---|
| 1 | Both ✏ edits AND 🗑 deletes on cached rows write to `food_dictionary_edits` (delete = negative signal) |
| 2 | Manual edit on cached row → log edit + insert corrected variant into `food_dictionary` |
| 3 | Pending rows stay pending until user manually ✏ — no auto-retry |
| 4a | Trainers do NOT log their own food. Trainer-as-client requires separate onboarding + trainer mapping. |
| 4b | **Trainers see client's diary as READ-ONLY.** No ✏ or 🗑 buttons for trainers. Only the client can edit/delete their food log, and only until end of the same day. |

---

## Phase A.2 — Today's Diary panel + manual edit + delete-with-undo

### A. Today's Diary panel (top of FoodLogModal)
- On modal open: fetch `food_logs WHERE client_id = active client AND logged_date = today`
- Group by `meal_type` in order: breakfast → lunch → snack → dinner
- Each row: meal text, kcal/P/C/F, source pill (✨ matched / 🤖 AI / ⏳ pending)
- **Client view**: rows show ✏ and 🗑 (only for `logged_date = today`)
- **Trainer view**: rows are read-only, no action buttons
- Day total below list: sums kcal/P/C/F, footnote "*Excludes N pending rows*" when applicable
- Modal stays open after save; only X closes back to Calendar

### B. Manual edit modal (client-only, ✏ button)
- Inline form: kcal / protein / carbs / fat numeric inputs
- Save flow:
  - `UPDATE food_logs` with new macros, clear `pending_analysis` if set
  - If row was a cache hit → call new `record-food-edit` edge function which writes to `food_dictionary_edits` AND inserts corrected variant into `food_dictionary` (with fresh embedding)
  - Toast: "Updated"

### C. Delete with undo (client-only, 🗑 button)
- Instant `DELETE` from `food_logs`
- 5-second toast with "Undo" → re-INSERT row if clicked
- If deleted row was a cache hit → write delete signal to `food_dictionary_edits` (sentinel: edited macros NULL, kcal_delta_pct = -100)
- Existing `check_dictionary_needs_review` trigger counts these toward 3-strikes

### D. New edge function `record-food-edit` (service role)
- Writes to `food_dictionary_edits`
- For corrected (non-delete) edits: embeds the corrected food name and inserts a new `food_dictionary` row as a variant
- Called from manual edit save and delete handler

### E. Day-end edit lock (client)
- ✏ and 🗑 disabled when `logged_date < today` (read-only past, mirrors calendar "today only" rule)
- Add small footnote on past-day diary: "Past entries locked"

### F. Out of scope
- Trainer editing/deleting client food rows (killed per Q4b)
- Trainer logging own food (killed per Q4a — separate onboarding)
- Background AI retry on pending rows
- Diary spanning multiple days

