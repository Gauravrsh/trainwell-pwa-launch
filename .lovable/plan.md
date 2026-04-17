

## Two parts: (A) Diagnosis & fix for "Failed to log food", (B) PRD + wireframes for redesign

---

## PART A — Why food analysis fails (root cause)

Looked at the `analyze-food` edge function logs for the user `gaurav.sharma@fplabs.tech` (user_id `8dce19...`). Two attempts at 13:37 IST today, both failed at the **AI Gateway** with:

```
AI Gateway error: 402 {"type":"payment_required","message":"Not enough credits"}
```

This is **not a code bug** — the camera, JWT auth, and base64 upload all worked correctly. The Lovable AI workspace ran out of credits, so Gemini refused the request. The edge function returns a generic 500, the frontend shows "Failed to log food", and the user has no clue why.

**Three fixes needed (all small):**

1. **Surface the real reason in the UI.** When the edge function gets a 402 from the gateway, return `{ error: 'AI credits exhausted', code: 'CREDITS_EXHAUSTED' }` with status 402. The modal then shows: *"Food AI is temporarily out of credits. Please try again in a few hours, or log manually below."*
2. **Add a manual fallback path.** If AI fails, let the user save the meal with just `mealType` + `rawText` and zero macros (or a numeric override). Right now the save is hard-blocked on a successful analysis.
3. **Top up credits.** Out of scope for code — you'll need to add credits in the Lovable workspace billing. I'll flag this in the response so you can act on it.

---

## PART B — Food Logging Modal v2 PRD

### Inspiration audit (HealthifyMe / MyFitnessPal / Lifesum / Cal AI)

| Pattern | What works | What we adopt |
|---|---|---|
| **Snap → instant macros** (Cal AI, HM Snap) | One tap from home → camera fills viewport → AI runs → results in <5s | "Snap" as the default tab. Camera button is hero. |
| **Tabbed input** (HM, MFP) | Snap / Describe / Search / Recent — segmented control on top | 3 tabs: **Snap**, **Describe**, **Recent** (Search deferred to v3) |
| **Editable result rows** (all majors) | Each detected item is a row with qty stepper + macro chips; tap to edit | Inline edit on each row; remove with swipe / × button |
| **Meal slot pre-selected** (Lifesum) | App auto-picks meal type by time of day (breakfast 4-11, lunch 11-16, dinner 16-22, snack else) | Time-aware default; user can override |
| **Sticky bottom CTA** (HM) | Big "Add to Diary" pill always visible, shows running kcal | Sticky footer with `Total: X kcal` and primary "Save Meal" |
| **Recent meals chips** (MFP "Recent") | One-tap re-log of yesterday's breakfast | Show last 5 logged items as chips under Describe tab |

### Goals
1. Reduce time-to-log from current ~25s to **under 8s** for photo path, **under 12s** for text.
2. Zero dead-ends — every failure mode (no credits, blurry photo, unrecognized food) has a manual escape hatch.
3. Feels like a native iOS sheet, not a desktop dialog.

### Non-goals
- Barcode scanner (v3).
- Custom recipe builder (v3).
- Searchable food database (v3 — needs DB seeding).

### Wireframe

```text
┌─────────────────────────────────────────┐
│  ╳                            🍽 LOG FOOD│  ← header, bottom-sheet style
├─────────────────────────────────────────┤
│  [🌅 Breakfast ▾]  ← smart default      │
│                                         │
│  ┌───────┬──────────┬──────────┐        │
│  │ 📷 SNAP│ ✏ DESCRIBE│ 🕐 RECENT│        │  ← segmented tabs
│  └───────┴──────────┴──────────┘        │
│                                         │
│  ╔══════════════════════════════════╗   │
│  ║                                  ║   │
│  ║         📷  TAP TO SHOOT          ║   │  ← Snap tab: full-bleed
│  ║         ────────────             ║   │     camera button, big
│  ║         or  📁 from gallery       ║   │     and inviting
│  ║                                  ║   │
│  ╚══════════════════════════════════╝   │
│                                         │
│  ─── after analysis ───                 │
│  ┌──────────────────────────────────┐   │
│  │ Roti                    1 pc  ⊖⊕│   │  ← editable rows
│  │ 80 kcal · 3p · 15c · 1f      ╳ │   │     qty stepper, swipe-X
│  ├──────────────────────────────────┤   │
│  │ Dal                  1 cup  ⊖⊕ │   │
│  │ 150 kcal · 9p · 20c · 4f     ╳ │   │
│  └──────────────────────────────────┘   │
│                                         │
│  + Add another item manually            │  ← escape hatch
│                                         │
├─────────────────────────────────────────┤
│  Total: 230 kcal · 12p · 35c · 5f       │  ← sticky footer
│  ┌────────────────────────────────┐     │
│  │       SAVE MEAL  →             │     │
│  └────────────────────────────────┘     │
│  Save & log next meal                   │  ← secondary link
└─────────────────────────────────────────┘
```

**Describe tab:** swap camera area for the existing textarea + "Recent meals" chips above it (e.g., "Yesterday's breakfast", "Tuesday's dinner") — one tap pre-fills the text.

**Recent tab:** vertical list of last 7 days of logs grouped by day; tap any to clone with today's date.

**Error state (credits exhausted):**
```
┌──────────────────────────────────┐
│ ⚠ Food AI is busy. Try again in   │
│   a few hours, or enter macros   │
│   manually below.                 │
│                                   │
│ [Calories]  [Protein] [Carbs] [Fat]│
└──────────────────────────────────┘
```

### Build phases (after your approval)
- **Phase 1 (this loop):** Fix credit error surfacing + manual macro fallback. Unblocks you immediately.
- **Phase 2:** Rebuild modal shell — segmented tabs, sticky footer, smart meal-type default, editable result rows.
- **Phase 3:** "Recent meals" chips (needs a small query against `food_logs` table, no schema change).
- **Phase 4 (later):** Barcode + searchable DB.

### Open questions for you
1. Do you want the **smart meal-type default** (auto-pick by time of day), or always start at Breakfast like today?
2. For **Recent meals**, should it show items from the **client's own** logs only, or also pull what their **trainer logged for them**?
3. On the credits-exhausted fallback, should manual macros be **required** (block save) or **optional** (allow save with zeros, mark as "macros TBD")?
4. Approve the **3-tab structure** (Snap / Describe / Recent), or do you want Snap and Describe merged into one screen like today (with both visible at once)?

