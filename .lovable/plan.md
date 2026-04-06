

# Vecto Brand Identity & Logo Creation

## Brand Direction Summary

**Brand name**: VECTO (all-caps in logo, capitalized in text)
**Domain**: vecto.fit (digital address only, never in brand name)
**Tagline**: "Performance with Direction."
**Palette**: Dark (#0a0a0a) + Lime (#BFFF00) — unchanged
**Archetype**: The Performance Architect — Sage × Ruler × Jester

The `.fit` suffix appears only in the footer and link contexts. The logo, nav, splash screen, and all brand touchpoints say **VECTO**.

## Plan

### Step 1: Design Philosophy (.md file)
Create a design philosophy document rooted in the brand's vector/direction/magnitude identity — geometric precision, clinical authority, forward momentum. This guides all visual output.

### Step 2: AI-Generate Logo Mark
Use `google/gemini-3-pro-image-preview` to generate 3 logo variations:
- **Variation A**: Geometric "V" mark with embedded vector/arrow motif — sharp, angular, lime on dark
- **Variation B**: Abstract directional mark (magnitude + direction concept) — minimal, iconic
- **Variation C**: Bold typographic "VECTO" wordmark with integrated vector element

Prompt will emphasize: flat design, no gradients, app-icon suitable, works at 32px and 512px, lime #BFFF00 on #0a0a0a, geometric precision, clinical authority.

### Step 3: Brand Name Element (Canvas Art)
Using the canvas-design skill, create a brand identity sheet (.pdf) showing:
- The selected logo mark at multiple sizes
- "VECTO" wordmark in a clean geometric font (Outfit Bold or BigShoulders Bold from available fonts)
- Color palette swatches
- Usage: "VECTO" in nav/header, "vecto.fit" in footer only

### Step 4: QA & Deliver
- Visually inspect all generated assets
- Deliver logo variations as downloadable PNGs + brand sheet as PDF to `/mnt/documents/`
- Present for your selection before proceeding with the full codebase migration

### What This Does NOT Include (Next Phase)
- Replacing "TrainWell" across 25+ source files
- Updating manifest.json, index.html, OG tags, PWA icons
- Generating all PWA icon sizes from the chosen logo
- Updating email references and landing page copy

### Technical Details
- Logo generation via `/tmp/lovable_ai.py --image --model google/gemini-3-pro-image-preview`
- Brand sheet via Python PDF generation with canvas-design fonts
- All outputs to `/mnt/documents/vecto-brand/`

