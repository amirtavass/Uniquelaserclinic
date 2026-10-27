# 05 — Verification Plan (three engines) — contract for `npm run verify` / `npm run verify:rls`

Executables: `services/verify-schema.ts` (engines A, A2, RLS isolation — PostgREST/Auth admin API
over HTTPS only, no direct DB connection needed; solves the IPv6 `SUPABASE_DB_URL` problem) and
`supabase/introspection.sql` (engine B — `get_schema_introspection()` RPC inspected *through*
REST). Every PASS/FAIL in `docs/schema-coaching/03-schema-status.md` cites a check ID from this
file. Run order: A → A2 → RLS → B; `--rls-only` runs the RLS section alone.

Prerequisites (schema.sql/rls.sql must ship): all triggers/RPCs named here
(`assert_staff_seat_cap`, `warn_session_without_patch_test`, `warn_session_gap`,
`assert_r06_generic_copy`, price-history & update-revision auto-triggers, enquiry `OPEN → ANSWERED`
trigger, `app.search_clients`, `request_appointment_change`, `app.purge_verification_data(run_id)`),
guard triggers honouring `app.allow_append_only_delete`, and seed from verified site content
(counts asserted below, never hardcoded from prose).

## Engine A — Catalogue & seed contract probes (anon + service key)

| ID | Check (PASS criteria) | Maps to |
|---|---|---|
| A-01 | `treatments` where `is_featured` ⇒ count **8**, every `price_from_pence` integer in 3500–12000, `pricing_model = FROM_PRICE` | S03, S04, R05 |
| A-02 | `treatments` where `has_detail_page` ⇒ count **22** | S03, Q09 |
| A-03 | `treatments` where `show_in_directory` ⇒ count **31** | S03, Q09 |
| A-04 | `treatments` where `show_in_booking_dropdown` ⇒ count **24 — advisory**: mismatch = WARN (form is JS-rendered; manual confirm pending, DA-14) | S05 |
| A-05 | `treatment_categories` = 5; `treatment_concerns` = 5; every published treatment has ≥1 category and (directory items) ≥1 concern link | S03, R09 copy |
| A-06 | `opening_hours`: 7 rows `is_open`, weekday 0–6, `opens = 10:00`, `closes = 18:00` (verified truth W01) | S17, W01 |
| A-07 | `treatments` with NULL `price_from_pence` all have `pricing_model = PRICE_ON_CONSULTATION` (CHECK holds — probe by attempting violation, expect rejection) | S04, R05 |
| A-08 | `course_packages` seeded rows show `sessions_count = 6` and `discount_percent = 20` where present | S04, Q10 shape |
| A-09 | R06 tripwire: INSERT `notifications.body = 'Your <name-of-a-real-treatment> session is confirmed'` (tagged user_id, service key) ⇒ **must** fail with SQLSTATE `P0001` (`assert_r06_generic_copy`); control body 'An update from Unique Laser Clinics — open the app to view.' passes the trigger (then FK-rejected `23503` without a real user, proving trigger-before-constraint order) | S07, R06 |
| A-10 | Enum casing contract: every status/type enum value round-trips UPPERCASE (e.g. `PATCH_TEST`, `CANCEL_REQUESTED`); `app_role` stays lowercase (01 §2e) | S05, S06, stories alignment |

## Engine A2 — Persona & lifecycle checks (five personas: Owner, Staff 1, Staff 2, Client A, Client B)

Personas created via Auth Admin API (`verify+<run_id>-<persona>@example.invalid`, pre-confirmed),
tagged, purged at the end (`app.purge_verification_data`). Each persona acts through **its own
access token** — the service key only for admin bookends.

