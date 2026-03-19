

## Logo Enhancement — SVG Preview

I'll update only the `public/favicon.svg` file so you can see the enlarged waveform logo directly in the browser preview. No other files will be touched until you approve the design.

### Updated SVG

The new favicon.svg will have:
- **Waveforms span x: 4 to 28** (was 8 to 24) — 75% of width vs 50% before
- **Top waveform:** `M4 14 L10 7 L16 14 L22 7 L28 14` — centered higher with more amplitude
- **Bottom waveform:** `M4 25 L10 18 L16 25 L22 18 L28 25` — at 50% opacity, spaced further from top
- **Stroke width: 3.5** (was 3) — thicker for better visibility at small sizes
- **Same rounded corners** (`rx="8"`), same colors (`#0a0a0a` bg, `#BFFF00` strokes)

### What changes
- `public/favicon.svg` — single file update with enlarged waveform paths

### Next steps after approval
Once you approve the SVG, I'll generate matching PNG assets at all required sizes (192, 512, 180) and update the splash screen, nav, footer, and cache-bust all references.

