## Slide 03 — Recreate "Think Smart Always" reference in Vecto brand

**Source reference:** uploaded `IMG-20260511-WA0082.jpg` — light layout with top-left author, top-right index, large two-line headline with one word highlight-blocked, body copy with one accented phrase, decorative dotted arrow, footer URL + "SWIPE".

**Vecto translation (locked spec, identical to slides 00–02):**
- Canvas: 1088×1344, Obsidian Black `#0F172A` background, no gradients, ~80px inset
- Top-left eyebrow: `VECTO` wordmark (V lime `#9FFF2B`, ECTO white), Inter Bold ~28px
- Top-right index: `#03` in Inter Medium lime, inside thin 1.5px lime ring pill
- Headline: two lines, Inter Extrabold all-caps, white, tracking-tight, ~150px
  - Line 1: `THINK SMART`
  - Line 2: `ALWAYS`
  - The word `SMART` sits on a solid neon lime `#9FFF2B` block (text becomes Obsidian Black for contrast) — the brand-correct equivalent of the yellow highlight in the reference
- Decorative element: thin 1px lime dotted curl-arrow to the right of "ALWAYS" (mirrors reference)
- Body copy: Inter Regular, white @ 70%, ~32px, max ~3 lines
  - `Make thoughtful decisions instead of reacting quickly. Smart thinking leads to better outcomes.`
  - `Smart thinking` rendered in solid neon lime (brand-accent equivalent of the olive emphasis in the reference)
- Footer-left: `www.vecto.fit` Inter Regular italic, white @ 60%, ~22px
- Footer-right: outlined lime pill containing `SWIPE` + neon lime right-arrow, Inter Medium ~22px (replaces the bare "SWIPE" text and matches the arrow-pill used on slides 01/02)
- Single 1px lime hairline rule under the eyebrow row, matching prior slides

**No changes to:** color tokens, typography rules, wordmark spec, or layout grid — all carried over from the locked carousel system.

**Output:**
- `src/assets/vecto_carousel_03_think_smart.png`
- Copy to `/mnt/documents/vecto_carousel_03_think_smart.png`
- QA: view rendered PNG, check for clipped text, contrast on lime highlight block, wordmark correctness (V lime / ECTO white), no overlaps. Re-render if any issue.

**No code changes.** Asset-only addition.
