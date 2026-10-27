# 02 — Query Pack (per story & rule: the real query, expected result, failure meaning)

Executed by `services/verify-schema.ts` via PostgREST (HTTPS only) + `supabase/introspection.sql`
(Engine B). Check IDs are shared with `docs/schema/05-verification-plan.md` and
`docs/schema-coaching/03-schema-status.md`. "Client token" = authenticated persona token;
"service" = service-role key. All REST paths are relative to `/rest/v1/`.

## Stories

| Story | Query / call (exact) | Expected | Failure means | Checks |
|---|---|---|---|---|
| S01 | `POST client_profiles` as Client A `{clinic_id, user_id, first_name, last_name, phone_e164}`; `POST consent_records` as Client A `{kind:'DATA_PROCESSING', decision:'GRANTED', policy_version, policy_text_hash, source:'APP'}` | 200/201, row owner = A. Duplicate **verified** phone for B: `PATCH client_profiles?user_id=eq.B` `{phone_e164: A's, phone_verified_at: now}` ⇒ `23505` | Insert rejected = RLS own-row policy missing; duplicate accepted = partial unique index missing | P-01, P-02 |
| S02 | `POST {auth}/token?grant_type=password` per persona | 200 + access_token | 400 = email-confirm/SMTP settings, not schema | P-persona setup |
| S03 | anon `GET treatments?select=…&published=eq.true&show_in_directory=eq.true&head=true&count=exact`; `GET treatment_categories?published=eq.true&…`; `GET treatment_concerns&head…` | 8 featured / 22 detail / 31 directory / **24 dropdown advisory** / 5 / 5 — counts from `services/seed-contract.json` | Wrong count = seed/flag drift; anon rejected = T0 SELECT policy missing | A-01…A-05, A-10, R-03 |
| S04 | `GET treatments?slug=eq.laser-tattoo-removal` | `price_from_pence=6000`, `typical_sessions_min=6 max=10`, `min_gap_days=42`, `disclaimer` present | NULL where site publishes = seed gap; a value where site says nothing = invention | A-01, A-07, A-08 |
| S05 | as A: `POST booking_requests` `{request_kind:'TREATMENT'\|'ADVISE_ME', treatment_id?, preferred_date, preferred_time_band:'MORNING', idempotency_key}` | `status='PENDING'` (forced), `treatment_name_snapshot` & `price_from_pence_snapshot=3500` server-computed; replay same key ⇒ `23505`, no duplicate | Missing snapshot = `compute_request_snapshot` trigger absent; duplicate accepted = idempotency index missing | P-03, A-10 |
| S06 | as A: `GET appointments?select=…&client_user_id=eq.A&order=scheduled_start.asc` | only A's rows; statuses in UPPERCASE enum | 401/empty for own rows = policy missing; cross-owner rows visible ⇒ R-01 | P-04, R-01 |
| S07 | as staff: `POST reminders {appointment_id, user_id, channel:'PUSH', scheduled_for, status:'SCHEDULED'}`; duplicate triple ⇒ `23505`. Service: `POST notifications` body containing a treatment name ⇒ `P0001 "R06 violation"` | reminder rows idempotent; poisoned notification physically impossible | Silent duplicate = unique missing; treatment name in preview accepted = `assert_r06_generic_copy` missing | P-07, A-09 |
| S08 | as A: `GET updates?status=eq.PUBLISHED`; as anon same; `POST update_reads {update_id, user_id, read_at}` | DRAFT count 0 for A/anon; read upsert 201 | Draft visible = predicate missing in SELECT policy | P-08, R-03 |
| S09 | as A: `POST enquiries` + `POST enquiry_messages {author_role:'CLIENT'}` | status `OPEN`, thread readable by A only | INSERT rejected = own-row policy; B sees thread = R-01 | P-09, R-01 |
| S10 | as A: `POST rpc/request_appointment_change {p_appointment_id, p_kind:'CANCEL_REQUESTED'}` | appointment `CANCEL_REQUESTED` + event row; wrong owner ⇒ `42501` | RPC missing = prereq not applied; no event = status-transition trigger missing | P-10 |
| S11 | as A: `POST deletion_requests`; as Owner: `POST rpc/apply_deletion {p_request_id}` | profile pseudonymised (`first_name='Deleted client'`, phone NULL, `pseudonymised_at` set), `notes_client`/`enquiry_messages.body` redacted, tokens/reminders gone, **appointments shells + consent rows intact**, status `COMPLETED` | Any user-visible PII surviving = pipeline step missing; vanished appointment row = wrong delete (breaks books) | P-14 |
| S12 | as staff: `PATCH booking_requests?id=eq.<r> {status:'CONFIRMED', decided_by}` then `POST appointments` ×3 (`CONSULTATION`, `PATCH_TEST`, `SESSION`) | 200 + `CONFIRMED` event auto-logged; client A sees `CONFIRMED` | Staff PATCH rejected = column-privilege grant missing | P-04, R-06 |
| S13 | as staff2: `POST enquiry_messages {author_role:'STAFF', …}` | enquiry auto `ANSWERED` (trigger) | Stays OPEN = `flip_enquiry_answered` missing | P-09 |
| S14 | as staff: `POST updates {status:'DRAFT'}` → `PATCH status:'PUBLISHED'` → `PATCH body` | DRAFT hidden; publish reveals; edit ⇒ ≥1 `update_revisions` row | No revision = `append_update_revision` missing (S14 "history preserved" broken) | P-08 |
| S15 | as staff: `PATCH appointments?id=eq.<a> {status:'CANCELLED'}` after client request | status flips + `CANCELLED` event | Same causes as S12 | P-10 extension |
| S16 | as Owner: `POST user_roles` ×2 ⇒ ok; 3rd active `staff` ⇒ `P0001 "staff_seat_max"`; as staff: `POST user_roles` ⇒ `42501` | seat cap enforced in DB | 3rd accepted = trigger missing; staff grant accepted = owner-only policy missing | P-11, R-04, R-06 |
| S17 | as staff: `PATCH treatments?price…` ⇒ `GET treatment_price_history?treatment_id=eq.t&new_price_pence=eq.<np>` ≥1; `POST opening_hours` tomorrow row ⇒ current-valid still 10:00 | auto history + versioned hours | Empty history = trigger missing; overwrite-style hours = design breach | P-12, P-15, A-06 |
| S18 | as staff: `POST rpc/search_clients {p_query:'Verify'}`; service `GET audit_log?action=eq.directory_view&actor_user_id=eq.staff1` ≥1 | rows + audit trail of the lookup | RPC missing = un-audited read path; no audit row = logging removed from function | P-13 |

