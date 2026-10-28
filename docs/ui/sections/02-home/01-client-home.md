# 02-home / 01 — Client Home / `client_dashboard()` (C1 · S06 S07 S08 · R03 R06)

**Job:** "catch me up — what happened while I was away?" in one glance.
**Data contract (strictly what the RPC returns — no invented fields):**
`myDashboard()` (EXISTS) → `upcoming_appointments[] {id,type,status,scheduled_start}` (≤ 5),
`pending_requests` (count), `unread_updates` (count), `open_enquiries` (count).
Optional parallel second call: `getPublishedUpdates()` for the newest one-line preview. Treatment
**names are not in the payload** — rows link to `appointments/[id]`; the home card labels by
`type` ("Consultation", "Patch test", "Session") + date, which is also the R06-safe posture.

## Three layout variations (Gate 6 choice)

### L1 — Dashboard stack (RECOMMENDED, locked default)
Vertical priority stack: next appointment → chain → counts → update preview → enquiry shortcut.

```text
┌──────────────────────────────┐
│ ● Today, 4 Nov      [🔔] [⌕] │  header: greeting date + bell
│ ──────────────────────────── │
│ ╔ YOUR NEXT VISIT ═════════╗ │  hero Card (night tint) —
│ ║ Consultation             ║ │  type label (RPC), NOT a
│ ║ Thu 6 Nov · 2:30 pm      ║ │  treatment name (R06-safe)
│ ║ Confirmed          [>]   ║ │  Badge P7; whole card → [id]
│ ╚══════════════════════════╝ │
│ ① Consult ✓ → ② Patch → ③ Sess│ C5 ChainStepper (R03):
│   Patch test due before your  │  copy bank line under when
│   first full session          │  PATCH_TEST row exists
│ ──────────────────────────── │
│ ▸ 1 request awaiting confirmation  → request/acknowledgement
│ ▸ 2 unread updates                 → updates/
│ ▸ 1 open conversation              → enquiries/
│ ──────────────────────────── │
│ 📰 New update (unread)           │  getPublishedUpdates[0]:
│ "Opening hours note…"    [Read]  │  title only; tap = row →
│ ──────────────────────────── │  markUpdateRead
│ [ ✦ Request an appointment ]     │ primary CTA, bottom slot
├──────────────────────────────┤
│ 🏠 Home 💆 Treat ✦ Request 👤 Profile │
└──────────────────────────────┘
```

- **UX rationale:** stack order = question order in bucket C1 (what's next → where am I in the
  chain → what happened → jump to talking). Mirrors the RPC shape 1:1, so first paint = first
  round trip. **Pros:** one fetch renders 90 % of chrome; no layout surprise when counts are 0
  (rows collapse); deep links obvious. **Cons:** less "magazine-y"; second fetch needed for the
  preview strip. **Answers Part 1:** C1 fully; R03 on the surface; R06 structurally (no names).

### L2 — Status rail + rails
Horizontal cards; swipe between "Next visit / Requests / Updates".

```text
┌──────────────────────────────┐
│ ● Today            [🔔]      │
│ ╔════════╗╔═══════╗╔════    ╝│  3 horizontal snap cards:
│ ║Consult ║║1 req  ║║2 upda…  ║│  (next visit · pending ·
│ ║Thu 6 · ║║await… ║║unread    ║│   unread) — counts as cards
│ ║2:30 pm ║║[view] ║║[read]    ║│
│ ╚════════╝╚═══════╝╚═══════  ╝
│ ①✓ — ② — ③   your journey so far │ ChainStepper full width
│ ┌──────────────────────────┐ │
│ │ 📰 latest update          │ │
│ └──────────────────────────┘ │
│ [ ✦ Request an appointment ] │
└──────────────────────────────┘
```

- **Rationale:** thumb horizontal = "flick through my week". **Pros:** funnels all four payload
  keys into equal tiles; great on tablets. **Cons:** swipeable content hides the pending count
  behind a gesture (staff-critical callback promise R02 wants *visible*); older users miss rails;
  more layout states to prove. **Answers Part 1:** C1 yes; weaker C3 chain glance.

### L3 — Ledger list
Everything as one status list (clinic-reminder aesthetic), compact.

```text
┌──────────────────────────────┐
│ ● Your clinic ledger  [🔔]   │
│ ──────────────────────────── │
│ ✓ Consultation   Thu 6 · 2:30pm │  rows w/ status icons;
│ • Patch test     to be booked   │  newest first
│ • Update         2 unread       │
│ • Request        awaiting 1     │
│ • Conversation   open           │
│ ──────────────────────────── │
│ [ ✦ Request an appointment ] │
└──────────────────────────────┘
```

- **Rationale:** maximum density, zero chrome — reads like a reception book (fits a clinic brand).
  **Pros:** one component; trivially empty-state friendly. **Cons:** no hero moment for the next
  visit (the thing the client came to see); hierarchy flattened — counts lose colour cues; feels
  clerical for a "confidence, care, results" brand. **Answers Part 1:** C1 counts only.

**Decision: L1** (data-map fidelity, glance order, R06-safe). L3 remains the fallback if Gate 6
review wants density; L2 rejected for hiding pending-callback status.

## States (draw once — applies to whichever layout lands)

**Signed-out:** slot renders `00-guest-home` (tab swap) — this file's routes show the gate card
(cross-cutting §2) when session dies mid-visit.

**Null / empty (new client, 0 everything):** hero replaced by welcome card:
"Welcome, Priya — nothing booked yet." + `✦ Request an appointment` + "Ask us for advice" quiet
link (S09). Count rows hidden (never show "0 unread updates").

```text
│ ┌──────────────────────────┐ │
│ │ ✨ You're all set up     │ │
│ │ Nothing booked yet — the │ │
│ │ clinic confirms requests │ │
│ │ within one working day.  │ │  R02 copy bank
│ │ [ ✦ Request an appt ]    │ │
│ │ Not sure? Ask us for     │ │
│ │ advice >                 │ │
│ └──────────────────────────┘ │
```

**Loading:** `DashboardSkeleton` (hero card + 2 rows) ≤ 250 ms → content; never skeleton-flash
the static header (cross-cutting §1).

**Offline:** personal data, so NO stale render — cross-cutting §5 error card with retry +
`Call 07301 166333` (an appointment list you can't confirm is unsafe to freeze).

**Error:** RPC failure (rare — invoker-scoped, grants anon too): same §5 card; Bell/updates
second fetch failing alone only drops the preview strip (graceful degradation noted).

**Edge — 5 upcoming (cap):** hero shows #1; "+4 more" row → `appointments/` (RPC limits 5; full
list via `myAppointments`). **Edge — DA-05/06:** never rendered client-side (staff-side banners,
`09/01`) — client sees plain chain status. **Edge — unread badge = 0:** bell shows nothing, not
"0" (badge rule P7). **Edge — long update title:** 2-line clamp + Read opens full.
**Edge — keyboard:** n/a (no form); **Edge — deep link tap on push** (R06 generic): routes by
`notifications.route` → appointment detail (S07 AC).
