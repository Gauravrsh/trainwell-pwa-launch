
The user wants a comprehensive Vecto brand guidelines document they can paste into Gemini 3 Pro (and other tools) to generate a 5-second logo reveal animation, plus reuse across all marketing collaterals.

This is a **document/artifact task**, not a code change. I should generate a detailed brand guideline as a downloadable file (Markdown + PDF) and also include a ready-to-use Gemini prompt for the 5-sec logo reveal.

Let me check existing brand memory to ensure 100% accuracy:
- Mononym: VECTO (always uppercase)
- Lime "V" (#BFFF00), white "ECTO" (#FAFAFA)
- Background: Obsidian Black (#0A0A0A / #0F172A)
- Font: Inter, Bold, tight tracking
- Tagline: "Effort | Direction | Discipline"
- Voice: Elite Jester — Sage (Truth) + Ruler (Enforcement) + Jester (Polite Savagery)
- Philosophy: "Whatever gets tracked, gets done" / "The Mirror Doesn't Lie"
- Vector etymology: Magnitude + Direction
- App icon: lime "V" + white dot (V.) — strictly PWA only, never beside wordmark

## Plan

### 1. Generate two artifacts in `/mnt/documents/`
- **`vecto-brand-guidelines.md`** — full granular guideline
- **`vecto-brand-guidelines.pdf`** — same content rendered as PDF for sharing

### 2. Brand guideline structure (granular, agency-grade)
1. **Brand Essence** — mission, etymology (Vector = Magnitude + Direction), positioning, "Mirror Doesn't Lie"
2. **Archetype Triad** — Sage / Ruler / Jester with usage ratios
3. **Logo System**
   - Wordmark anatomy (V lime + ECTO white, exact kerning, weight)
   - App icon "V." (lime V + white dot) — PWA only
   - Clear space (= height of "V"), minimum sizes
   - DO/DON'T (no shadows, no gradients on V, no italic, never split colors differently, never place icon beside wordmark)
4. **Color System**
   - Primary: Vecto Neon `#BFFF00` (HSL/RGB/CMYK/Pantone-near)
   - Background: Obsidian Black `#0A0A0A`
   - Data White `#FAFAFA`
   - Muted neutrals
   - Color usage rules: Neon = Action/Truth/Win, White = Data, Black = Canvas. Neon ≤15% of any composition.
5. **Typography**
   - Display: Inter Bold/Black, tight tracking (-0.02em), uppercase
   - Body: Inter Regular/Medium
   - Type scale (H1-H6, body, micro)
   - Never serif. Never script.
6. **Voice & Tone** — Elite Jester rules, do/don't copy examples, prohibited softness ("we're here to help" → banned)
7. **Iconography** — Lucide stroke 1.5, lime accents only on active state
8. **Motion Principles**
   - Easing: precision cubic-bezier (0.32, 0.72, 0, 1) — confident, not bouncy
   - Tempo: snap-cuts at 200-300ms; reveals at 600-800ms
   - "Mirror" motif — split / reflect / lock
   - Sound: minimal mechanical clicks (locking sound), no whoosh
9. **Photography & Imagery**
   - Indian gym contexts, real freelance trainers (not stock)
   - High-contrast, single light source
   - Deep blacks, controlled highlights
10. **Copy Patterns** — headline formulas, CTA library, banned phrases
11. **Ad Film & Shoot Direction** — wardrobe, location, color grading LUT direction (crushed blacks, lime-only accents)
12. **Application Examples** — social post, billboard, app icon, video pre-roll
13. **Gemini 3 Pro Prompt — 5-Sec Logo Reveal** (ready to paste, with full sensory detail)

### 3. Gemini prompt design (key element)
The prompt will be a single dense paragraph specifying: aspect ratio, duration, background, exact hex colors, font, motion choreography (vector arrow drawing → V locks in → ECTO types/scrolls in → tagline fades → mirror flash), sound design notes, ending hold frame, and negative constraints.

### 4. Generation method
Use `pandoc` to convert MD → PDF with a dark theme (matching brand). Inspect the PDF after generation (convert to image, view) before delivering.

### 5. Deliverables
- `vecto-brand-guidelines.md`
- `vecto-brand-guidelines.pdf`
- Inline copy of the Gemini 5-sec logo reveal prompt in chat for immediate use

No code/component changes. No landing page edits.
