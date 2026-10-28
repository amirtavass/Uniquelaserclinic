# 11-staff-diary / 00 — Day Board (F2 · S15/S16-adjacent · 24 h time format here)

Lives under ☎ Dial (locked shell: diary + outcomes ride the Dial tab). Admin surfaces use 24 h
times (density); consumer surfaces never do (`04-screen-craft` §9).
**Seams:** `staffAppointmentsOn(date)` ADD(M1); date chip strip = day nav; **no slot availability
anywhere** — the board shows booked rows, not a free-calendar fantasy (R02).

```text
┌──────────────────────────────┐
│ ←  Day board      ◀ Thu 6 ▶  │  weekday strip below header
│ ┌(Wed)(Thu 6)●(Fri)(Sat)┐    │  ● = has appointments
│ TODAY · 6 booked · 3 people   │  counts = completed glance
│ 10:30 ▸ Priya Sharma · CONSULT│  row: time · client · TYPE chip
│       20 min · [Done][Missed] │  outcome shortcuts (01)
│ 11:00 ▸ Priya Sharma · PATCH  │  same client groups visually
│       15 min · [Done][Missed] │  (chain coherence, R03)
│ 14:00 ▸ Tom H. · CONSULT ✦ADVIS│  ADVISE tag when no treatment
│       20 min                  │
│ 15:30 ▸ Lena K. · SESSION     │
│   ⚠ no completed patch test   │  DA-06 soft warn tint — never
│     recorded (audited)        │  blocks the day, never on client
│ 16:00 ▸ Abdul H. · SESSION    │
│   ⚠ 14 d since last · min 42  │  DA-05 gap warn (tattoo rule)
│ 17:00 ▸ — · room free         │  NO — empty hours are simply
│                               │  absent (no fake grid filler)
│ ⚑ 1 cancel request pending    │  → 02-change-requests
│ [  +  Add an appointment      │  walk-in/manual row? phase-2
│     (walk-in) ]               │  Q04 — hidden until answered
└──────────────────────────────┘
```

**States** — **Empty day:** "Quiet — nothing scheduled." + queue shortcut (walk-ins exist per W05;
no invented "call clients to fill it" nudge). **Loading:** skeleton rows; **offline:** §5 hard
(a board you can't trust is worse than paper). **Error:** §5 + retry.
**Edge — 10+ rows:** scroll, hour gutter sticky; **Edge — client name long:** wrap, never cut mid-
surname; **Edge — therapist column:** not modelled per-appointment display (`therapist_user_id`
exists; owner diary question Q3 — shown only if seeded, else "—"); **Edge — past day:** same board,
outcomes become read-locked chips; **Edge — override day (closed):** banner "Closed — Christmas
Day" from `13/01`, rows still listed (they exist in DB).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
