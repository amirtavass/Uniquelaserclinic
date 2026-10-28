# 05 — Component Library (build these once; screens reuse)

**Law:** if a component exists here, a screen may not re-invent it; if a screen needs something
new, it becomes a library row first (`00-design-system-usage-rules.md` §5). All props take tokens
or domain enums, never hexes or raw enums-as-string. Directory under `components/` is M1's choice;
names below are binding.

## A. Primitives

| # | Component | Props / contract | Used by (sections) |
|---|---|---|---|
| P1 | `Screen` | safe-area wrapper, banner slot, scroll config, `canvas` role (`light`/`night`/`hero`) | all |
| P2 | `AppText` | `role` per `04` §2 table + `canvas` override; renders `typography` tokens only | all |
| P3 | `Eyebrow` | uppercase tracked caption (site `.label` pattern) | home, discover, staff hub |
| P4 | `Button` | `primary` (gold gradient, night label, 52 pt) · `secondary` (plum) · `ghost` · `quiet` · `dangerText`; `loading` spinner keeps width; full-bleed variant for sticky bar | all |
| P5 | `Field` | label + input + helper + error slot; types `text/tel/email/select/date/timeband`; error = `danger` border+caption, helper = `inkSoft`; ≥ 44 tall | auth, request, profile, staff forms |
| P6 | `Card` | `white`/`night`/`rose` surface, `radii.md`, hairline `borders.line`; optional `onPress` (whole-card a11y label) | everything listy |
| P7 | `Badge` / `CountBadge` | status pills: `SCHEDULED→"Confirmed"`, `PENDING→"Awaiting confirmation"` (role copy bank `04` §10, never raw enums on screen); `CountBadge` = gold dot + numeral, labelled | queue, appointments, updates, profile |
| P8 | `StatusDot` | open/closed — `statusOpen` dot (+ halo) / `mutedNight`; pairs with text, never colour alone | guest home, contact, admin strip |
| P9 | `PriceLabel` | integer pence → `"From £35 per session"` / `"Price on consultation"` / `"Free"` (`pricing_model` enum driven, R05/R09) | discover U1/U2, admin prices |
| P10 | `DateLine` / `TimeBandPill` | UK format rules from `04` §9; bands render `Morning / Afternoon / Evening` | request, appointments, diary |
| P11 | `Divider` | hairline; `goldLine` variant for hero-section rules | all |
| P12 | `Icon` | named set only (house/body/spark/phone/person/tray/ellipsis/back/close/check/warn/clock); a11y label required when interactive | all |

## B. Composites

| # | Component | Contract | Sections |
|---|---|---|---|
| C1 | `TreatmentCard` | name · summary (2-line clamp, tap opens full) · session guidance line (`typical_sessions_min/max`, else `"Discussed at consultation"`) · `PriceLabel` · category chip; `is_featured` star slot | `03-discover/00·01`, guest home rails |
| C2 | `FilterPillRow` | horizontal scroll pills; active = plum fill + pearl label; keyboard-order preserved; state-in-URL for deep links | `03-discover/00·02`, `09/00` chips |
| C3 | `SearchField` | debounced (250 ms) `getTreatments({search})`; recent-terms chip row (device-local); clear button | `03/00`, `10/00` |
| C4 | `OpenClosedBanner` | computed from cached `opening_hours` (+ overrides); offline adds "times may have changed" suffix | `02-home/00`, `03/03` |
| C5 | `ChainStepper` | R03 tracker: `CONSULTATION → PATCH_TEST → SESSION` horizontal stepper; states done/next/blocked-soft; DA-06 soft note slot | `05/01`, `09/01`, client home |
| C6 | `RequestCard` (admin) | kind chip (`Treatment`/`Consultation`/`Advise me`), name+phone tap-to-call, preferred day+band, verbatim client note, unseen dot | `09/00` |
| C7 | `AppointmentRow` | type icon + title, date, status `Badge`, right-chevron; `CANCEL_REQUESTED`/`RESCHEDULE_REQUESTED` show warn tint (DA-07) | `05/00`, `10/01`, `11/00` |
| C8 | `ThreadBubble` | author role (`CLIENT`/`STAFF`) label, timestamp, wrap-full text (no truncation), verbatim body (`notes_client` discipline) | `06/00`, `12/00` |
| C9 | `SoftWarnBanner` | `rose`/warn tint, icon + text + optional dismiss; **never blocks the action it warns about** (DA-05/06) | `09/01·02`, queue detail |
| C10 | `OfflineBanner` | cached-data notice (catalogue) / offline-error notice (personal data) — two tints, one component | `00-cross-cutting` §4 |
| C11 | `ErrorRetry` | message + `Button ghost "Try again"`; submit-failure variant shows idempotency copy ("This request will not double-send") | `00-cross-cutting` §5–6 |
| C12 | `EmptyState` | icon, one-line title, verified copy, one action — `S09` variant: "No matches. **Ask us for advice**" → enquiry/sign-in | `03/00`, `05/00`, `10/00`, `09/00` |
| C13 | `Skeleton` set | `ListSkeleton(n)`, `CardSkeleton`, `DashboardSkeleton`, `DetailSkeleton` — shimmer = opacity pulse (`04` §5) | every loading state |
| C14 | `BottomSheet` | detent half/full; used by `AuthGateSheet`, pickers, staff quick actions; scrim tap dismisses; focus trap | `00-cross-cutting` §3, forms |
| C15 | `PickerSheet` | generic list picker (treatment, reason, appointment type chain) with search header when > 8 rows | request, queue, prices |
| C16 | `StepperDots` | request flow progress (4 steps), step label, tap-back to earlier steps (state preserved) | `04-book/00` |
| C17 | `ConsentToggle` | row + switch + policy version caption; withdrawal is a second tap + confirm sheet (R08) | `08/01`, sign-up |
| C18 | `IdentityStrip` | admin-only: role chip + first name + unseen count + `⋯` menu incl. `[Switch to Client View]` | `admin` shell |
| C19 | `ConfirmSheet` | destructive-action gate (cancel request, revoke seat, deletion, unpublish): title + reason (optional) + `dangerText` + quiet cancel | `05/02`, `14/00·01`, `12/01` |
| C20 | `Toast` | 1-line success/failure snackbar, max 4 s, never for R06-relevant content (push previews stay generic) | all writes |

## C. What we deliberately do NOT build (yet)

- Slot/time pickers for live availability (R02/DA-02 — no fictitious slots).
- Payment/price calculators or package purchase chrome (out per `08-scope`).
- Health-questionnaire inputs (R04/DA-10 — free-text with steering copy only).
- Photo pickers / before-after UI (phase 2, consent design first).
- In-app chat marketing bubbles or invented clinic policies.
