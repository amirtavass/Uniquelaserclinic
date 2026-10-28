# 05-appointments / 02 — Cancel / Reschedule *Request* (C4 · S10 · DA-07)

Request-only, never self-service (S10/DA-07: no fees, strikes, blocking invented).
**Seam:** `requestAppointmentChange()` EXISTS (RPC; only from `SCHEDULED` — already-requested rows
are inert by design).

```text
┌──────────────────────────────┐
│ ←  Appointment · Fri 7 Nov   │
│ Patch test · 11 am            │
│ ──────────────────────────── │
│ Something come up? Tell the   │
│ clinic — they’ll sort a time  │   callback-first framing,
│ with you by phone.            │   R02 posture (no policy text
│                               │   that wasn’t confirmed, DA-07)
│ [ I’d like to cancel      ]   │ → kind CANCEL_REQUESTED
│ [ I’d like a different time]  │ → kind RESCHEDULE_REQUESTED
│ Optional note for the team    │
│ [ 2-line grow ]               │   → detail jsonb on event,
│                               │      verbatim (S10 AC)
├──────────────────────────────┤
│ Confirm “Send request”?       │  ConfirmSheet C19 — this is
│ [ Send ]   [ Keep as is ]     │  semi-destructive: it flags
└──────────────────────────────┘  a real person’s slot
```

After send — row badge flips to warn-tint "Cancel requested" (`00`), Home strip counts it in
requests-awaiting; staff queue surfaces it (F1/F2 intake, `11/02`).

**States**
- **Signed-out:** gate §2. **Null:** no upcoming → screen unreachable from list (no ghost entry).
- **Loading:** Send button spinner; RPC is one round trip.
- **Offline:** §5 — requests must land while they're still useful; pending-send variant reuses
  cross-cutting §6 but WITHOUT idempotency promise language (RPC not keyed — repeat = duplicate
  event row; UI locks button after first success and on ambiguous failure shows §5 + "call to be
  sure" link, honest, no fake dedupe invented).
- **Error:** appointment already not `SCHEDULED` (staff moved it meanwhile) → "This appointment
  has changed — refresh" + reload (`RPC update where status='SCHEDULED'` returns void; refetch
  tells truth).
- **Edge — double-tap:** button disables in-flight. **Edge — note with medical-sounding text:**
  allowed (client's own words, append-only event) but field carries DA-10 steering hint.
  **Edge — keyboard:** Send docks above. **Edge — very long note:** 12-line clamp + counter (500).

- **Signed-out:** gate card (cross-cutting §2) — client route; a dead session mid-sheet keeps the
  draft, and staff reaching it via deep link get the appointment’s own change flow in the admin
  workspace instead (../11-staff-diary/02-change-requests.md).
