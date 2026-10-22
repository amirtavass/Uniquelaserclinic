# 08 — Scope & Demo Slice (Phase 1 contract, DRAFT)

## In scope — Phase 1 (M1 + demo slice)

Build the **one primary journey: a client discovers a treatment, signs up, requests a booking,
and a staff member confirms it, with a reminder landing in the app.**

Stories: S01–S09, S12, S14 (+ S16 owner seat management only if Q01 confirms 2 staff seats).
Roles in demo: **Client + Staff** (max two roles on stage, per kickoff Gate 3 rule).
Screens (6–8): Home · Treatments (search/filter) · Treatment detail · Book (request flow) ·
My appointments (status + reminder visible) · Enquiries (ask + see answer) · Staff queue (requests
→ confirm/decline) · Sign-up/sign-in.

All data real: treatments seeded from verified website content (counts from the seed file, never
from this document).

## Deliberately OUT of the demo

- Payments, deposits, course-package purchase (no source — Q10).
- Health screening in-app (D05 / R04 / Q03).
- Real-time slot calendar (D03 / Q04).
- Cancellation/reschedule request flow (S10/S15 — phase 2 unless owner insists).
- Before/after photos, progress tracking.
- Areas-we-serve content, multi-clinic shape beyond `clinic_id` column.

## Phase 2 roadmap (dependency-ordered)

| Item | Depends on |
|---|---|
| S10/S15 cancel & reschedule | Q05 (cancellation policy) |
| Profile privacy centre, deletion workflow | Q03 (data position), policy text |
| Real-time availability (if desired) | Q04 — diary/system the clinic actually uses |
| Aftercare content per treatment | Client-supplied approved copy |
| Progress photos | Consent design + storage ADR (sensitive) |
| Reviews/testimonials collection | Owner decision (not invented) |

## Success measures

- **Demo:** one full journey on both phones, real data, no placeholder screens (kickoff brief
  default — confirm as Q11).
- **Post-launch (clinic's words, M01):** appointments requested and confirmed without a phone
  call being the only path; reminders reduce no-shows (owner to confirm a target — no number is
  invented here).
