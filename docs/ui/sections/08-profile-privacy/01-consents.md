# 08-profile-privacy / 01 — Consents (R08 · S11 · DA-09)

Every toggle is a consent ROW, versioned by policy text — `recordConsent()` EXISTS; current
decisions read via `getMyConsents()` ADD(M1) (latest per kind). Withdrawal is *always* one tap +
confirm; granting never buried.

```text
┌──────────────────────────────┐
│ ←  Notifications & marketing │
│ ┌──────────────────────────┐ │
│ │ Appointment reminders    │ │  NOTIFICATIONS — off =
│ │ push, 24 h before a      │ │  in-app reminder list still
│ │ confirmed visit           │ │  works (S07 AC fallback,
│ │            [ON  ●———]    │ │  stated right here)
│ ├──────────────────────────┤ │
│ │ News & offers by email   │ │  MARKETING — separate row
│ │            [———○ OFF]    │ │  kind, never bundled
│ ├──────────────────────────┤ │
│ │ Data processing          │ │  DATA_PROCESSING — required
│ │ Required to hold your    │ │  to use the app; shown as a
│ │ bookings with us.        │ │  read-only row + policy link
│ │ v2026-10 · recorded 22    │ │  (version + date = R08
│ │ Oct 2026 · [view text]   │ │  evidence trail visible)
│ └──────────────────────────┘ │
│ Your choices are stored as    │
│ dated records — you can        │
│ change them any time.          │
└──────────────────────────────┘
```

**States**
- **Signed-out:** unreachable (own data) → gate card §2.
- **Null — no consent rows yet (legacy/phone-created account):** required row renders
  "No record of your agreement on file — please confirm" with a review+accept action; optional
  toggles start OFF (no presumed consent, R08).
- **Toggle tap:** optimistic? NO — write first, switch follows `recordConsent` result; failure
  reverts + `danger` inline line + retry (R08 integrity > snappiness).
- **Withdrawal confirm sheet:** "Turn off reminders? We’ll stop pushing; your in-app list keeps
  working." [Turn off] [Keep on]. Marketing withdrawal: one line, no guilt copy (tone bank:
  clinic's honest, no-pressure voice).
- **Loading:** switches disabled + `DetailSkeleton` rows. **Offline:** switches disabled + §4-style
  banner "Reconnect to change settings" (a consent write MUST reach the DB — never queued
  half-known; explicit, honest).
- **Error:** §5. **Edge — policy version bump:** new DATA_PROCESSING row requested on next open
  (banner above list: "Our privacy notice updated — review & confirm"); until confirmed,
  booking writes remain allowed? — **open Q** (owner/legal), UI blocks new requests with the
  review banner CTA and *says why*, silent lockout avoided.
- **Edge — after deletion request (02):** consents retained as evidence (DA-17) — screen shows
  "Account pending deletion — settings locked" state.
