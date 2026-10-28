# 01 — Design Tokens (brand extracted from the live website)

**Status:** Stage 6 Phase 2 · **Date:** 2026-10-28 · **Gate:** awaiting Gate 6 sign-off.
**Extraction evidence:** live fetch 2026-10-28 of `uniquelaserclinics.co.uk` — the child theme
stylesheet `wp-content/themes/ulc-signature/assets/css/site.css` (ver `1.1.0.1792668027`), the
document `:root` custom-property block, inline SVG accents on the homepage, and `<meta
name="theme-color">`. Every hex below is **VERIFIED** unless its row says **PROPOSED** —
proposed values are semantic app-layer decisions, never invented brand claims.
Older research passes (`UrlFetchingV1.txt` §5 proposed `#FAF8F5/#0F766E` teal direction) are
**superseded by this fetch** — the live theme actually ships a **night-plum + gold** palette,
and `theme/tokens.ts` (scaffolded in M1) already matches it. V1's guessed colours were never
implemented; recorded here as the conflict, resolved per governing principle 1 (live website wins).

## 1. Colour — verified brand tokens → `theme/tokens.ts`

Source `:root` block (verbatim):

```css
--night:#1A1220; --night-2:#24182B; --plum:#5A2D5E; --plum-deep:#47224A;
--pearl:#F3F0F2; --white:#FFFFFF; --rose:#EADADD;
--ink:#22172A;   --ink-soft:#5F5266; --muted-night:#BFB3C4;
--gold-1:#B9852A; --gold-2:#F2D04A; --gold-line:#E6BE45; --gold-text:#8A5A12;
--line:rgba(34,23,42,.14); --line-night:rgba(243,240,242,.16);
```

| Token (`tokens.ts`) | Hex | Site var | Role (where it appears on the site) | Status |
|---|---|---|---|---|
| `colors.night` | `#1A1220` | `--night` | Hero canvas, reviews section, solid notice-bar; also `<meta theme-color>` | VERIFIED |
| `colors.night2` | `#24182B` | `--night-2` | Raised surfaces on night canvas (carousel track, dark rows) | VERIFIED |
| `colors.plum` | `#5A2D5E` | `--plum` | `.btn-plum` / `.ulc-btn-dark` fill; accent surfaces | VERIFIED |
| `colors.plumDeep` | `#47224A` | `--plum-deep` | Notice-bar background; plum hover state | VERIFIED |
| `colors.pearl` | `#F3F0F2` | `--pearl` | Page canvas (light sections), ghost-button hover fill | VERIFIED |
| `colors.white` | `#FFFFFF` | `--white` | Card surfaces, `btn-plum` label | VERIFIED |
| `colors.rose` | `#EADADD` | `--rose` | "How It Works" section wash (`section.sec.rose`) | VERIFIED |
| `colors.ink` | `#22172A` | `--ink` | Primary text on light surfaces; `.price` colour; gold-button label | VERIFIED |
| `colors.inkSoft` | `#5F5266` | `--ink-soft` | Secondary/muted text on light | VERIFIED |
| `colors.mutedNight` | `#BFB3C4` | `--muted-night` | Secondary text on night; closed-state dot | VERIFIED |
| `colors.gold1` | `#B9852A` | `--gold-1` | Gold gradient start; focus ring; control borders on night | VERIFIED |
| `colors.gold2` | `#F2D04A` | `--gold-2` | Gold gradient stop (70%); spark core in hero SVG | VERIFIED |
| `colors.goldLine` | `#E6BE45` | `--gold-line` (SVG) | Hero halo ring `stroke="#E6BE45"`; hairline gold rules | VERIFIED |
| `colors.goldText` | `#8A5A12` | `--gold-text` | Gold-family text on light surfaces (deep enough for contrast) | VERIFIED |

Secondary hues seen in the live CSS but **not promoted to brand tokens** (documented so nobody
re-"discovers" them): `#3B3042` (prose body copy in `.ulc-prose`), `#F3E6C4` (notice-bar text),
`#7FD69A` (open-state dot + glow ring), `#FFF6C9`/`#F8E27A`/`#FFFBEA` (hero SVG spark/burst).
App rule: reuse via semantic roles below, never copy raw hexes into screens.

### Proposed semantic status tokens (app layer — flag, do not present as brand)

