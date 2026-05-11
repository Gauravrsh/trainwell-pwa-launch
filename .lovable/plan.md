## Goal

Produce 5 independent, on-brand static creative templates as PNGs, delivered to `/mnt/documents/`. These are template canvases — adaptation to other formats (4:5, 9:16, story) happens in a separate step.

## Brand Compliance (non-negotiable)

- Background: Obsidian Black `#0F172A` for 4 templates, Vecto Neon `#9FFF2B` for 1 accent template
- Text/data color: White on black; Black on lime
- Action color: Vecto Neon `#9FFF2B` used as accent only on black templates
- Wordmark: `VECTO` always uppercase, mononym, used as a corner mark only (never paired with the V. icon)
- Voice cue: clinical / minimalist / "Binary Truth" — no decorative arrows, no gradients, no emojis
- 80–85% blank canvas reserved for later copy

## Layout System (shared across all 5)

Fixed three-band grid drawn as faint guides (10% opacity hairlines) so the designer/copy step knows exactly where to drop content:

```
┌─────────────────────────────┐
│ HEADER  (top 15%)           │  short label / eyebrow
│ ─────────────────────────── │
│                             │
│ BODY    (middle 60%)        │  headline + supporting copy
│                             │
│ ─────────────────────────── │
│ FOOTER  (bottom 15%)        │  CTA / handle / wordmark
└─────────────────────────────┘
```

- 64 px outer safe margin
- Hairline band dividers at ~10% opacity
- Tiny `HEADER` / `BODY` / `FOOTER` labels at 8pt, 30% opacity, in the outer margin (printers-mark style) — easy to remove, helpful for adaptation

## The 5 Templates (each 1080×1080 PNG, independent design)

Each gets a different motif, all drawn from the approved set (no geometric arrows):

1. **T1 — Obsidian Mark**
   - Black bg. Single tiny `VECTO` wordmark, bottom-right, white, 14pt, tracked +200.
   - Otherwise pure negative space. The "purest" template.

2. **T2 — Neon Streak (Top)**
   - Black bg. One single, razor-thin (2 px) horizontal Vecto Neon streak across the top header band. `VECTO` wordmark bottom-left.
   - Premium minimalist energy.

3. **T3 — Neon Streak (Side Rule)**
   - Black bg. One vertical 2 px Vecto Neon streak hugging the left safe margin, full bleed top-to-bottom. `VECTO` wordmark bottom-right.
   - Magazine editorial feel.

4. **T4 — Binary Calendar Watermark**
   - Black bg. Faint 7×3 grid of small rounded-square cells in the footer band, alternating very-low-opacity Red and Vecto Neon (≤15% opacity) — evokes the Binary Truth calendar without dominating. `VECTO` wordmark top-left.

5. **T5 — Lime Inversion (the 1 accent)**
   - Vecto Neon `#9FFF2B` bg. All marks in `#0F172A`/Black. Tiny `VECTO` wordmark bottom-right in black. No streaks.
   - The "loud" template for hero posts / announcement slides.

## Production Approach

- Generate as code-drawn PNGs (Python + Pillow) — guarantees exact hex values, exact alignment, crisp 1 px hairlines, perfect typography. AI image generation is unsuitable for brand-compliant geometric work.
- Font: Inter (matches in-app body) for wordmark; falls back to system sans if Inter unavailable.
- Output:
  - `/mnt/documents/vecto-ig-template-01-obsidian-mark.png`
  - `/mnt/documents/vecto-ig-template-02-neon-streak-top.png`
  - `/mnt/documents/vecto-ig-template-03-neon-side-rule.png`
  - `/mnt/documents/vecto-ig-template-04-binary-watermark.png`
  - `/mnt/documents/vecto-ig-template-05-lime-inversion.png`
- Plus a contact-sheet `vecto-ig-templates-overview.png` showing all 5 side-by-side for quick comparison.

## QA Step

After generation: open each PNG, verify hex values, margins, wordmark placement, and that the body band remains visually empty. Re-render any that fail before delivering.

## Out of Scope (step 2)

- Filling in copy
- Adapting to 4:5, 9:16, story, or carousel size variants
- Multi-slide carousel sequences

Approve and I'll generate the 5 PNGs + overview sheet.