| ID | Scenario (exact steps) | PASS criteria | Maps to |
|---|---|---|---|
| P-01 | Sign-up: Client A signs in, inserts own `client_profiles` row (name/phone), inserts `consent_records(DATA_PROCESSING, GRANTED)` | row readable by A only; consent append-only (P-20 applies) | S01, S02, R08 |
| P-02 | Duplicate verified phone: Client B registers with A's `phone_e164` while both verified ⇒ unique-index rejection; with A's number *unverified* ⇒ allowed | partial unique behaves (DA-12) | S01, Q17 |
| P-03 | A submits `booking_requests(kind=TREATMENT, treatment=<hair removal>, idempotency_key)` — **no snapshot fields sent** | returned row shows `status=PENDING`, `price_from_pence_snapshot=3500`, `treatment_name_snapshot` populated server-side; replay with same key ⇒ no duplicate | S05, R02, R05 |
| P-04 | Staff 1 PATCHes the request → `CONFIRMED`, then INSERTs `appointments` chain `CONSULTATION + PATCH_TEST + SESSION` | events row `CONFIRMED` with actor; chain rows exist | S12, R03 |
| P-05 | Insert `SESSION` before any completed `PATCH_TEST` | INSERT **succeeds** (soft, DA-06) and `audit_log(action='patch_test_warning')` row exists | S06, R03 |
| P-06 | Mark PATCH_TEST `COMPLETED`; insert next-session date < `+42 days` for tattoo treatment | succeeds + `audit_log(session_gap_warning)` | S12, Q13/DA-05 |
| P-07 | Reminders: on confirm, `(appointment, PUSH, scheduled_for)` rows; reschedule ⇒ old row `CANCELLED`, new row scheduled; duplicate `(appointment_id, channel, scheduled_for)` rejected | unique + idempotency proven | S07, D07 |
| P-08 | Updates: Staff 1 creates `DRAFT` ⇒ invisible to A (RLS) and anon; PATCH `PUBLISHED` ⇒ visible; A upserts `update_reads`; Staff 1 edits body ⇒ `update_revisions` row auto-created; unpublish ⇒ invisible again, revision kept | full S08/S14 loop | S08, S14 |
| P-09 | Enquiry: A creates `enquiries` (`OPEN`) + first message; Staff 2 replies in `enquiry_messages` ⇒ status auto-flips `ANSWERED`; A's reply ⇒ `OPEN`; Staff closes ⇒ `CLOSED` | trigger-maintained status machine | S09, S13 |
| P-10 | Cancel/reschedule request via `request_appointment_change` RPC as A | appointment → `CANCEL_REQUESTED`/`RESCHEDULE_REQUESTED`; `appointment_events` rows with actor A; staff resolves → `CANCELLED`/`RESCHEDULED` | S10, S15 |
| P-11 | Seats: Owner grants Staff 1 + Staff 2 (`user_roles`); grant 3rd staff ⇒ `assert_staff_seat_cap` raises `P0001`; Staff 1 attempting to grant ⇒ RLS rejection | cap + owner-only grants | S16, R01 |
| P-12 | Price edit: Staff 1 PATCHes a treatment price ⇒ `treatment_price_history` row appended automatically; restore price ⇒ second row | auto-trigger, append-only | S17, R05 |
| P-13 | Directory: Staff 1 calls `app.search_clients('Verify')` ⇒ rows + fresh `audit_log(directory_view)` row | audited read path | S18 |
| P-14 | GDPR pipeline: A files `deletion_requests`; Owner moves `IN_REVIEW`; run deletion steps (service, mirroring 03 §6): profile name → 'Deleted client', phone NULL, `pseudonymised_at` set, `notes_client`/`enquiry_messages.body` redacted, tokens gone, `consent_records` still present, appointments shell intact with `retained_for` | appointment/request rows still counted before & after; readable PII gone | S11, R08 |
| P-15 | Hours edit: Owner inserts new `opening_hours` row `valid_from tomorrow` ⇒ current-valid view still returns 10:00–18:00 today | versioned fact intact | S17, W01 |

## Engine R — Two-user RLS isolation (`npm run verify:rls`, R07)

