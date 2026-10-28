# 11-staff-diary / 02 — Client Change Requests (F2 · S10→S15 · DA-07)

`CANCEL_REQUESTED` / `RESCHEDULE_REQUESTED` appointments surface in the Queue tab AND a ⚑ block on
the day board (locked shell: one intake stream, two entry points). Resolve screen is shared.
**Seams:** `staffChangeQueue()` ADD(M1) (appointments where status in change set) ·
`resolveChangeRequest()` ADD(M1) (sets CANCELLED / re-opens chain editor for rebook).

```text
┌──────────────────────────────┐
│ ←  Change request            │
│ Lena K. · Patch test · Fri 7 │  appointment context FIRST —
│ 11:00 — asks to RESCHEDULE   │  which visit, which kind
│ Note (verbatim): “work shift │  client’s own words, raw
│ moved, any morning after”    │  (kickoff: preserve text)
│ ──────────────────────────── │
│ [ Accept cancel → CANCELLED ]│  dangerText + C19 sheet
│ [ Rebook → opens chain sheet │  → 09/01 seeded for this
│       (this client) ]        │    client; sibling rows are
│                              │    NOT touched (no invented
│ The client expects the phone │  bulk-cancel cascade — each
│ call to lock the new time.   │  appointment = one record)
└──────────────────────────────┘
```

**States** — **Offline/error:** §5. **Concurrent:** second resolver gets "Handled by Sam · 16:05"
guard + row drops (mirrors `09/00`). **Empty:** ⚑ block hidden (no "0 change requests" chrome).
**Edge — cancel a PATCH_TEST that gates a SESSION:** soft line in the C19 sheet: "Her Session on
Tue 25 still stands — cancel it separately if needed." (fact, not automation — DA-06 warns, never
blocks; same philosophy here). **Edge — request against non-SCHEDULED row:** unreachable (RPC
path); if list is stale, resolve returns 0-updated → "This appointment has already changed" +
refetch. **Edge — long notes:** wrap fully. **Edge — ADVISE_ME request with no treatment:**
context block shows "no treatment chosen" honestly.

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
