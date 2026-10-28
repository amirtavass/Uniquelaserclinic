# 05-appointments / 01 — Patch-Test Chain Tracker (C3 · R03 · W02)

The R03 promise as a glanceable stepper. Component `ChainStepper` (C5) — states: done ✓ / next ● /
later ○. Data = own `appointments` rows for that treatment; order `CONSULTATION → PATCH_TEST →
SESSION`.

```text
┌──────────────────────────────┐
│ ←  Your treatment journey    │
│ Laser Hair Removal           │
│                               │
│  ①✓──────②●──────③○          │   done → current → waiting
│  Free     Patch    First      │   (labels type-first, site
│  consul-  test     session    │    wording W02 — the client
│  tation                       │    reads their own names)
│ ──────────────────────────── │
│ ✓ Free consultation           │
│   Tue 22 Oct · attended       │  COMPLETED row
│ ● Patch test                  │
│   Fri 7 Nov · 11 am · Confirmed│
│   “A small test patch is      │  24–48 h copy bank card
│    performed 24 to 48 hours   │  (W02 verbatim range)
│    before your first full     │
│    session.”                   │
│ ○ First session               │
│   Mon 1 Dec · 3 pm            │
│   Will confirm after your     │  honest sequencing — no
│   patch test is reviewed      │  invented block; soft rule
│                               │  lives staff-side (DA-06)
│ ──────────────────────────── │
│ Questions about the patch     │
│ test? [ Ask us for advice ]   │  S09 bridge
└──────────────────────────────┘
```

**States**
- **Signed-out:** unreachable (own data) → gate card §2.
- **Null — chain incomplete:** e.g. only CONSULTATION seeded by staff: stepper shows ①✓, ②③ with
  "To be scheduled by the clinic" (mirrors S04 "Discussed at consultation" honesty — never fake
  dates).
- **No PATCH_TEST at all (DA-06 client view):** sessions row still shows; no scary warning for
  clients (the warning is staff-side, `09/01` — UI posture: calm facts).
- **Loading:** `DetailSkeleton`; **offline:** §5 error; **error:** §5.
- **Edge — long gaps between steps:** no invented "expiry" language; owner Q13 (intervals) open —
  tracker shows dates, nothing else. **Edge — multiple courses (tattoo + hair):** treatment
  switcher chips above stepper, one chain per treatment row set.
