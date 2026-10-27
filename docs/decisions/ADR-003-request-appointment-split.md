# ADR-003 — Request/Appointment split with soft-warning audit triggers

- Status: ACCEPTED (provisional demo sign-off, governed by DA-02/05/06/07 — owner confirmation pending Q01/Q04/Q05)
- Date: 2026-10-26
- Sources: W03 (1-working-day callback), W02/FAQ (consultation + patch test chain), R02/R03, D03/D04,
  docs/schema/02 C1–C4, `docs/schema/05-verification-plan.md` (P-03…P-10).

## Context
The verified booking workflow is request → human confirm; the diary reality is unknown (Q04). The
R03 chain (consultation → patch test 24–48 h → session) carries clinic judgement we may not
codify without owner rules (Q05, Q13). Earlier designs risked either fake availability or app-code
rules invisible to verification.

## Decision
Two state machines, one seam between them. `booking_requests` holds the client's wish (`PENDING →
CONFIRMED/DECLINED/RESCHEDULED/CANCELLED`, server-computed price/name snapshots, idempotency key);
staff confirmation creates `appointments` rows typed `CONSULTATION | PATCH_TEST | SESSION`. Every
transition auto-logs to append-only `*_events`. Clinic safety rules are **soft**: triggers
`warn_session_without_patch_test` and `warn_session_gap` insert structured `audit_log` rows
(`patch_test_warning`, `session_gap_warning`) and RAISE WARNING — staff can proceed, the evidence
always exists.

## Why not the alternatives
| Option | Why not |
|---|---|
| One `bookings` table | Conflates wish with commitment; destroys the before/after history S12 demands; forces a nullable mess of preferred-vs-actual. |
| Live `slots`/availability | The site does not offer it (W03); R02 forbids faking it until Q04. |
| Hard-blocking safety triggers | No owner rules on intervals/outcomes (Q05/Q13/Q14); blocking on guessed rules would reject valid bookings and present our inference as clinic policy. |
| App-side (JS) warnings only | Invisible to `verify:rls`, bypassable by any REST client, and unauditable. Postgres WARNINGs do not cross REST — hence the audit-row design (docs/schema/04 Fixed-this-session). |

## Consequences
- Engine A2 P-04/P-05/P-06 can assert warnings *through HTTPS* — safety logic is verifiable without
  direct DB access.
- Escalation to hard enforcement, when the owner rules (Q05/Q13), is a trigger-function swap, not a
  schema migration.
- Every confirm creates ≥1 appointment; the staff queue and client status screens read different
  tables by role (docs/schema/03 matrix).
