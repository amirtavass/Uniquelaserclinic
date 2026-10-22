# ADR-002 — Database & backend: Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions)

- Status: PROPOSED — awaiting owner sign-off (Gate 1)
- Date: 2026-10-22
- Sources: M01 (roles, email+phone sign-up), W03 (request→confirm workflow), R01/R04/R05/R07/R08
  rules, V2 §7–§9.

## Context

The domain is **relational and stateful**: clients → booking requests → confirmed appointments
(consultation/patch-test/session chain) → reminders → enquiry threads; plus public content
(treatments, FAQs, updates) with append-only edit history; plus an audit trail of who changed
what. Two security models must coexist (kickoff trap list): public-read content vs owner-only
personal data. The client wants email + phone sign-up and exactly 3 privileged accounts.

## Decision

**Supabase** as backend:

- **PostgreSQL** as the database.
- **Supabase Auth** — email/password with verification, plus phone OTP (matches M01 "email and
  number"), and custom claims for `owner` / `staff` / `client` roles via a `user_roles` table
  (authoritative) — never client-side role guessing.
- **Row-Level Security** — the enforcement layer for R07: clients select only their own
  bookings/enquiries; staff select all; content tables public-read; per-operation policies,
  idempotent (`drop policy if exists`), verified with two real users (`verify:rls`).
- **Storage** — future consent forms / aftercare documents / (phase 2, consented) progress images,
  bucket policies separate from table RLS.
- **Edge Functions** — server-side scheduled reminder dispatch to Expo Push (reminders must be
  sent by the server, never by a sleeping phone), and webhook-style notifications without
  exposing service-role keys to the app.
- Schema discipline from the kickoff Stage 4: money as integer pence (R05), status enums explicit,
  snapshot pricing onto requests, append-only history tables, single-tenant shape
  (`clinic_id` on every record from birth — multi-tenant structure, single-tenant runtime).

## Why not the alternatives

| Option | Why not |
|---|---|
| **Firebase (Firestore)** | Booking/slot/enquiry data is relational: joins, constraints, state machines, history tables fight a document store. Security rules for "client owns own rows; 3 staff see all; public content" become brittle compared to SQL RLS. Phone-OTP auth is fine, but the data model cost dominates. Vendor lock-in is harder to exit than Postgres. |
| **Custom Node/Express + plain Postgres** | Full control, but re-builds auth, OTP, RLS integration, storage, admin APIs by hand for a 1-clinic MVP — the kickoff warns against overengineering. Chosen only if Supabase features are later proven insufficient. |
| **Off-the-shelf booking SaaS (Fresha/Squarespace scheduling etc.)** | Unknown if the clinic uses one (Q04). If they do, integrating the app to that system may replace `booking_requests` entirely — this is the single biggest architecture fork and is why Q04 is priority 1. Until answered, the schema models bookings ourselves with an import/integration seam. |
| **Airtable/Sheets as backend** | No real RLS, no OTP, no audit discipline. Unsuitable for personal + UK-GDPR data. |

## Consequences

- Postgres-specific schema SQL (`supabase/schema.sql`, `supabase/rls.sql`) as deliverables — same
  file-based migration discipline as the kickoff tree; the project can self-host the identical
  Postgres later (lock-in limited).
- Push path needs a server component (Edge Function + Expo Push) — scheduled in M1, not feature
  time.
- Free/pro tier suffices for one clinic; cost curve flat.
- Health-adjacent data stays minimal (R04); Supabase EU region project to be selected (UK GDPR
  transfer position documented in a follow-up ADR once client confirms they want in-app health
  screening).
