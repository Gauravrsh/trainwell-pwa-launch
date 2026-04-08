

# Workout Command Center — Interactive HTML Mockup

## What we're building
A standalone HTML file at `public/workout-command-mockup.html` — a high-fidelity interactive mockup of the trainer's workout assignment screen, following the Obsidian & Neon design language and the three UX loops described.

## Design System
- **Background**: Obsidian black (#0A0A0A, #111111 cards)
- **Action/Command color**: Vecto Neon (#9FFF2B / #BFFF00)
- **Data text**: White (#FAFAFA)
- **Secondary text**: Grey (#888888)
- **Font**: Inter (Google Fonts)
- **Border radius**: 12px cards, 8px inputs
- **No external JS frameworks** — vanilla HTML/CSS/JS only

## Screen Layout (top to bottom)

### 1. Header Bar
- "VECTO" wordmark (lime V, white ECTO) top-left
- Screen title: "Command Center" in white

### 2. Loop A — The Command Line Search Bar
- Full-width search input with placeholder: `Type @ for protocols, # for clients...`
- On typing `@L`, show a dropdown with mock suggestions: `@LowerBodyAlpha`, `@Legs-Strength-Bhai`, `@LeanCut-Upper`
- Interactive: typing filters suggestions, clicking one populates the Directive Card below

### 3. Loop B — The Directive Card
- Initially hidden/empty state
- On protocol selection, animates in showing:
  - Protocol name in neon green
  - Minimalist exercise list: `1. Lat Pull Down | 3×10`, `2. Seated Row | 2×12`, etc.
  - Context label: `Directive: 4 exercises, 12 sets` in neon green
  - Collapse/expand toggle

### 4. Loop C — Bulk Deployment Panel
- Two-column layout within a card:
  - **Left: Client Selection** — Checkboxes with mock client names, "Select All" toggle
  - **Right: Vector Direction** — Dropdowns for Frequency (Mon/Tue/Wed...) and Duration (1-8 weeks)
- Updates a live summary line: `"Deploying to 4 clients × Mondays × 4 weeks"`

### 5. The Elite Jester CTA
- Full-width glowing neon green button: `[→] Execute 4-Week Command`
- Glow/pulse animation on hover
- Below: truth-teller text: `"This command generates 32 workout directives across 4 weeks."`
- Click triggers a brief success animation/toast

## Interactivity (vanilla JS)
- Search filtering and dropdown selection
- Directive card populate/animate on selection
- Client checkboxes with select-all logic
- Dynamic summary text updates based on selections
- CTA button click → success state

## File
- `public/workout-command-mockup.html` — single self-contained file
- Accessible at preview URL: `/workout-command-mockup.html`

## No changes to React codebase

