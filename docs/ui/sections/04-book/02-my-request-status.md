# 04-book / 02 — My Request Status (C3 bridge · S05/S06 · R02)

Where is my request? One row per request, newest-first. `booking_status` enum renders through
P7 badge words only — PENDING "Awaiting confirmation" · CONFIRMED "Confirmed — see appointments" ·
DECLINED "Not available" (+ staff `decision_reason` shown **verbatim in quotes**) · RESCHEDULED
"Alternative proposed — staff will call you" · CANCELLED "Cancelled". No countdown timers, no
SLA maths invented (R02 honesty: the 1-working-day sentence is quoted, never turned into a clock).

```text
┌──────────────────────────────┐
│ ←  My requests               │
│ ┌──────────────────────────┐ │
│ │ Laser Hair Removal       │ │
│ │ Sat 22 Nov · Afternoon   │ │
│ │ ● Awaiting confirmation  │ │  sent date, never a timer
│ │   Sent Tue 4 Nov         │ │
│ ├──────────────────────────┤ │
│ │ Advise me (no treatment) │ │
│ │ Mon 10 Nov · Morning     │ │
│ │ ○ Not available          │ │  DECLINED + verbatim
│ │   “…reason from clinic”  │ │  decision_reason in quotes
│ │   Ask us for advice >    │ │  (S09 bridge — never dead)
│ ├──────────────────────────┤ │
│ │ Thread Vein Removal      │ │
│ │ ✓ Confirmed — see        │ │  CONFIRMED → appointments row
│ │   appointments (R03: a   │ │  lives over there; this row
│ │   patch test comes first)│ │  links, doesn’t duplicate
│ └──────────────────────────┘ │
│ [ ✦ New request ]            │
└──────────────────────────────┘
```

**Seam:** `staffQueue` is admin-side; client rows come from **`myRequests()` ADD(M1)**
(`booking_requests` own rows, newest-first — mirrors RLS select).

**States** — **Signed-out:** gate card (cross-cutting §2). **Empty:** "No requests yet — most
people start with a free consultation. [ ✦ Request ]" (S05 + W02 copy bank; not a dead list).
**Loading:** `ListSkeleton(2)`. **Offline:** §5 no-stale rule (this status is actionable — a
wrong "awaiting" could stop someone calling). **Long decline reason:** wraps fully in-row.
**Edge — RESCHEDULED:** no client "accept" button exists (the callback is the human path, R02 —
we do not invent self-service confirm); row says staff will call. **Edge — many rows:** scroll +
sent-month headers; never pagination that hides a PENDING item.