| Token (`tokens.ts`) | Hex | Status | Basis |
|---|---|---|---|
| `colors.success` | `#2E7D5B` | **PROPOSED** | No brand green exists on the site (the site's "open" dot is `#7FD69A`, a light green unsuitable for text on pearl at small sizes). Chosen as a warm-mid green in-family with the plum/night palette for confirmed/completed/open-now text states. Confirm with owner at Gate 6 (asset request: brand guideline). |
| `colors.danger` | `#A23B4A` | **PROPOSED** | No brand red published. Chosen muted wine-red, family-consistent, for errors/declines. Never used for clinic-status claims (R06/S10 — no policy invented). |
| status dot (open) | `#7FD69A` (via `tokens`?) | **PROPOSED addition** | The site's verified open dot should become a token (`statusOpen`) in M1 — extraction-faithful; flagged here as a `tokens.ts` delta request, not applied by editing code pre-Gate 6. |

## 2. Typography

Site `:root`: `--display:"Cormorant","Cormorant Garamond",Georgia,serif` ·
`--sans:"Instrument Sans",system-ui,…`. Homepage `<head>` preloads exactly
`cormorant-500-normal.woff2` and `instrument-sans-400-600-normal.woff2` from the theme —
**font licence question from Stage 0 is answered for these two faces: self-hosted theme assets;
app uses the same Google font families via `@expo-google-fonts` (already in `app/_layout.tsx`).**
Other fonts (Playfair/Inter/DM Sans in `UrlFetchingV1`) were research suggestions, not the site's
reality — ignore.

| Role | tokens.ts | Source evidence |
|---|---|---|
| `display` 40/44 | `Cormorant_600SemiBold` | h1 `.d1` = `clamp(2rem,4vw,3rem)` display serif → 320–430px viewport ≈ 32–48px; 40px sits mid-range |
| `h1` 32/38 · `h2` 24/30 · `h3` 20/26 | `Cormorant_600SemiBold` | `.d2`/`.d3` clamps (`clamp(1.4rem,2.2vw,1.75rem)` ≈ 22–28px) — mobile values fixed per breakpoint |
| `body` 16/24 | `InstrumentSans_400Regular` | prose `1rem` (16px) |
| `bodyMedium` 16/24 | `InstrumentSans_500Medium` | tabs/links at `font-weight:500` |
| `caption`/`small` 12–14 | `InstrumentSans_500/400` | eyebrow `.label` = `600 .72rem letter-spacing:.06em` uppercase |
| negative tracking on display | site uses `-.01em…-.02em` | apply via `letter-spacing` on display roles in `04-screen-craft.md` |

**Eyebrow pattern (brand-verified):** uppercase, `0.06–0.2em` tracking, 12px, weight 500–600 —
used for `OUR TREATMENTS`, `HOW IT WORKS`, `BOOK IN A MINUTE`. In-app equivalent: `ScreenEyebrow`.
**Known delta:** the site preloads Cormorant **500**; the app loads 400/600/700. Display headings
render at 600 in-app (slightly stronger than web 500) — accepted mobile choice, logged, revisit
if owner supplies the exact licence set.

## 3. Spacing, radii, elevation, motion

| Family | Values | Status / source |
|---|---|---|
| `spacing` | 4·8·12·16·20·24·32·40 | VERIFIED-derived: site gutters `clamp(18px,4.5vw,64px)`, card pads 16–24, review gap 24 — rhythm adopted 4-pt scale |
| `radii` | sm 8 · md 14 · lg 20 · xl 28 · pill 999 | MIXED: site buttons/tabs use **2px hairline corners** and an **arch motif** (`200px 200px 2px 2px` photos) — the app's larger radii are a **PROPOSED** mobile softening; keep `radii.sm` on chips to echo the web's sharpness, and reserve the arch (`radii.lg/xl` top-only) for treatment photography |
| hairline borders | `rgba(34,23,42,.14)` light / `rgba(243,240,242,.16)` night | VERIFIED (`--line`, `--line-night`) — expose as `borders.line`/`borders.lineNight` when M1 screens need them (token delta request) |
| elevation | gold glow `0 10px 30px -10px rgba(242,208,74,.65)` on gold-button hover | VERIFIED; app analogue: `elev.gold` reserved for primary CTA emphasis, default surfaces are flat-with-hairline like the site |
| focus | `outline:2px solid var(--gold-2); outline-offset:6px` | VERIFIED — keyboard/switch-access rule in `04-screen-craft.md` |
| `gradients.gold` | `#B9852A → #F2D04A` | VERIFIED (`linear-gradient(120deg,…)`) — reserved for primary CTA + hero halo only |
| `gradients.plum` | `#47224A → #5A2D5E` | **PROPOSED** — direction matches brand, exact stops unverified; use sparingly, never for status meaning |
| motion | `--e-out:cubic-bezier(.16,1,.3,1)` (entrances) · `--e-io:cubic-bezier(.65,0,.35,1)` (transitions) · 200–250 ms | VERIFIED; honours `prefers-reduced-motion` (site review carousel checks it — we copy that behaviour) |

## 4. Light/dark posture

The website is **light-canvas-first with night sections** (pearl/white body, `night` hero +
reviews). Phase decision (D — this doc): the app ships **one light theme** (Pearl canvas / Night
accents) that reproduces the site section-by-section, with *night-surface components* (Queue
identity strip, status ribbon) reusing the same tokens — not a separate user-toggleable dark mode.
A system-matched dark variant is a named phase-2 item (asset request: brand guideline), never a
silent half-mirror of hexes.

## 5. Hard rule → `00-design-system-usage-rules.md`

No screen may contain a hex literal, an off-scale size, or a font not in `tokens.ts`.
`theme/tokens.ts` is the single map of the table above; deltas (statusOpen dot token, border
tokens) are applied in M1 as a tokens PR, not ad-hoc.
