# 14-owner-access / 01 — GDPR Deletion Queue (F7 · S11 · DA-17 · ADR-005)

**TIER: OWNER-SECONDARY** (same flag as `00-seats`; client-side request screen is `08/02`, live
from M1). Owner sees `deletion_requests`; nothing deletes itself. Pipeline states mirror the enum:
`REQUESTED → IN_REVIEW → COMPLETED` (or `REJECTED` with a note).
**Seams:** `deletionQueue()` + `startDeletionReview(id)` + `applyDeletion(id)` ADD(M1) —
`apply_deletion` is SECURITY DEFINER, owner-checked, and the only path the append-only GUC allows
through the guards (ADR-006).

```text
┌──────────────────────────────┐
│ ←  Deletion requests         │
│ 1 in review · 2 new           │  counts = the queue’s only
│ ┌──────────────────────────┐ │  headline stats (no invented
│ │ ● Priya Sharma · now     │ │  dashboard — kickoff trap)
│ │   REQUESTED              │ │
│ │   “note from app” ▾      │ │  optional client note raw
│ │   [ Open review ]         │ │  → status IN_REVIEW (audit)
│ ├──────────────────────────┤ │
│ │ ○ Tom H. · 3 days        │ │
│ │   IN_REVIEW — Ayesha      │ │  handled_by shown on entry
│ │   Check open items:        │ │  review checklist = facts
│ │   ✓ no open enquiry        │ │  from data, not judgement:
│ │   ⚠ 1 upcoming appointment │ │  (queries, answers; owner
│ │     — call first? (Q05)   │ │  decides; app never auto-
│ │   ✓ payment: none in app  │ │  cancels anything)
│ │   [ Execute pseudonymise ] │ │
│ │   [ Return to client via  ] │ │  REJECTED + note (keeps
│ │     note ]                  │ │  request visible, honest)
│ ├──────────────────────────┤ │
│ │ ✓ Abdul H. · COMPLETED    │ │  completed_at + actor; row
│ │   12 Oct · by Ayesha      │ │  remains (audit trail IS the
│ └──────────────────────────┘ │  product here)
└──────────────────────────────┘
```

Execute confirmation (the screen's only heavyweight moment):

```text
│ ╔══════════════════════════╗ │
│ ║ Pseudonymise Priya?      ║ │  verb = the pipeline’s actual
│ ║ ──────────────────────── ║ │  name (ADR-005 — “delete” is
│ ║ • name → “Deleted client”║ │  what the client asked; the
│ ║   phone removed, profile │ ║ │  record says what happens)
│ ║   unlinked               │ ║
│ ║ • bookings/notes keep a  ║ ║  LEGAL_OBLIGATION /
│ ║   record that can’t      ║ ║  CLAIMS_DEFENCE flags are
│ ║   identify them          ║ ║   settable — surfaced as the
│ ║ • push tokens &          ║ ║   schema has them, not as
│ ║   reminders: deleted     ║ ║   invented retention policy
│ ║ • consent records: KEPT  ║ ║  (R08 evidence, verbatim
│ ║   as proof of choices    ║ ║   from apply_deletion body)
│ ║ This can’t be undone.    ║ ║
│ ║ type “delete” to confirm ║ ║  typed-intent gate (C19++),
│ ║ [ Execute ]  [ Back ]    ║ ║  dangerText primary
│ ╚══════════════════════════╝ ║
```

**States**
- **Empty:** "No deletion requests." — one line, no reassuring prose about GDPR (calm is a
  feature; the queue should feel like post, not drama).
- **Loading:** rows skeleton; Execute always disabled until fresh load (never run against a cached
  request id — id may already be COMPLETED).
- **Offline/error:** §5; `apply_deletion` failure = nothing partially done (single SECURITY DEFINER
  function, transactional) — message shown verbatim + "Try again" (safe: re-run sees same state or
  COMPLETED).
- **Edge — request for a pseudonymised person:** row already COMPLETED; re-entry impossible
  (status filter); search_clients excludes them (`10/00` ghost-proof). **Edge — client with
  REQUESTED status keeps using app meanwhile:** SCHEDULED appointments survive until execute;
  the review checklist warns about exactly that (⚠ line) — no silent auto-cancel (DA-07 posture).
  **Edge — REJECTED note empty:** inline require ("Why, for the audit row?") — the audit is the
  point of the screen (S11: human workflow, traceable).
- **Edge — long list:** REQUESTED first (working set), history below month headers.

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
