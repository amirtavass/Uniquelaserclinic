# 11-staff-diary / 01 — Outcomes: Completed / No-show (F2 · S15)

`recordOutcome(id,'COMPLETED'|'NO_SHOW')` ADD(M1) → status update; trigger logs the event with
actor + timestamp (append-only). One tap from a day-board row; NO_SHOW goes through ConfirmSheet
(C19 — it edits the client's visible history).

```text
row [Done]     → ✓ chip “Completed · 16:02” + toast (one step)
row [Missed]   → ┌──────────────────────────┐
                 │ Record did not attend?    │
                 │ Priya · Session · 15:30   │
                 │ This doesn’t charge or     │  DA-07: no policy
                 │ block anything; it’s the   │  language invented
                 │ clinic’s record of today.  │  — plain fact
                 │ [ Record missed ] [Keep]   │  dangerText / quiet
                 └──────────────────────────┘
undo: quiet “Changed — by Sam at 16:05” line on the row →
      sets SCHEDULED again (audited transition, no silent edit)
```

**States** — **Offline/error:** §5 hard (outcomes are the freshest data in the building; no
cached board actions). **Loading:** row spinner only (board stays interactive otherwise).
**Edge — double mark:** idempotent chips (Done pressed twice = same COMPLETED, no second event —
DB update where status differs; UI disables post-success). **Edge — marking a CONSULTATION complete
feeds DA-06 logic later** (patch/session prerequisites read COMPLETED rows — the loop closes in
`09/01`, nothing to say here to staff beyond the chip). **Edge — past day:** chips read-locked.
**Edge — keyboard/rotation:** sheets reflow; no outcome requires typing (reason-free by design;
adding reasons = owner diary Q3, not invented now).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