| ID | Proof | PASS criteria |
|---|---|---|
| R-01 | Client A selects `client_profiles`, `booking_requests`, `appointments`, `enquiries`, `consent_records`, `notifications` | **0 rows** whose owner is Client B (verified by service-key cross-check that B's rows exist) |
| R-02 | A requests B's rows **by primary-key id** | still 0 (no id-guessing leak) |
| R-03 | anon reads `treatments`, `faq_items`, `opening_hours`, `updates` | content >0; `DRAFT` updates 0; every personal table returns 0 or 401/403 |
| R-04 | A PATCHes own `booking_requests.status`; A POSTs/DELETEs `user_roles` | status update ⇒ rejected (column privilege); role write ⇒ RLS violation |
| R-05 | Tamper battery on append-only tables (`booking_request_events`, `appointment_events`, `treatment_price_history`, `update_revisions`, `enquiry_messages`, `consent_records`, `audit_log`): try UPDATE **and** DELETE as A, Staff 1, and **service key** | every attempt rejected (`42501` or guard-trigger `P0001`); service succeeds only when `app.allow_append_only_delete = on` inside `app.purge_verification_data` |
| R-06 | Staff sees all queue/appointment rows; owner-only tables (`user_roles` writes, `deletion_requests` status) rejected for staff | per 03 §3 matrix |

## Engine B — Schema introspection RPC (`get_schema_introspection()`, service-role only)

`supabase/introspection.sql` defines the `STABLE SECURITY DEFINER` function returning jsonb; the TS
harness calls it via `POST /rpc/get_schema_introspection` (no direct database connection). PASS
criteria on the returned object:

| Key | Must equal | Maps to |
|---|---|---|
| `rls_missing` | `[]` — `pg_tables.rowsecurity` true for 100% of `public` tables (plus `rls_forced` noted) | R07 |
| `public_health_columns` | `[]` — zero columns in `public` matching the health-word list (fitzpatrick, medical, medication, pregnancy, contraindicat, screening, diagnosis…) | R04, D05 |
| `clinical_grants` | `{}` — no USAGE/SELECT/INSERT grants to `anon`/`authenticated` on schema `clinical` (or schema absent — both PASS, reported distinctly) | R04 |
| `money_violations` | `[]` — every `*_pence` column is `integer`; and no float/numeric column is named price/amount/cost | R05 |
| `mutable_timestamp_gaps` | `[]` — every non-append-only `public` table has `created_at` + `updated_at` `timestamptz` | hygiene |
| `append_only_gaps` | `[]` — each declared append-only table has `created_at`/`recorded_at` AND no UPDATE/DELETE grant to anon/authenticated/service (guard trigger present) | AGENTS.md "registers append-only" |
| `enum_label_violations` | `[]` — enum labels match the 01 §2(e) casing contract | Part-2 alignment |
| `required_triggers_missing` | `[]` against the named list (seat cap, patch-test warn, gap warn, R06 copy, price history, revisions, enquiry flip, purge GUC-aware guards) | A2 prereqs |

## Verdicts & register flow

- Each check prints `PASS | FAIL | WARN | BLOCKED` with its ID; **BLOCKED** = prerequisite missing
  (schema not applied, RPC missing, Edge pipeline absent) — never silently skipped.
- Exit code: 0 only if no FAIL and no BLOCKED in the engines selected; WARNs (e.g. A-04) listed but
  do not fail.
- `03-schema-status.md`: append a row (never edit history) whenever a check outcome is recorded for
  a story/rule; the Evidence column carries the check IDs (`A-01, P-03, R-01…`).

## Story → schema coverage matrix (Part-2.3 audit, complete)

| Story | Tables / triggers / RPCs that make it real |
|---|---|
| S01 | `client_profiles` (+ unique index DA-12), `consent_records`, Auth email+OTP |
| S02 | Auth (Supabase), secure-storage fix flagged 04 §1.6 |
| S03 | `treatments` flags, `treatment_categories`, `treatment_concerns(_links)` — anon SELECT |
| S04 | treatment fields incl. `requires_patch_test`, `disclaimer`, NULL-price ⇒ consultation label |
| S05 | `booking_requests` (+ server-computed snapshot, idempotency), `booking_request_events` |
| S06 | `appointments` (`CONSULTATION/PATCH_TEST/SESSION`), scoped SELECT |
| S07 | `reminders` (+ unique), `notification_tokens`, `notifications` + `assert_r06_generic_copy`, Edge dispatch |
| S08 | `updates` (PUBLISHED-only anon), `update_reads` |
| S09 | `enquiries`, `enquiry_messages` (append-only, flip trigger) |
| S10 | `CANCEL_REQUESTED`/`RESCHEDULE_REQUESTED`, `appointment_events`, `request_appointment_change` |
| S11 | `deletion_requests`, `consent_records` (withdrawal rows), pseudonymise pipeline 03 §6 |
| S12 | staff column-privilege UPDATE, chain-create on confirm, events with actor |
| S13 | staff INSERT `enquiry_messages` |
| S14 | `updates` DRAFT/PUBLISHED + `update_revisions` auto-trigger |
| S15 | staff resolve of P-10 transitions |
| S16 | `user_roles` (owner-only grants), `assert_staff_seat_cap` |
| S17 | `treatment_price_history` auto-trigger, `opening_hours`/`overrides`, `clinic_settings` |
| S18 | `app.search_clients` + `audit_log(directory_view)` |
| R01–R10 | `user_roles`+seat cap; state machine no-slots; appointment chain+warn triggers; zero health columns (B); `*_pence` CHECKs+history (B); R06 tripwire (A-09); RLS+Engine R; `consent_records` versioned; copy discipline (content); `clinic_id` tenant shape everywhere (01 §f) |