## Rules

| Rule | Query / probe | Expected | Failure means | Checks |
|---|---|---|---|---|
| R01 | S16 battery + `GET user_roles` as client ⇒ 0 rows | privileges only via `user_roles`, cap 2 | — | P-11, R-04 |
| R02 | Engine B `tables_missing` + assert no `slots`/`availability` relation; A-04 advisory | schema contains no live-availability object | Presence = fictitious booking (D03 breach) | B tables list |
| R03 | P-05: `SESSION` insert with no completed `PATCH_TEST` ⇒ succeeds + `GET audit_log?action=eq.patch_test_warning&meta->>request_id=eq.<r>` ≥1; P-06 gap ⇒ `session_gap_warning` | soft-warn to audit (DA-05/06) | No audit row = warning invisible (Postgres WARNING doesn't cross REST) | P-05, P-06 |
| R04 | Engine B `public_health_columns=[]` and `clinical` grants `{}`/absent | zero health columns in public | Any hit = D05 breach in schema | B-02 |
| R05 | Engine B `money_violations=[]`; A-01/A-07; P-03; P-12 | `*_pence` integer, snapshots, append-only price history | float present = rounding/audit bug | A-01, A-07, P-03, P-12, B-03 |
| R06 | A-09 poison insert | `P0001` before FK check | accepted = preview leak class | A-09 |
| R07 | Engine R: A sees 0 rows of B across the 6 personal tables (by list **and by id**); anon content readable, personal 0; tamper battery on 7 append-only tables rejected for client/staff/**service** | database-enforced isolation | any accepted tamper/cross-read = FAIL, stop demo | R-01…R-06, B-01 |
| R08 | P-01 consent insert; tamper `PATCH consent_records` rejected; P-14 consent survives deletion | versioned evidence immutable | mutable consent = signature evidence worthless | P-01, R-05, P-14 |
| R09 | seed content spot-check (`colour`/`centre` spellings in seeded answers) | UK spelling in copy | import of US copy from template text | A-05 (manual line) |
| R10 | n/a for schema (build pipeline) — recorded in milestones doc | — | — | — |

## Suite-level

- `npm run verify` — preflight → Engine A → A2 → Engine R → Engine B → purge cleanup; exit 0 only
  with zero FAIL and zero BLOCKED; BLOCKED must be resolved by applying SQL/seed, never by deleting
  the check.
- `npm run verify:rls` — preflight → bootstrap personas → Engine R only (fast isolation gate).
- Expected counts (8/22/31/24-advisory, 5/5, 7×10:00–18:00) are **imported from
  `services/seed-contract.json`** — the same file `services/seed.ts` posts. If seed and check
  disagree, both are wrong (kickoff: counts come from files, never summaries).
