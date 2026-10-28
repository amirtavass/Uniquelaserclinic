# 05-appointments / 00 — My Appointments (C3 · S06 · R03)

Upcoming first, past retained (S06 AC). **Seam:** `myAppointments()` EXISTS (own rows,
type/status/start/duration). Status words via P7: SCHEDULED "Confirmed" · CANCEL_REQUESTED
"Cancel requested" (warn tint) · RESCHEDULE_REQUESTED "Reschedule requested" (warn tint) ·
COMPLETED (past) · NO_SHOW — shown factually ("Did not attend") without judgement, no invented
penalty copy (DA-07).

```text
┌──────────────────────────────┐
│ ←  My appointments     [🔔]  │
│ UPCOMING                      │
│ ┌──────────────────────────┐ │
│ │ ① Consultation           │ │  type icon (ChainStepper hue)
│ │ Thu 6 Nov · 2:30 pm       │ │  duration if seeded
│ │ ● Confirmed   24 h reinder│ │  reminder chip when scheduled
│ │   before: PATCH TEST due   │ │  (R03 one-line tracker entry
│ ├──────────────────────────┤ │   → opens 01-patch-test-tracker)
│ │ ② Patch test              │ │
│ │ Fri 7 Nov · 11 am         │ │
│ │ ● Confirmed               │ │
│ ├──────────────────────────┤ │
│ │ ③ Session · Laser Hair…  │ │  SESSION rows MAY show the
│ │ Mon 1 Dec · 3 pm          │ │  treatment name (this is the
│ │ Awaits patch-test result  │ │  app, not a push preview — R06
│ └──────────────────────────┘ │  governs previews only)
│ PAST                          │
│ ✓ Consultation · 22 Oct      │  list stays; no purge UI
│ ○ Did not attend · 14 Oct    │
│ [ ✦ Request another ]        │
└──────────────────────────────┘
```

Row tap → `[id]` detail: date/time/duration, type, chain position (`01`), address card,
`[Call clinic]`, and the two request actions from `02` (`Cancel…`, `Reschedule…`) — request-only
chrome, no policy text invented (DA-07: "Ask the clinic — there are no automatic fees or blocks
in this app" is shown ONLY if owner confirms; until then buttons read "Send a request", full stop).

**States**
- **Signed-out:** gate card §2.
- **Empty upcoming, some past:** upcoming block: "Nothing booked yet. [ ✦ Request ]" — past list
  still renders (retention, S06).
- **Empty everything:** C1 welcome variant, one CTA (cross-cutting empty pattern).
- **Loading:** `ListSkeleton(3)`; list replaces atomically (no row flicker).
- **Offline:** §5 error card — never a stale appointment (people drive to these).
- **Error:** §5. **Long:** treatment names 2-line wrap. **Edge — cancelled by staff while you
  read:** next refetch flips badge; no push-preview spoiler (R06 keeps it "open the app").
  **Edge — same-day chain (DA-04 consultation+patch shared day):** two rows same date, chain
  order preserved by time; tracker notes "same day" dot-connect.
