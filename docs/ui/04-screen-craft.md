# 04 — Screen Craft (layout scaffold, typography roles, colour roles, copy, states)

**Scope:** rules every screen obeys; per-flow specifics live in `sections/*`. Tokens per
`01-tokens.md`; usage law per `00-design-system-usage-rules.md`.

## 1. Layout scaffold (375 pt reference width; safe areas are law)

```text
┌──────────────────────────────┐ ─ status bar (expo: light on night canvas,
│  safe area top               │    dark on pearl; never overlay content)
│ ┌──────────────────────────┐ │
│ │ header 56–64pt: eyebrow/ │ │  back ← · title · trailing action or [⌕]/[🔔]
│ │ title row + trailing     │ │
│ ├──────────────────────────┤ │
│ │ banner slot (warn/       │ │  soft banners sit BELOW header, ABOVE scroll —
│ │ offline/DA-05/06 — 0..n) │ │  they scroll away with content, never overlay
│ ├──────────────────────────┤ │
│ │                          │ │
│ │ scroll body              │ │  gutter = spacing.lg (16), edge-to-edge only for
│ │  (gutters spacing.lg,    │ │  hero imagery; sections separated by spacing.xl
│ │   section gap spacing.xl)│ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │ sticky action (52pt)     │ │  one per screen max (e.g. "Book a free consultation")
│ ├──────────────────────────┤ │
│ │ tab bar 49 + safe bottom │ │  admin: identity strip 44pt pinned ABOVE the tabs
└──────────────────────────────┘ ─ home-indicator / gesture safe area
```

- **Safe areas:** `SafeAreaProvider` (exists, `app/_layout.tsx`); screens use
  `useSafeAreaInsets`, never hard-code status-bar height. Sticky CTAs add `insets.bottom`.
- **Keyboard rule:** forms (sign-up, request step 3/4, enquiry compose, decline reason, notes)
  run inside `KeyboardAvoidingView` + scroll; the primary CTA is never hidden under the keyboard —
  it docks above it. Inputs ≥ 44 pt tall, `textInputContentType` set (email, tel, name),
  `autoCorrect`/`autoCapitalize` per field. Test matrix: iOS shows keyboard + resize; Android pan
  vs resize documented per screen in M1 notes.
- **Long content rule:** names/notes/FAQ answers wrap to 2 lines in lists then ellipsis **only**
  where tapping opens the full text; thread messages and update bodies never truncate (wrap +
  expandable "Read more" at 8 lines). Prices, dates and statuses never ellipsis.
- **One-handed ergonomics:** primary actions in the lower 40 %; destructive actions ≥ 120 pt from
  the primary CTA and require a confirm sheet (cancel-request, seat revoke, deletion).

## 2. Typography roles (consumed from `typography`, no ad-hoc sizes)

| Role | Use | Colour role (light canvas) | Night canvas |
|---|---|---|---|
| `display`/`h1` | guest-hero title, sheet titles | `ink` (site hero = pearl on night → app guest hero is the ONE night-surface screen, `pearl` text) | `pearl` |
| `h2`/`h3` | section heads, card titles | `ink` | `pearl` |
| `bodyMedium` | card titles, buttons, list primary line | `ink` | `pearl` |
| `body` | descriptions, thread copy | `ink` | `pearl` |
| `small` | metadata (dates, durations) | `inkSoft` | `mutedNight` |
| `caption` + uppercase + tracked | eyebrows (`OUR TREATMENTS` pattern), badges | `goldText` on light / `gold2` on night | — |

WCAG (verified by computation against `01-tokens.md`): ink-on-pearl 15.2:1 · inkSoft-on-pearl
6.4:1 · goldText-on-pearl 5.2:1 · pearl-on-night 16.1:1 · gold2-on-night 12.1:1 · night-on-gold
gradient start 5.6:1 (button label = `night`). **Known tight pair:** proposed `success` on pearl
4.4:1 — use on white chips or at ≥ 14 pt bold only (`danger` 5.7:1 is fine).

## 3. Colour roles

| Role name | Pairing | Where |
|---|---|---|
| canvas | `pearl` page, `white` card, `night` admin strip/guest hero, `rose` info-band | every screen |
| ink | body text | light surfaces |
| accent-gold | `gradients.gold` CTA bg + `night` label; `goldLine` hairline rules; `goldText` eyebrows | primary CTAs, section rules — **never for status meaning** |
| status-open | verified dot hue (`#7FD69A` via proposed `statusOpen` token) | Open/Closed widget only |
| status-success | `success` text/chip | Confirmed, Completed, published ticks |
| status-warn | `rose` bg + `ink` text + `goldLine` edge | DA-05/DA-06 soft warnings — explicitly NOT red (nothing is wrong) |
| status-error | `danger` text/border | validation failures, failed submit, access-denied |
| muted | `inkSoft` / `mutedNight` | placeholders, skeletons base (`pearl`→`rose` shimmer) |

