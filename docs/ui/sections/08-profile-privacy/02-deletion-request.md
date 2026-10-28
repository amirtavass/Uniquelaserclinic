# 08-profile-privacy / 02 — Deletion Request (C7 · S11 · DA-17 · ADR-005)

Client side is a *request*, never a self-executing delete (S11 AC: human workflow, no silent
deletes). Owner queue lives at `14-owner-access/01`.
**Seam:** `requestDeletion()` ADD(M1) → insert `deletion_requests` (status REQUESTED).

```text
┌──────────────────────────────┐
│ ←  Request data deletion     │
│ You can ask us to remove     │
│ your account and details.    │
│ ┌──────────────────────────┐ │
│ │ What this means          │ │  plain-English, ADR-005
│ │ • Your name & mobile     │ │  pipeline described HONESTLY:
│ │   are removed            │ │  pseudonymise + hard-delete
│ │ • Appointment history    │ │  tokens/reminders/reads;
│ │   is kept in a form that │ │  “kept in a form that can’t
│ │   can’t identify you,    │ │   identify you” = pseudony-
│ │   where the law lets us  │ │   misation, not silent
│ │   keep records           │ │   destruction (no invented
│ │ • Marketing stops        │ │  erasure promises)
│ │ • Consent records stay   │ │  (R08 evidence — shown,
│ │   as proof of your        │ │  not hidden)
│ │   choices                │ │
│ └──────────────────────────┘ │
│ Anything you still want      │
│ first? Export/check here:    │
│ [Ask the clinic a question]  │  S09 bridge before irreversible
│                              │  step — clinic’s own chance
│ [     Request deletion     ] │  dangerText + ConfirmSheet
├──────────────────────────────┤  C19, typed reason optional
│ ✓ Request received · Tue 4   │  success = status row; THIS
│   Nov. The owner reviews     │  screen then shows waiting
│   requests personally —      │  state forever until action:
│   we’ll tell you here.       │
└──────────────────────────────┘
```

**States** — signed-out: unreachable. **Null/first visit:** the explainer IS the empty state (no
prior requests row; list = none). **Loading:** confirm-sheet spinner. **Offline:** request blocked
(§5) — a deletion request that never lands is the worst kind of half-truth. **Error:** RLS reject
(not own insert) = impossible by design, mapped anyway per cross-cutting §8. **Edge — pending
appointment:** warning line inside sheet: "You have a confirmed visit on 6 Nov — request deletion
anyway?" (fact + link to appointments; no invented policy that it blocks either way — owner Q4).
**Edge — duplicate open request:** button reads "Request already pending — [Withdraw?]"? NO:
`Withdraw` isn't in schema; UI shows status row only (REQUESTED/IN_REVIEW), no new insert —
honest mirror of data shape.
