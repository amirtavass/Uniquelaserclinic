# 12-staff-comms / 01 — Publish & Unpublish Updates (F4 · S14 · RLS drafts)

💆 Care tab block 2. `staffUpdates()` (incl. DRAFT) + `createUpdate/publishUpdate/unpublishUpdate`
ADD(M1). `update_revisions` trigger keeps history; no *delete* verb offered — unpublish reverses
visibility, history stays.

```text
┌──────────────────────────────┐
│ ←  Clinic updates            │
│ PUBLISHED (3)                │
│ ● Opening hours note · 3 d   │  row actions:
│ ● Client story: Sarah M. 1 w │   [Edit→new draft] [Unpublish]
│ ● Free patch-test policy 2 w │   (dangerText, C19 confirm)
│ ──────────────────────────── │
│ DRAFTS (1)                   │
│ ✎ “Summer pigmentation…”     │  drafts = staff-only (RLS;
│ ──────────────────────────── │  invisible to clients — proven
│ ┌── composer ──────────────┐ │  by verify:rls, not UI hiding)
│ │ New update               │ │
│ │ T [ title…………………  ]    │ │  helper: reads in YOUR
│ │ B [ body…………………  ]    │ │  clinic’s voice — no
│ │ │ 2-line card preview     │ │  marketing script invented
│ │ [ Save draft ]           │ │  (R09 spelling lint on save)
│ │ [    Publish now    ]  ← primary
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**States** — **Null:** "Nothing written yet." + blank composer (composer IS the empty state).
**Publishing:** button spinner → toast "Live — clients get a generic bell (R06)." The one place the
preview rule is *named* to staff. **Unpublish:** C19 "Clients will no longer see this; history is
kept." → yes. **Offline/error:** §5 (never let staff think a half-sent update is live).
**Edge — publish then immediately unpublish:** revision rows accumulate (S14 AC "history
preserved"); client side gets the gone-card (`07/00`). **Edge — very long body:** composer grows;
preview clamps 2 lines (full on client tap). **Edge — title with a treatment name:** allowed here
(it's a published update title the client opens, NOT a push preview — the `assert_r06_generic_copy`
tripwire only guards `notifications.title/body`); composer hints "Preview text stays generic" once.
**Edge — draft left by colleague:** author line "— Sam, 2 d ago" on the draft row (attribution
from birth; ownership stays open per Q09).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
