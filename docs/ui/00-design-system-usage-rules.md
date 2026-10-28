# 00 — Design System Usage Rules

**Status:** Stage 6 Phase 2 · 2026-10-28 · binding on all `app/` screens once Gate 6 clears.
Prevents the classic drift: five screens each inventing their own shade of "clinic purple".

## 1. What the tokens own

| Owned by `theme/tokens.ts` | Never in screens |
|---|---|
| Every colour (`colors.*`), incl. night-canvas variants | `#RRGGBB` / `rgba()` literals |
| Font family per role (`fonts.*`) | raw family strings |
| Type sizes/line-height/tracking per role (`typography.*`) | one-off `fontSize: 17` |
| Spacing rhythm (`spacing.*`) | magic paddings (site gutter ≈ `spacing.lg/xl`) |
| Radii (`radii.*`), gradients (`gradients.*`) | per-component corner maths |
| Motion durations/curves (added with the M1 token delta, see `01-tokens.md` §3) | ad-hoc `Animated` easings |

Access path: screens consume `useTheme()` (`theme/ThemeContext.tsx`) or a component from
`05-component-library.md`; components read tokens, screens never re-derive styles from hexes.

## 2. What the tokens do *not* own (component-level, still centralised)

- **State semantics** — the *meaning* of a colour pairing (e.g. "Confirmed = success text on white
  chip") lives in `04-screen-craft.md` §colour roles + components, not in raw hex usage.
- **Density** — admin surfaces may legitimately use `spacing.sm/md` where consumer surfaces use
  `lg/xl`; the per-shell density choice belongs to each section doc, always snapped to the scale.
- **Images** — photography is a brand asset, not a token; treatment imagery may only come from the
  client-supplied asset set (Stage 0 asset request), never stock or invented renders.

## 3. Conflict rule (kickoff hard rule, restated for UI)

1. `/docs` (this tree + decisions) **wins** over any visual reference, screenshot, moodboard or
   model render.
2. The live website CSS wins over research files (`UrlFetchingV1/V2`); where they disagree (V1's
   teal/`#0F766E` direction vs the live plum/gold theme), the live fetch recorded in `01-tokens.md`
   is the truth and the conflict is *logged, not silently resolved*.
3. Only the client (via a `D##` decision entry) can change a locked token. A developer finding the
   gold "too bright" is an open question, not an edit.
4. Any token gap discovered mid-build (e.g. `statusOpen` dot) = a **tokens PR first**, screens
   follow. Never inline the missing value "temporarily".

## 4. Anti-patterns (named so review can reject them)

- ❌ `backgroundColor: '#F2D04A'` in a screen file (grep in review; reject).
- ❌ Gradient used for *meaning* (status, severity) — `gradients.gold` is decoration/CTA only.
- ❌ `PROPOSED` status tokens (`success`, `danger`) presented to the owner as "your brand colours"
  — they are semantic app choices flagged in `01-tokens.md` §1.
- ❌ Composing treatment names into notification copy (R06 — DB tripwire `assert_r06_generic_copy`
  will reject it anyway; the UI must not try).
- ❌ Showing fictitious availability to look "real-time" (R02 — request→confirm chrome only).
- ❌ Any health/medical field chrome (R04/DA-10 — zero health inputs; steering copy only).
- ❌ Floats or `£35.00` arithmetic in components — render via the price formatter from integer
  pence (`price_from_pence`, R05); "From £35 per session" is the only verified label shape (W04).
- ❌ US spellings (`color`, `center`, `organize`) in copy — R09; lint rule list in `04-screen-craft.md`.
- ❌ Tab labels that differ between wireframes and routes (single naming table in
  `02-navigation-and-ia.md` §1 is the source).
- ❌ Inventing empty-state advice ("Try IPL instead…") — copy only from the verified content bank
  (`04-screen-craft.md` §10); fallback copy is `S09` "Ask us for advice".
- ❌ Emoji as UI text in shipped product (tab glyphs in these wireframes are documentation
  shorthand; production uses the named SF Symbols/Material equivalents in `02-navigation-and-ia.md`).

## 5. Escalation

Anything a screen needs that this system does not own → new row in `docs/progress/06-changelog.md`
+ (if structural) an ADR. Do not solve it silently in JSX.
