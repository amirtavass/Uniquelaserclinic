# docs/schema — Database Schema Proposal (v1 draft)

Status: **PROPOSED — nothing here is signed off.** All tables inherit the repo's evidence rules:
website (`docs/product/00-source-inventory.md` W01–W08) > this repo > M01 staff message. Money is
integer pence (R05). UK spelling (R09). Single-tenant runtime with multi-tenant shape (`clinic_id`
on every business row, ADR-002).

## Files

| File | Covers |
|---|---|
| [01-architecture-strategy.md](01-architecture-strategy.md) | Why the model is shaped this way; context mapping; design decisions; mobile optimisation |
| [02-core-tables.md](02-core-tables.md) | Every table: purpose, key fields, relationships, delete rules |
| [03-security-and-privacy.md](03-security-and-privacy.md) | Data tiers, RLS matrix, encryption, audit, GDPR deletion |
| [04-edge-cases-and-open-questions.md](04-edge-cases-and-open-questions.md) | Contradictions found in sources; 5 critical edge cases; proposed Batch 2 questions |

## Naming continuity

Table names here are the exact names already used by `docs/schema-coaching/01-user-stories.md`
(`treatments`, `booking_requests`, `client_profiles`, `consent_records`, `reminders`, …) so the
stories, this proposal, and the future `supabase/schema.sql` + `supabase/rls.sql` deliverables
never diverge. `checkConnection()` in `lib/supabase.ts` targets `treatments` — applying this schema
resolves its current `PGRST205` state ("demo schema not applied yet").

## Entity map (overview)

```mermaid
erDiagram
    clinics ||--o{ treatments : has
    clinics ||--o{ opening_hours : has
    treatment_categories ||--o{ treatments : contains
    treatments }o--o{ treatment_concerns : "linked via treatment_concern_links"
    treatments ||--o{ treatment_price_history : snapshots
    treatments ||--o{ course_packages : "sold as"
    auth.users ||--|| client_profiles : "1:1"
    auth.users ||--o{ user_roles : "owner|staff|client"
    auth.users ||--o{ notification_tokens : devices
    auth.users ||--o{ consent_records : versioned
    client_profiles ||--o{ booking_requests : makes
    booking_requests ||--o{ booking_request_events : audit
    booking_requests ||--o{ appointments : "confirmed into"
    appointments ||--o{ appointment_events : audit
    appointments ||--o{ reminders : schedules
    client_courses }o--|| course_packages : "instance of"
    appointments }o--o| client_courses : "draws session from"
    client_profiles ||--o{ enquiries : asks
    enquiries ||--o{ enquiry_messages : thread
    clinics ||--o{ updates : publishes
    updates ||--o{ update_reads : per-client
    updates ||--o{ update_revisions : history
```

Dormant clinical partition (`clinical` schema: Fitzpatrick assessments, medical screening,
signed consents, progress media) is designed in 02 §E and firewalled in 03, but **gated on Q03** —
not applied in v1.

## Gate discipline

Per `AGENTS.md`, no product schema is applied before the gate process allows it. This folder is
Phase-1 documentation. The append-only registers (`05-decision-log.md`,
`07-questions-for-client.md`) are **not edited by this proposal**; Batch 2 questions proposed in
04 get appended there only once accepted.
