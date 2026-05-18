My previous reply attempted the scorecard but the table didn't make it through to you cleanly. Here is the full audit, scored 1–10 across every standard SEO dimension, with evidence pulled from the live codebase (`index.html`, `robots.txt`, `manifest.json`, `Landing.tsx`, etc.) and live Semrush data for `vecto.fit` (IN database).

## Live baseline (Semrush, India)

- Authority Score **0/100**, Trust Score **0/100**
- Organic keywords: **1** (`vecto` at #93, vol 390/mo) — est. traffic **0/mo**
- Backlinks: **18 — all nofollow, all from Fiverr-spam / PBN domains** (anchors like *"after using fiverr services, my vecto.fit reached first page"*). This is a low-grade negative-SEO footprint; disavow needed.
- Target keyword `personal trainer app india`: volume 20/mo, KDI 0 — wide-open SERP but small.

## SEO Scorecard (1–10)

| # | Dimension | Score | Evidence from current build | Recommended fix |
|---|---|---|---|---|
| 1 | Indexability / robots.txt | 8 | `public/robots.txt` allows all, correctly disallows `/icon-review`, `/flywheel-review`, `/pitch`. No accidental `noindex` in `index.html`. | Add `Sitemap:` directive; also disallow auth-gated SPA routes (`/dashboard`, `/home`, `/plans`, `/progress`, `/profile`, `/refer`, `/my-trainer`, `/role-selection`, `/profile-setup`, `/reset-app`, `/reset-password`). |
| 2 | XML sitemap | 1 | `public/sitemap.xml` does not exist. No generator script. | Add `scripts/generate-sitemap.ts` (prebuild) listing `/` and `/terms`. Submit in GSC + Bing. |
| 3 | Canonical URL | 3 | No `<link rel="canonical">` anywhere. Site reachable on 4 hosts: `vecto.fit`, `www.vecto.fit`, `trainwell.lovable.app`, preview URL. | Add `<link rel="canonical" href="https://vecto.fit/" />` in `index.html`. 301 the other hosts to apex. |
| 4 | Per-route head | 2 | No `react-helmet-async`. `/`, `/terms`, `/pitch` all ship the same static title/description. | Install Helmet, give `Terms.tsx` and future content pages unique title/description/canonical. |
| 5 | Title tag (home) | 8 | "Vecto — Performance with Direction" (33 chars). Brand, distinctive, under 60. | Inject India keyword, e.g. *"Vecto — Personal Trainer App for India"* (47 chars). |
| 6 | Meta description (home) | 7 | "Vecto — The accountability engine for independent fitness trainers…" (113 chars, under 160). | Append CTA + geo: *"Start free. Built for Indian PTs."* |
| 7 | H1 / heading hierarchy | 7 | `HeroSection.tsx` has a single `<h1>` ("Whatever Gets Tracked, Gets Done.") — brand voice, zero keyword. Wordmark is `<span>`, good. | Add a keyword-bearing H2 directly under H1, or rewrite H1. |
| 8 | Open Graph / Twitter | 7 | `og:title`, `og:description`, `og:type`, `og:image=/og-image.png` (file exists), full Twitter card block. **Missing `og:url`**. | Add `<meta property="og:url" content="https://vecto.fit/" />`. Verify image is 1200×630. |
| 9 | Structured data (JSON-LD) | 1 | No `application/ld+json` anywhere — no Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList. | Inline Organization + SoftwareApplication (category `HealthApplication`, offers ₹499/mo, ₹5,988/yr) in `index.html`. |
| 10 | Mobile-friendliness | 9 | Viewport set, Tailwind responsive, PWA with safe-area. | Remove `maximum-scale=1, user-scalable=no` from viewport — Google's mobile test downgrades this. |
| 11 | Core Web Vitals / speed | 6 | Vite + SWC, route-level `lazyWithReload` code-splitting, Inter via Google Fonts `display=swap`, hero LCP is inline SVG (no image), flywheel PNG `loading="lazy"`. | Self-host Inter (`@fontsource/inter`) to drop third-party RTT. Add explicit `width`/`height` on all `<img>` to prevent CLS. Run Lighthouse mobile India 4G. |
| 12 | JS rendering / SSR | 4 | CSR-only React SPA. Social crawlers (LinkedIn, WhatsApp — critical in India) only see static head. Googlebot is fine. | Acceptable now (static head covers social). Migrate to pre-render (`vite-ssg`) only once you ship blog/content pages. |
| 13 | HTTPS / security headers | 8 | HTTPS via Lovable hosting. HSTS/CSP set at edge. | Verify via securityheaders.com post-publish. |
| 14 | Internal linking | 4 | Nav has Login + Get Started, footer has Terms, Pricing#, Sign In, Contact. No deep section anchors, no content cluster. | Build a `/blog` cluster (programmatic SEO targets like "best PT software India 2026", "client retention for personal trainers") — KDI 0 on most India terms. |
| 15 | Content depth / E-E-A-T | 4 | Landing = Hero + HowItWorks + HouseRules + ComparisonTable + Pricing + CTA + Footer. No founder bio, no named testimonials, no case studies. | Add `/about` with founder + LinkedIn, `/case-studies/<trainer>` with real outcomes. India PT trust signals. |
| 16 | Backlink profile | 1 | **Toxic**: 18 nofollow links, every referring domain is Fiverr/PBN spam. Either negative SEO or a botched paid campaign. | Disavow all 18 in GSC. Start clean outreach to Indian fitness publications, Capterra/G2 India listings. |
| 17 | Brand & SERP presence | 1 | Only 1 organic keyword (`vecto` #93). Brand name is contested (Vecto Industries etc.). | Build entity stack: Crunchbase, LinkedIn Company, Google Business Profile (India), Wikidata. |
| 18 | FAQ / on-page schema | 2 | PRD §5 lists FAQ section; `Landing.tsx` does NOT render one. Missed `FAQPage` schema. | Build `<FAQSection />` with 6–8 India-specific Qs (INR pricing, GST, WhatsApp, refund) + emit `FAQPage` JSON-LD. Highest-ROI rich-result win. |
| 19 | Image SEO / alt text | 7 | `CTASection.tsx` flywheel `alt` is descriptive. Wordmark is text not image. | Audit `HowItWorks`, `ComparisonTable` for `<img>` without alt. |
| 20 | Hreflang / locale | 6 | `<html lang="en">`. No `hreflang`. Single market. | Add `hreflang="en-IN"` + `x-default` pointing to apex. |
| 21 | URL structure | 9 | Short, lowercase, no query params, no IDs. | Keep. Use `/blog/<slug>` for future content. |
| 22 | Analytics / GSC | 2 | No GA4/Plausible. No GSC verification meta in `index.html`. | Add Plausible (lighter for CWV) + GSC verification + Bing Webmaster + submit sitemap. |
| 23 | Accessibility (SEO-adjacent) | 7 | Semantic `<nav>`, `<section>`, `<footer>`. `user-scalable=no` hurts a11y. | Fix viewport. Add `aria-label` to icon-only nav buttons. Run axe on `/`. |
| 24 | PWA / app signals | 9 | `manifest.json` complete (4 icons incl. maskable, categories, theme color, standalone). Apple touch icon, theme-color meta. | Add `screenshots[]` for richer install prompts. |

**Overall weighted score: 4.6 / 10.** Build hygiene is solid; SEO surface area is near-zero — the site isn't yet in Google's eyes and is under a low-grade negative-SEO attack.

## Top 5 fixes ranked by ROI (one PR, this week)

1. Disavow toxic backlinks + verify in GSC + Bing (rows 16, 22). Zero code, biggest defensive win.
2. Sitemap + canonical + 301 the alternate hosts to `vecto.fit` (rows 2, 3). Stops duplicate-host dilution.
3. JSON-LD: Organization + SoftwareApplication + FAQPage (rows 9, 18). Cheapest path to India rich results.
4. Rewrite H1/title to target `personal trainer app india` (rows 5, 7). KDI 0 → first page within weeks.
5. Install `react-helmet-async`, add per-route head on `/terms` (row 4). Foundation for content marketing.

Approve and I'll implement #1–#5 in a single PR.