## 4. Control rules

- Buttons: `primary` (gold gradient, min-height 52 — site `.btn` measured 52 pt), `secondary`
  (`plum` bg white label), `ghost` (inset hairline, like `.btn-ghost`), `quiet` (text-only,
  `inkSoft`), `danger-text` (outlined `danger`, never gradient). Disabled = 38 % opacity + still
  ≥ 44 pt. One `primary` per screen.
- Focus (accessibility toggle / keyboard): `outline 2 solid gold2, offset 6` (site-verified rule).
- Touch targets ≥ 44×44; list rows ≥ 56; pill rows scroll horizontally with `radii.sm`.
- Switches: `ConsentToggle` only (R08 rows), never inline magic — toggling writes a
  `recordConsent` row; failure reverts the switch with an inline error.
- Pull-to-refresh on all client/admin lists; consumer browse caches (see §6).

## 5. Motion

Entrances: `e-out` curve, 200–250 ms (site-verified). Sheet present 220 ms e-out, dismiss e-io.
Skeleton shimmer: opacity pulse only (no positional motion). **`prefers-reduced-motion` → instant
state swaps, no auto-scroll carousels** (the site itself gates its review carousel this way —
copy that behaviour). No screen invents spring constants.

## 6. Offline & caching posture (DA-level behaviour, no new claims)

- **Catalogue (treatments/categories/concerns/FAQ/hours) is cached for offline browsing** — guest
  tabs 1–3, 5 render last-good data + the standard *cached-catalogue banner* (`00-cross-cutting`
  §4). The open/closed widget computes locally from cached `opening_hours` (Mon–Sun 10–18, DA-13)
  and flags "may have changed".
- **Personal data (dashboard, appointments, enquiries, all admin surfaces): no stale render** —
  offline = explicit error state with retry, never a frozen queue that staff might act on twice.
- Writes (request submit etc.) use `idempotency_key` — retry-after-reconnect is safe (§7 + `04-book`).

## 7. State vocabulary (used identically in every section file)

`signed-out` · `null/empty` · `loading` · `offline-cached` · `offline-error` · `error/validation`
· `success` · `edge (named)` — sections draw each applicable one.

## 8. Accessibility

- Screen-reader labels on every icon-button; tab bar announces role ("Treatments tab, 3 of 4").
- Badges (`2 new`) are `accessibilityLabel="2 new booking requests"`, not colour-only.
- Status pill pairs icon+text (open dot + "Open now"), never colour alone.
- Dynamic Type: scale body/labels with the system (clamp display at 1.5×); layouts reflow, no
  fixed-height text rows.
- R06 interacts here too: notification *preview text* read by screen readers is the generic copy.

## 9. UK spelling & copy rules (R09) — enforced in review

Write: colour · centre · organise · prioritise · personalised · cancelled/cancelling (double-L) ·
postcode · "ask us for advice". Never: color/center/organiz-/canceled
(single-L) — lint list ships with M1. Copy tone follows the site: plain, warm, no hard sell,
"no-obligation", no exclamation pile-ups. UK date format "Tue 4 Nov", 24 h times only in admin
diary; consumer surfaces say "10:30 am".

## 10. Verified copy bank (only these strings may appear verbatim — from `00-source-inventory.md`)

| Copy | Source |
|---|---|
| "we'll be in touch within one working day to confirm a time" | W03 (S05 receipt, R02) |
| "Every new treatment starts with a free consultation and patch test" | W02 (consult sheet) |
| "24 to 48 hours before your first full session" | W02 (patch-test chip) |
| "OPEN EVERY DAY, 10AM–6PM" / "Open seven days a week, 10am to 6pm" | W01 / live fetch |
| "From £35 per session" (pattern `From £{pence/100} per session`) | W04, R05 formatter |
| "Price on consultation" / "Free" | S03 pricing models |
| "Individual suitability and results vary." | S04 disclaimer |
| "Discussed at consultation" | S04 missing-data fallback (never invent) |
| "I'm not sure yet, advise me" | W03/DA-14 request kind |
| "Ask us for advice" | S09 empty states |
| "An update from Unique Laser Clinics — open the app to view." | R06/DA-09 push copy |
| "07301 166333" · "hello@uniquelaserclinics.co.uk" · "327 Deane Road, Bolton BL3 5HN" | W05/W01 |

Anything not on this bank that a screen needs = copy question for the owner (`07-questions`
append), not a developer sentence.
