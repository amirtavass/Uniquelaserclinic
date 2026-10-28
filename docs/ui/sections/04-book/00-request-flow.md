# 04-book / 00 — Request Flow (C2 · S05 · DA-02 DA-03 DA-10 DA-14 · R02)

**Job:** "Book it — known treatment or 'advise me', in under a minute." Client only (gate →
`AuthGateSheet`). **Seam:** `createBookingRequest()` EXISTS (unique
`(clinic,client,idempotency_key)`; server snapshots treatment name+price — the UI never edits the
snapshot chrome). Guest `✦ Consult` tab is the static pre-face of this flow (W02 explainer +
sheet, no form chrome invented).

Kinds (`request_kind` enum): **Treatment** · **Free consultation** (any `CONSULTATION`) ·
**"I'm not sure yet, advise me"** — the site's own words, first option, always (W03/DA-14).

## Three layout variations (Gate 6 choice)

### L1 — 4-step stepper wizard (RECOMMENDED, locked default)

```text
step dots: ①─②─③─④  tap completed dot = go back (state kept)
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ ✦ Request            ● saved │ │ ✦ Request                    │
│ ──①──②──③──④────             │ │ ──●──●──③──④────            │
│ What do you want to start?   │ │ When suits you? (preferred,  │
│ ┌──────────────────────────┐ │ │  not a slot — R02)           │
│ │ I’m not sure yet,        │ │ │ Today Tomorrow [📅 Calendar] │
│ │   advise me         ★    │ │ │ ▓▓ Nov 2026 ▓▓               │
│ ├──────────────────────────┤ │ │ Su Mo Tu We Th Fr Sa         │
│ │ A free consultation      │ │ │          1  2  3  4          │
│ ├──────────────────────────┤ │ │ 5  6  7  8  9 10 11  ← past │
│ │ A specific treatment     │ │ │ greyed; Sat 22 ● picked      │
│ └──────────────────────────┘ │ │ Time of day:                 │
│ [            Next          ] │ │ (Morning)(Afternoon)(Evening)│
└──────────────────────────────┘ │ [            Next          ] │
 treatment picker (step 2):       ┌──────────────────────────────┐
 SearchField + grouped rows       │ ✦ Request — review           │
 (show_in_booking_dropdown seeds, │ ──●──●──●──④                │
 then any directory slug);        │ Laser Hair Removal           │
 PriceLabel right-aligned.        │ Sat 22 Nov · Afternoon       │
 ADVISE_ME skips step 2 (1→3).    │ Note: “evenings suit me”     │
 note field (step 3, optional):   │ ☑ Remind me (24 h before)    │
 │ Anything the clinic should     │ [       Confirm ✦          ] │
 │   know? (optional) [grow]      │ Past-tense framing — this is │
 │ ⓘ Please don’t include         │   a REQUEST, not booked yet  │
 │   medical details here —       │   (R02: no slot claims).     │
 │   that’s discussed at your     └──────────────────────────────┘
 │   consultation.  ← DA-10       Confirm = createBookingRequest
 │   steering copy (zero health    with a fresh idempotencyKey —
 │   capture fields)               unique index = safe retry
```

- **UX rationale:** progress dots make "one minute" *feel* true; one decision per screen keeps
  keyboard/UX failure local (step 4 never re-shows step 1 bugs). Step 2 skip for ADVISE_ME mirrors
  the widget. **Pros:** matches site widget order (treatment→day→time-ish); draft state saved per
  step; resume after auth gate; deep-linkable per `[step].tsx`. **Cons:** 4 screens ≥ 4 taps —
  slower than the site's single-page widget for power users. **Answers C2:** every listed Part-1
  field maps to a step; nothing else appears.

### L2 — Single scroll form (site `/book/` parity)
One page: kind → treatment → day → band → note → consents → submit, sticky button.

- **Rationale:** the clinic's own booking page is one form — continuity; fastest path once known.
  **Pros:** fewest taps (~6); no wizard chrome to build. **Cons:** validation errors can hide off
  screen; keyboard fights a long scroll on small phones; the "under a minute" claim becomes a
  scroll-length claim; progress invisible. **Answers C2:** yes, but "feel" suffers.
- **Verdict:** fallback if Gate 6 wants strict site parity for the demo; M1 wizard state machine
  would need an all-at-once mode added.

### L3 — Conversational one-question cards
Full-bleed stacked cards, auto-advance on choose, back-swipe to edit.

- **Rationale:** fastest possible novice path (typeform energy). **Pros:** 3 taps for
  ADVISE_ME; feels premium. **Cons:** auto-advance removes review before review exists; notes
  field awkward; hard for accessibility (unexpected focus changes); "chat with a form" reads as
  dark-pattern-lite for a clinic. **Answers C2:** kind/day/band yes — notes/review awkward.

**Decision: L1.** Copy locked: no availability claims (R02) — the calendar greys *past days only*;
every future day is "preferred". Time-of-day labelled exactly `Morning / Afternoon / Evening`
(DA-03). Reminder checkbox writes `recordConsent(NOTIFICATIONS, GRANTED)` (S07 AC — asked at
booking, never forced; unchecked = no prompt again in flow).

## States

**Signed-out:** route renders gate card (cross-cutting §2) — draft preserved so sign-in returns to
the same step.

**Null/empty:** n/a for kind rows (static enum). Step 2 picker empty catalogue → `EmptyState`
"treatments are being refreshed" + "advise me" quick link (self-healing path, never dead end).

**Loading:** step transitions instant (local); submit = button spinner, dots freeze; re-entry
renders draft before any fetch (no spinner over typed work).

**Offline:** steps 1–4 fully usable offline (draft device-local); submit blocked with banner §4-
style *pending-send* card:

```text
│ ⚠ Not sent — you’re offline. │
│   We keep your request open; │  draft + same idempotency
│   [Try again] [Save & close] │  key held until success
```

**Error / validation:** inline per step (Next disabled until kind + date chosen; band optional
per DA-03 — if NULL, staff ask on the callback). Submit failure → **idempotency retry dialog**
(cross-cutting §6) — same key, no duplicates. Server rejection (RLS/trigger) surfaces verbatim
mapping (S05 AC: nothing client-side can set status).

**Edge — note too long:** grow to 12 lines then character counter (`420/500`); verbatim storage
(`notes_client` raw), no trimming, no sanitising beyond length cap (cap = open question logged,
not invented as policy — M1 uses generous 500 with counter). **Edge — keyboard open:** note step
docks Next above keyboard; scroll keeps focused line visible. **Edge — phone rotates landscape:**
wizard stays centred max-width; admin never assumes this (their tables scroll). **Edge — re-open
app mid-flow:** Home row "Resume your request" chip (draft exists) → step saved; discard option.
