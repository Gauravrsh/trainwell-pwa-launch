## Problem

The previous PDFs were rebuilt natively in ReportLab. That choice is the root cause of every issue you flagged:

- ReportLab can't reproduce the real calendar mockup (status borders, icons, today ring, legend) — what you saw was an approximation.
- Manual flow layout led to text overflow, cramped pages, the WhatsApp CTA colliding with the calendar, and asymmetric whitespace.
- Mobile-feel typography is impossible to match when fonts are hand-sized in points.

## New approach: render the real site, slice by section

Drop ReportLab. Use **Playwright (headless Chromium)** to open the live landing page (`https://vecto.fit`) at a **mobile viewport (414 × auto)**, then export to a multi-page A4 PDF where **each landing section becomes its own page (or 2 pages if tall)**. This guarantees the calendar, fonts, colors, spacing, and WhatsApp CTA look exactly like what a trainer sees on their phone — because it literally *is* the rendered site.

Dark theme only, as requested.

## Deliverable

A single file: `/mnt/documents/vecto-cold-outreach-dark-v2.pdf`

5 pages, A4 portrait, mobile-rendered, dark theme:

```text
Page 1 — Hero + Calendar mockup (full, no overlap)
Page 2 — How It Works (3 steps)
Page 3 — Rules of the House (3 rules)
Page 4 — WhatsApp vs VECTO comparison + Pricing (Smart/Pro/Elite)
Page 5 — Flywheel + dual CTA (vecto.fit + WhatsApp/reply) + footer
```

Pricing splits to its own page if it doesn't fit cleanly with the comparison table — the script measures and decides automatically.

## How the slicing works

1. Add `data-pdf-section="hero|how|rules|comparison|pricing|flywheel"` attributes on the existing landing section wrappers (one-line edit per section, no visual change).
2. Playwright loads `https://vecto.fit` at 414px width, waits for fonts + images, scrolls through to trigger `whileInView` framer-motion animations, then takes one full-page screenshot per `[data-pdf-section]`.
3. Each section image is placed on its own A4 page with consistent 8mm margins and a small footer (`vecto.fit · Page X / 5`). If a section is taller than one page, it splits across two pages at a safe gap (no mid-text cuts — we measure background-color stripes to find safe break points).
4. Embed all pages into one PDF via `img2pdf` (lossless, small file).

## Specific fixes to your bugs

| Bug | Fix |
|---|---|
| WhatsApp CTA overlapping calendar on p1 | Hero section is captured as a single rendered DOM node — overlap was a ReportLab artifact, gone by construction. There is no "WhatsApp CTA" on the live hero (only `Get Started`); the WhatsApp/reply CTA was a PDF-only addition and will live on the **final** page only. |
| Calendar UI not exact (missing colour boundaries) | We screenshot the real `<CalendarMockup />` — every status border, icon, today ring, and legend renders identically to production. |
| Text overflow | Real CSS handles wrapping; nothing is hand-positioned. |
| Fonts too small / not mobile-optimized | Captured at 414px viewport = mobile font-stack and sizes (`text-3xl` hero, `text-base` body, etc.). Scaled down only ~5% to fit A4 width, so type stays large and crisp. |
| Asymmetric whitespace, clutter | One section per page with uniform margins. No more cramming. |
| House Rules + How It Works on same page | Each gets its own A4 page. |

## Tiny code change in the repo

Add `data-pdf-section` to 6 existing section wrappers — purely an HTML attribute, no styling impact, no test changes needed:

- `HeroSection.tsx` → `<section data-pdf-section="hero" ...>`
- `HowItWorks.tsx` → `data-pdf-section="how"`
- `HouseRules.tsx` → `data-pdf-section="rules"`
- `ComparisonTable.tsx` → `data-pdf-section="comparison"`
- `PricingSection.tsx` → `data-pdf-section="pricing"`
- `CTASection.tsx` → `data-pdf-section="flywheel"`

For the dual CTA block (vecto.fit + WhatsApp), we won't modify the live site. Instead the script overlays a small CTA card onto the final flywheel page using a Playwright `page.evaluate` that injects a sticky neon-bordered card *after screenshot capture is staged* — so production users never see it, only the PDF does.

## Generation script (high level, runs in /tmp)

```python
# /tmp/build_pdf.py
from playwright.sync_api import sync_playwright
import img2pdf, io
from PIL import Image

URL = "https://vecto.fit"
SECTIONS = ["hero", "how", "rules", "comparison", "pricing", "flywheel"]
A4_W, A4_H = 2480, 3508  # 300 DPI

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 414, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    # scroll to trigger framer-motion whileInView
    page.evaluate("...smooth scroll to bottom then top...")
    # inject CTA card into flywheel section (PDF-only)
    page.evaluate("...insert dual-CTA card after #flywheel content...")

    images = []
    for s in SECTIONS:
        el = page.query_selector(f'[data-pdf-section="{s}"]')
        png = el.screenshot(omit_background=False)
        images.append(pad_to_a4(png))   # center on A4, dark bg, footer

with open("/mnt/documents/vecto-cold-outreach-dark-v2.pdf", "wb") as f:
    f.write(img2pdf.convert([i for i in images]))
```

`pad_to_a4` handles: scale to A4 width minus 8mm margins, paginate if taller than one A4 height (safe-cut between background blocks), paint the obsidian-black canvas, and add the small white footer text.

## Mandatory QA cycle

After generation I will:
1. `pdftoppm -jpeg -r 150` every page,
2. inspect each one for overflow / cuts / overlap / faint text / wrong calendar colors,
3. fix and re-render until clean,
4. report what I checked and any fixes applied.

## Out of scope / explicitly not doing

- No light theme this round (you asked dark only).
- No new copy or content rewrites — pure visual fidelity to the live site.
- No persistent injection of the WhatsApp CTA into the live landing page.

## Confirmation

Going ahead means: install Playwright + Chromium in the sandbox, add 6 one-line `data-pdf-section` attributes to the landing components, run the script, QA, and ship `vecto-cold-outreach-dark-v2.pdf`. Approve and I'll execute.
