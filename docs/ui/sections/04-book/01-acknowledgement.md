# 04-book / 01 — Acknowledgement (R02 verbatim receipt · S05)

Immediately after a successful `createBookingRequest` — the screen that makes the clinic's promise
visible. Nothing here says "booked".

```text
┌──────────────────────────────┐
│         ╭───────╮            │
│         │  ✦ ✓  │            │  gold ring + check (success
│         ╰───────╯            │   tint, no confetti motion —
│  Your request is in          │   04-screen-craft §5 calm)
│ ──────────────────────────── │
│ “We’ll be in touch within    │  ← VERBATIM copy bank (W03,
│  one working day to confirm  │     R02). Quotation-styled —
│  a time.”                    │     the clinic’s words, not ours
│ ──────────────────────────── │
│ Laser Hair Removal           │  treatment_name_snapshot +
│ Sat 22 Nov · Afternoon       │  preferred day/band
│ Requested — not yet booked   │  the PENDING truth in plain words
│ ┌──────────────────────────┐ │
│ │ The clinic sees it in     │ │  expectation-setter for S12;
│ │ their queue the moment    │ │  answers M01 “see updates”
│ │ you send it.              │ │  for this journey stage
│ └──────────────────────────┘ │
│ [ See my requests ]    [Done]│  → 02-my-request-status / Home
│ 🔔 Reminders will land 24 h  │  only shown when NOTIFICATIONS
│   before confirmed visits     │  consent was granted (S07 AC)
└──────────────────────────────┘
```

**States**
- **Signed-out:** gate card (cross-cutting §2) — the receipt is personal state; a sign-out mid-
  flow sends the user back to `02`'s gate, never an orphan receipt.
- **Loading:** guarded — route requires a submitted receipt in flow state; if app state was killed,
  render `02` status list instead (never an empty receipt).
- **Offline at submit:** this screen never appears; the pending-send dialog (cross-cutting §6) owns
  that moment.
- **Error:** none on a success surface (validation happened pre-route).
- **Edge — long treatment name:** 2-line title wrap. **Edge — request later declined:** historical
  receipt keeps its wording; `02` owns live status. **Edge — deep links:** not shareable; always
  re-reached via `02` (no notification links to a receipt, R06).
