# 10-staff-dialler / 00 — Directory Search (F3 · S18 · R04 · audited RPC)

☎ Dial tab top block = `search_clients` RPC (EXISTS seam `searchClients`) — every view writes a
`directory_view` audit row (server-side, before results: the UI cannot "preview then bail").
Zero health data anywhere (R04 — none exists in `public`).

```text
┌──────────────────────────────┐
│ ▣ Staff · Sam        [⌕] [⋯] │
│ ☎ Who’s calling?             │
│ [ 🔍 type a name or number ] │  matches first/last/phone_raw/
│ ┌──────────────────────────┐ │  e164 — RPC logic, mirrored
│ │ Priya Sharma             │ │  copy honestly
│ │ 07911 555012 ✓ · 2 books │ │  ✓=verified (DA-12); counts
│ │ ⚠ number unverified      │ │  flagged rows (DA-12 dupes)
│ ├──────────────────────────┤ │
│ │ Abdul H.  · 07301…       │ │
│ └──────────────────────────┘ │
│ ─── TODAY (jump) ───          │  same tab, second block —
│ Thu 6 · 5 booked · 1 change   │  F2 board entry (11/00)
│ [        Day board ▸       ]  │
├──────────────────────────────┤
│ 📥 ☎ Dial 💆 Care   ⋯        │
└──────────────────────────────┘
```

**States**
- **Null — 0 matches (phone-in from a stranger):** honest, non-dead-end:

```text
│ 🔍 "999888777"  ·  no matches │
│ ┌──────────────────────────┐ │
│ │ Nobody here under that     │ │  they may be a guest caller —
│ │ number yet. New clients    │ │  the app never fabricates a
│ │ can sign up themselves —   │ │  profile card from air
│ │ or invite them:            │ │
│ │ [ Take a booking over the  │ │  → pre-filled ✦ Request? NO —
│ │   phone ]                  │ │  staff queue intake = phase-2
│ │                            │ │  Q; for now: guide to clinic
│ │                            │ │  site steps, say so honestly
│ └──────────────────────────┘ │
```
  (The invite-on-behalf action is NOT built — no staff-side sign-up story exists in S01–S18;
  button reads "Ask them to create an account (2 min)" as a script line for the call, not a write.)
- **Loading:** rows skeleton under field; debounce 250 ms (shared `SearchField`).
- **Offline/error:** §5 hard — the audit seam must not "work offline" (a directory view that
  forgot to be audited is the failure ADR-004 prevents; surfaced as no-search + call-branch advice).
- **Edge — pseudonymised rows:** RPC excludes (`pseudonymised_at is null`) → deleted-by-GDPR
  numbers fall into 0-matches copy, no "this person was deleted" leak. **Edge — 50+ matches:**
  RPC caps 50; footer "More than 50 — narrow it down." **Edge — sensitive:** search terms are
  audited (meta.query) — documented, never shown back to staff.

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
