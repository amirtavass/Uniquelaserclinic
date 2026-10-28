# 09-staff-queue / 01 — Confirm into the Chain (F1 core action · S12 · R03 · DA-04/05/06)

`decideBooking(id,'CONFIRMED')` + `scheduleAppointments({chain})` — both EXISTS. Confirm ALWAYS
produces at least a `CONSULTATION` row; new-treatment requests additionally get `PATCH_TEST` +
first `SESSION` (DA-04: patch test may share consultation day). ADVISE_ME confirms as a free
consultation with NO treatment_id yet (the conversation happens in the room).

```text
┌──────────────────────────────┐
│ ←  Confirm — Priya Sharma    │
│ Build her schedule (R03):     │
│ ┌ ① Consultation ──────────┐ │
│ │ Fri 7 Nov · 10:30 · 20 m │ │  duration seeded clinic-side
│ ├ ② Patch test ────────────┤ │  (20-minute consultation is
│ │ Fri 7 Nov · 11:00 · 15 m │ │  W-verified; patch shares day
│ ├ ③ First session ─────────┤ │  — DA-04 example)
│ │ Tue 25 Nov · 15:00 · 30m │ │
│ └──────────────────────────┘ │
│ [ + add row ] [ date/time    │  each row: date sheet + time
│   sheets per row ]            │  wheel; no slot-availability
│                               │  fiction (R02)
│ ⚠ Soft banner (rose tint —   │  DA-06: SESSION with no
│   never blocks Save):         │  completed PATCH_TEST before
│   “No completed patch test    │  it yet — normal at
│   recorded for this           │  scheduling time (it’s
│   treatment yet.”             │  upcoming) — banner only
│                               │  fires on true anomalies,
│ [ Schedule & confirm ]        │  audited, staff proceeds
└──────────────────────────────┘
```

**DA-05 gap banner (tattoo courses, `min_gap_days = 42`):**

```text
│ ⚠ Session 3 falls 14 days    │  computed from client’s
│   after Session 2 — tattoo   │  COMPLETED rows; rose tint,
│   guidance is ~6 weeks.      │  SAVE STAYS ENABLED (warns,
│   [Still save]               │  never blocks — DA-05)
```

**States**
- **Success:** rows insert; triggers log `booking_request_events` + auto-audit warnings; client
  side flips (R06 generic push). Staff returns to queue with toast "Priya scheduled — she’ll see
  it in the app".
- **Loading:** Save disabled in-flight; date sheets block double-open.
- **Offline/error:** §5 (never half-confirm offline); partial chain insert failure → the DB call
  is one insert-array (`scheduleAppointments`), so it's all-or-nothing; on error nothing is
  scheduled and request stays PENDING — UI says exactly that.
- **Edge — chain times collide (same therapist/room):** out of scope, no invented clash detector;
  owner Q3 (diary truth) covers it — logged as deviation-if-raised. **Edge — >5 rows:** "+ add"
  allows course schedules (6 sessions); rows reorder by time. **Edge — declined-then-reconsider:**
  handled from the detail's history note (no resurrect flow invented).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
