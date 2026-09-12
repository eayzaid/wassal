---
name: wassal-frontend-design
description: Design system and visual styling guide for WASSAL, the volunteer/member management platform built for Caravane El Hayat (React frontend, Spring Boot backend). Encodes WASSAL's official brand palette (vivid green, sage, slate blue, plum, wine — from coolors.co/53dd6c-63a088-56638a-483a58-56203d) with accessible, contrast-checked color roles, plus the Plus Jakarta Sans / Inter typography pairing. Use this skill whenever building, styling, or reviewing any WASSAL UI — pages, components, buttons, forms, dashboards, status badges for member states (pending/active/blocked/rejected), emails, or exported documents — and whenever the user mentions "WASSAL colors", "WASSAL branding", "WASSAL design system", or styling the WASSAL frontend, even without naming this skill directly.
---

# WASSAL Frontend Design System

## Brand context

WASSAL is the internal platform Caravane El Hayat (a humanitarian association) uses to manage its members: self-registration, admin approval, role assignment (President, Vice President, RH, Team Leaders, Members), and blocking/rejection flows. It's an operations tool people rely on to run real association work — not a marketing site. Favor clarity, density, and scan-ability over hero moments or decorative flourish. Let the palette do the branding; keep layout and copy calm and functional.

For general layout, motion, and copywriting process beyond this file's tokens, use the `frontend-design` skill — apply its process with *these* fixed colors and type, rather than inventing a new palette.

## Color system

Palette source: https://coolors.co/53dd6c-63a088-56638a-483a58-56203d. Contrast ratios below are WCAG relative-luminance calculations against pure white (#FFFFFF) and pure black (#000000).

| Token | Hex | Role | Contrast on white | Usage |
|---|---|---|---|---|
| `wassal-green` | `#53DD6C` | Primary brand / CTA fill | 1.76:1 | **Never** use as text on white, or white text on it — both fail. Use as a filled button/badge/illustration surface with dark text on top (`wassal-plum` or `wassal-ink`, both clear >5.9:1 against it), or as a small accent stroke/icon. |
| `wassal-green-ink` | `#1B872E` | Accessible "on-brand" green | 4.6:1 | Darkened green for text, links, or icons directly on white, and for white text on a filled button (4.6:1 — clears AA body text). Use this, not raw `wassal-green`, wherever green needs to *be* the text or hold small white text. |
| `wassal-sage` | `#63A088` | Secondary / supporting green | 3.0:1 | Below AA for small text on white. Fine for large/bold text (18px+), icons, borders, and non-text UI (3:1 minimum). Good for secondary buttons, subtle success accents. |
| `wassal-sage-deep` | `#4B7B68` | Accessible sage variant | 4.85:1 | Use where sage needs to carry small white text (badges, filled secondary buttons) or body text on white. |
| `wassal-slate` | `#56638A` | Tertiary / links & secondary text | 5.9:1 | Safe directly on white for body copy, links, secondary headings, muted labels. |
| `wassal-plum` | `#483A58` | Dark neutral / headings & chrome | 10.4:1 | Excellent on white — use as a warmer alternative to pure black for headings/body text, or as a dark sidebar/navbar/footer background with white text. |
| `wassal-wine` | `#56203D` | Emphasis / critical actions | 12.6:1 | Excellent on white. Reserve for high-stakes actions and states: block, reject, delete, "you are about to remove access." Reads as serious without being a literal alarm-red. |

**Don't pair Plum and Wine as foreground/background of the same element** — they're both deep, low-luminance colors (1.2:1 against each other), so text in one won't read on a fill of the other. Pick one dark neutral per surface.

## Suggested status mapping (member lifecycle)

WASSAL's core states are pending approval, active, blocked, and rejected members, plus role tags (President/VP/RH/Team Leader/Member). Suggested mapping so status colors carry real meaning instead of decorating:

- **Pending approval** — `wassal-slate` badge (neutral, "waiting," not yet a verdict)
- **Active / approved** — `wassal-green-ink` or `wassal-sage-deep` badge (the one positive, on-brand state)
- **Blocked** — `wassal-wine` badge (serious, reversible-by-admin)
- **Rejected** — `wassal-plum` or a muted neutral badge (final, closed)
- **Role tags** (President, VP, RH, Team Leader, Member) — neutral `wassal-slate`/`wassal-plum` tags, not brand green — keep green reserved for primary actions so role labels don't visually compete with real CTAs

For low-emphasis surfaces (table row tags, chips, alert backgrounds), tint the role color at ~10–15% opacity over white and set the solid color as the text/icon — keeps a fairly vivid palette from overwhelming a data-dense admin screen.

## Typography

**Headings:** Plus Jakarta Sans (600/700) — geometric, modern, confident without being flashy.
**Body / UI:** Inter (400/500/600) — near-universal legibility at small sizes, full French accented-character support (é, è, ê, ç, à, œ).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Type scale (desktop):

| Element | Font | Size / line-height | Weight |
|---|---|---|---|
| H1 | Plus Jakarta Sans | 32px / 1.2 | 700 |
| H2 | Plus Jakarta Sans | 24px / 1.25 | 700 |
| H3 | Plus Jakarta Sans | 19px / 1.3 | 600 |
| Body | Inter | 15–16px / 1.5 | 400 |
| UI label / button | Inter | 14px / 1.3 | 500–600 |
| Caption / meta | Inter | 12–13px / 1.4 | 400–500 |

Keep body line lengths under ~80 characters, per standard typographic practice — relevant for approval-notice emails and long-form admin text (rejection reasons, cahier-de-charge-style content) as much as the app itself.

## CSS tokens

```css
:root {
  /* Brand */
  --wassal-green: #53DD6C;
  --wassal-green-ink: #1B872E;
  --wassal-sage: #63A088;
  --wassal-sage-deep: #4B7B68;
  --wassal-slate: #56638A;
  --wassal-plum: #483A58;
  --wassal-wine: #56203D;

  /* Neutrals */
  --wassal-ink: #1A1A1A;
  --wassal-bg: #FAFAF9;
  --wassal-surface: #FFFFFF;
  --wassal-border: #E4E2E8;

  /* Type */
  --font-heading: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}
```

## Tailwind (if used in the React frontend)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        wassal: {
          green: "#53DD6C",
          "green-ink": "#1B872E",
          sage: "#63A088",
          "sage-deep": "#4B7B68",
          slate: "#56638A",
          plum: "#483A58",
          wine: "#56203D",
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
```

## Component guidance

- **Primary button:** `wassal-green` fill + `wassal-plum` or `wassal-ink` text (5.9:1 / 9.9:1 — both clear AA comfortably). This "bright fill, dark ink" pattern reads as intentional and on-brand rather than a default white-text-on-color button.
- **Secondary/filled button needing white text:** use `wassal-green-ink` or `wassal-sage-deep` as the fill, not the raw brand colors.
- **Outline / ghost button:** `wassal-slate` or `wassal-plum` border and text on white.
- **Destructive action (block/reject/delete):** `wassal-wine` fill with white text, or wine text/border on white for a lower-emphasis destructive action.
- **Sidebar / top nav:** `wassal-plum` background with white text and `wassal-green-ink` or `wassal-sage` for active-state accents.
- **Links & secondary text on white:** `wassal-slate`.

## Design principles for this brief

- This is a workflow tool, not a landing page — prioritize legible tables, clear form states, and obvious status indicators over hero sections.
- Reserve vivid `wassal-green` for actions and the one positive state; let plum, slate, and off-white neutrals carry most of the surface so the UI doesn't read as a generic bright-SaaS template.
- Avoid the common AI-generated-design tells (see `frontend-design` skill for the full list): no tracked-out ALL-CAPS eyebrow labels, no arrow-suffixed button text, no identical rounded-card-plus-soft-shadow treatment applied everywhere regardless of hierarchy.
- Content is French-first — verify accented characters render cleanly in both typefaces at every weight you use.
