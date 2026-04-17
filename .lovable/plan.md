

## Locked: Choice A — save every AI result to dictionary immediately

Bad entries will self-correct via the implicit feedback loop (3+ user edits with >25% kcal delta → flip `needs_review = true` → stop serving from cache).

---

## Phase A — Final Build Plan

### 1. Database migration
- Enable `pgvector` extension
- Table `food_dictionary`: `id`, `food_name`, `quantity_unit`, `base_quantity`, `base_kcal/p/c/f`, `embedding vector(768)`, `usage_count`, `last_used_at`, `original_raw_text`, `needs_review` bool, `created_at`. HNSW index on embedding.
- Table `food_dictionary_edits`: `dictionary_id`, `client_id`, original vs edited macros, `edited_at`. Trigger flips `needs_review = true` when 3+ rows show >25% kcal delta.
- RLS: authenticated read on dictionary; insert/update via edge function (service role) only. Edits log writable by authenticated users for own client_id.

### 2. New edge function `lookup-or-analyze-food`
1. Receive `raw_text` + `meal_type`
2. Parse quantity (regex: 15 supported units — roti, cup, piece, pc, g, gm, grams, katori, bowl, plate, slice, spoon, tbsp, tsp, ml, l) → split food name + multiplier
3. Embed food name via Lovable AI `text-embedding-004`
4. Vector search top 3 in `food_dictionary` where `needs_review = false`
5. Best distance < **0.20** → return cached macros × multiplier, `source: "cache"`
6. Else → call Gemini → write result to dictionary (Choice A: every result) → return `source: "ai"`
7. Bump `usage_count`, `last_used_at` on hit
8. Feature flag `ALLOW_AI_RETRY_FOR_SEEDING` (default true) — allows cold-start AI re-runs to seed dictionary fast

### 3. FoodLogModal — Describe tab only
- Switch Describe-tab calls from `analyze-food` → `lookup-or-analyze-food`
- Cached results show **"✨ matched from kitchen"** pill next to meal name
- User edits to a cached result → POST to `food_dictionary_edits` + update food_log row
- **Recent tab**: filter by currently selected `meal_type` (breakfast → only breakfast recents, etc.)
- **Snap tab unchanged** for v1

### 4. Today's Diary panel (carryover from prior approval)
- Fetch `food_logs` for `(client_id, logged_date)` on open → render at top
- Day total below the list, excludes pending-analysis rows with footnote
- Each row: ✏ (manual edit, both client + trainer) and 🗑 (instant delete + 5s undo toast)
- Pending rows: ⏳ marker, tap ✏ opens manual macro entry (Option B from prior approval)
- Modal stays open after save; only X closes back to Calendar

### 5. Cost summary
- pgvector storage at 100k entries: ~300MB — well within Supabase Pro
- Embeddings: ~1/100th of a Gemini call — rounding error
- Net: AI credit burn *reduced* long-term; no Lovable plan upgrade needed for vector storage; Supabase Pro ($25/mo) needed around 5k users regardless

### 6. Explicitly NOT building
- Re-analyze button (forbidden)
- Auto-retry on app open (killed)
- Image embeddings (Phase B)
- Trainer-verified flag (killed — client is primary validator)
- Per-trainer scoping (killed — global dictionary)
- Snap tab cache integration (Phase B)

