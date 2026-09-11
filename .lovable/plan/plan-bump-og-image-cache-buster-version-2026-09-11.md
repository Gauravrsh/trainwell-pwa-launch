# Plan: Bump OG image cache-buster version

## Goal
Force WhatsApp/Facebook/LinkedIn and other platforms to re-scrape the Vecto share card by bumping the query-string version on the `og:image` and `twitter:image` URLs.

## Change
In `index.html` only:
- Change `og:image` from `https://vecto.fit/og-image.png` to `https://vecto.fit/og-image.png?v=3`
- Change `twitter:image` from `https://vecto.fit/og-image.png` to `https://vecto.fit/og-image.png?v=3`

## Constraints
- Do NOT modify any other file, component, route, style, or backend logic.
- Do NOT change the page title, description, canonical, JSON-LD, or any other meta tags.
- Do NOT regenerate the image asset itself.

## Verification
- Read `index.html` after the edit to confirm only the two image URLs changed.
- Confirm the build still compiles cleanly.
