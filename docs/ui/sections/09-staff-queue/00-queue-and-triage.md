# 09-staff-queue / 00 — Staff Queue & Triage (F1 · S12 · R02 R03 R07)

**Shell:** `admin/(tabs)` 📥 Queue — top identity strip (C18), unseen CountBadge. Newest-first
(S12 AC). **Seams:** `staffQueue()` EXISTS (PENDING + client profile join) ·
`getRequestDetail(id)` ADD(M1) · `markQueueSeen()` ADD(M1, device stamp). Admin never shows stale
personal data — offline is a hard error (cross-cutting §5), no cached queue.

Queue rows carry the request snapshot the DB computed (`treatment_name_snapshot`,
`price_from_pence_snapshot`, preferred day/band, verbatim `notes_client`) — staff trust the numbers
here are the ones the client saw (R05).

## Three layout variations (Gate 6 choice)

### L1 — Unseen-first stack w/ day headers (RECOMMENDED, locked default)

```text
┌──────────────────────────────┐
│ ▣ Staff · Sam        ●3 [⋯]  │  C18 IdentityStrip; ● unseen
├──────────────────────────────┤
│ 📥 Queue        [◷ Today][⌕] │  tabs: All · Today · Advise-me
│ TODAY · 3 NEW                 │
│ ┌──────────────────────────┐ │
│ │ ● Priya S. · 079xx…  [☎] │ │  ☎ = one-tap tel: (S12 callback)
│ │   TREATMENT              │ │  kind chip = request_kind
│ │   Laser Hair Removal     │ │  (P7 words, not raw enum)
│ │   prefers Sat 22 · Aftn  │ │
│ │   note: “evenings suit”  │ │  verbatim, italic, 1-line clamp
│ │   [View ▸]        10:32  │ │  → triage [requestId]
│ ├──────────────────────────┤ │
│ │ ● Tom H. · 073xx…    [☎] │ │
│ │   ADVISE ME  ✦           │ │  no treatment — the “I’m not
│ │   prefers Mon 10 · Morn  │ │  sure yet” kind, flagged (J2)
│ │   [View ▸]        09:15  │ │
│ ├──────────────────────────┤ │
│ │ ● Lena K. · RESCHEDULE   │ │  client-initiated change also
│ │   Patch test Fri 7 · [☎] │ │  lands here (F1 intake =
│ │   [View ▸]        08:50  │ │  S10 requests too — dial note)
│ │ ── YESTERDAY · 1 ──        │
│ │ ○ Abdul H. · CONSULTATION  │  seen rows = hollow dot
│ │   Tue 21 · [View ▸] 16:02 │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ 📥 Queue   ☎ Dial   💆 Care   ⋯  │  admin tab bar
└──────────────────────────────┘
```
- **UX rationale:** reception triage is *triage-by-newness with a same-day focus*; day headers give
  the "did I deal with yesterday?" glance; the ☎ tap is the whole job (call back within 1 working
  day, R02). **Pros:** unseen dot = the badge S12 asks for; one action per row (View); dense but
  readable. **Cons:** mixed booking/chrome list needs clear kind chips (done). **Answers F1:**
  queue + unseen badge + all three request kinds + client changes on one surface.

### L2 — Split by request kind (segmented control at top)
`[Bookings (2)] [Changes (1)] [Advise-me (1)]` — each tab a clean same-kind list.
- **Rationale:** different muscles: confirmations vs reschedule resolves are different staff jobs.
  **Pros:** no kind-chrome clutter; fast "just show me what to confirm". **Cons:** 3 taps to see
  the whole morning; a busy desk misses the forest; unseen count splits across tabs. **Answers F1:**
  yes, but fragments the "new requests" promise.

### L3 — Triage board (kanban columns): New → Called → Scheduled
Swipe-a-card columns; card leaves the queue only when an appointment chain is booked.
- **Rationale:** visual workflow, satisfying to empty. **Pros:** shows work-in-progress; great for
  two staff sharing a queue. **Cons:** the schema has `PENDING/CONFIRMED/DECLINED/RESCHEDULED/
  CANCELLED` — a *Called* state isn't modelled (would be a phantom status, kickoff "no invented
  status values"); heavier to build; overkill for ~3 requests/day (M01 scale). **Verdict:** parked
  phase-2 candidate with a note that it needs a `contacted_at` field (owner question).

**Decision: L1.**

## Triage detail (`queue/[requestId].tsx`) — reached by every row

```text
┌──────────────────────────────┐
│ ←  Request · Priya Sharma ●  │
│ ☎ 07911 555012  ✓ verified   │  DA-12 status chip
│ TREATMENT — Laser Hair Rem.  │  snapshot name+price (R05)
│ From £35 · requested 10:32   │
│ Prefers: Sat 22 Nov, Afternoon│
│ Note (verbatim):             │  preserve raw client text
│ “evenings suit me better”    │  (kickoff: raw alongside struct)
│ ──────────────────────────── │
│ 3 steps before a session:    │  R03 chain reminder
│ ① Consultation ② Patch ③ Sess│  inline mini-stepper (C5)
│ ──────────────────────────── │
│ History: 1 past appointment  │  link → dial/client detail
│                              │  (context, not clutter)
│ [ ✓ Confirm & schedule ]     │  primary → 01-confirm-chain
│ [ ↺ Propose alternative ]    │  secondary → 02-decline-propose
│ [ ✕ Decline… ]               │  dangerText → 02 (needs reason)
└──────────────────────────────┘
```

**States (whole tab)**
- **Signed-out / wrong role:** admin guard (nav-ia §4) — friendly "staff only", back to consumer.
- **Empty queue:** "Inbox zero — nothing waiting. [See today’s diary]" (links F1↔F2; quiet, the
  clinic gets walk-ins too). Never a skeleton graveyard.
- **Loading:** `ListSkeleton(3)` rows with ☎ disabled until real data.
- **Offline / error:** §5 hard error + call line (no stale triage — staff must not decline a
  request that a colleague already handled; freshness is a data-integrity choice, R07).
- **Concurrent decide:** two staff open one request; second `decideBooking` returns already-decided
  → toast "Priya’s request was handled by Sam" + row drops out (append-only event shows who).
- **Edge — unseen count > screen:** dot + "NEW" chips persist; stamp updates on scroll-past.
  **Edge — long note:** 1-line clamp here, full text on detail. **Edge — unverified duplicate phone
  (DA-12):** row shows "⚠ number unverified — confirm on the call". **Keyboard:** search/tab bar
  hides; **rotation:** day headers stay.

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
