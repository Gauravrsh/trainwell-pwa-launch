

## Vecto Brand Guidelines v2 — Plan

Acting as Creative Director, here's what I'll deliver based on your answers.

### Scope changes
1. **Remove** Section 13 (Gemini logo-reveal prompt)
2. **Add** full Logo Variants Library (7 variants, with downloadable SVG + PNG)
3. **Add** Spacing & Layout System on an 8pt grid with social template specs (8 formats)

### What gets built

**A. Logo Variants Library — 7 variants, generated as SVG + PNG**
1. `V.` app icon — lime V + white dot (PWA only)
2. `VECTO` primary wordmark — lime V + white ECTO
3. `VECTO` + tagline stacked lockup — centered, lime `|` pipes (per your selection)
4. Horizontal lockup — V. icon + VECTO wordmark, side-by-side (for headers/email signatures)
5. Mono white knockout — full lockup in #FAFAFA on dark
6. Mono black knockout — full lockup in #0A0A0A on light
7. Lime knockout — wordmark in #0A0A0A on #BFFF00 background (high-impact CTA)

For each variant, the spec defines: construction grid, x-height, kerning, minimum size (digital + print), clear-space (= height of "V"), approved backgrounds, file naming convention.

**B. Spacing & Layout System (8pt grid)**
- Base unit `s = 8px`. Scale: 8, 16, 24, 32, 48, 64, 96, 128
- Clear-space rule: minimum padding around any logo = 1× cap-height of "V"
- Negative space rule: in any composition, ≥40% of canvas must be empty Obsidian
- Neon lime usage rule: ≤15% of pixel area
- Optical alignment notes for the V (visual vs mathematical center)

**C. Social Template Specs — 8 formats with safe-zones**

| Format | Dimensions | Use |
|---|---|---|
| Square | 1080×1080 | IG feed |
| Portrait | 1080×1350 | IG feed (preferred) |
| Story / Reel | 1080×1920 | IG / FB story, Reels |
| LinkedIn feed | 1200×628 | LinkedIn post |
| YouTube | 1920×1080 | Thumbnails, pre-roll |
| WhatsApp status | 1080×1920 | Status share |
| X / Twitter | 1600×900 | Post card |
| Billboard | 3000×1000 (3:1) | OOH |

For each: outer margin, safe-zone, logo placement zones (top-left default, bottom-center alt), headline zone, CTA zone, tagline lock-up position.

**D. Updated PDF**
- Dark theme, ~14 pages
- Renders all 7 logo variants on-page with construction grids
- Renders all 8 social templates as wireframe diagrams with measurements
- Saved as `/mnt/documents/vecto-brand-guidelines-v2.pdf`
- Logo asset files saved under `/mnt/documents/vecto-logos/`

### Method
1. Generate SVGs programmatically (precise geometry, brand-locked colors)
2. Rasterize to PNG at 1×, 2×, 3× for each variant
3. Build wireframe diagrams for the 8 social formats
4. Compose v2 markdown → render to PDF via reportlab (dark theme)
5. QA every PDF page as image; fix any clipping/contrast/overlap before delivery

### Deliverables
- `vecto-brand-guidelines-v2.pdf` (the document)
- `vecto-logos/` folder with 7 variants × (SVG + PNG@1x/2x/3x)
- `vecto-social-templates/` folder with 8 wireframe PNGs

### Three creative-director questions before I build
I'll ask these inline as I go only if blocking, but flagging upfront:
1. **Tagline weight** in the stacked lockup — Inter Medium tracked at +0.2em (refined) vs. Inter Bold tight (assertive). Default to refined unless you say otherwise.
2. **Horizontal lockup gap** between V. icon and VECTO wordmark — I'll use 1× cap-height (industry default).
3. **Social template content** — I'll show wireframes (zones only), not finished posts. Finished templates would be a separate next deliverable.
