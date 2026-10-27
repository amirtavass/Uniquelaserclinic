# 02 — Core Tables & Entity Relationships

Conventions: `id uuid pk default gen_random_uuid()`; `created_at` / `updated_at timestamptz`
omitted from field lists for brevity but present on every mutable table; event/history tables are
append-only (no `updated_at`, revoke UPDATE/DELETE). Every business table has `clinic_id`.
Types are Postgres; money `integer` pence (R05). "Delete rule" = FK referential action.
**Enum labels follow the 01 §2(e) convention: UPPERCASE exactly as written in `01-user-stories.md`
(`PENDING`, `PATCH_TEST`, `CANCEL_REQUESTED`, …); the only lowercase enum is `app_role`
(`owner | staff | client`, per R01). Non-enum action tags (e.g. `audit_log.action`) are lowercase
snake_case.**

## A. Identity & Access (who)

### A1. `clinics`
**Purpose:** the tenant root. One row in v1; every other table references it, which is what makes
RLS predicates tenant-safe and a future second clinic possible without restructuring.
| Field | Type | Notes |
|---|---|---|
| name, address_line, postcode | text | 327 Deane Road, Bolton BL3 5HN (W01) |
| phone_e164, email | text | +447301166333, hello@… (W05) |
| timezone | text | default `'Europe/London'` |

### A2. `user_roles` — authoritative privileges (never client-side guessing, ADR-002)
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | `ON DELETE CASCADE` |
| clinic_id | uuid → clinics | `RESTRICT` |
| role | enum `app_role`: `owner \| staff \| client` (lowercase per R01) | clients may have no row = implicit `client` |
| granted_by | uuid → auth.users | owner only (S16) |
| revoked_at | timestamptz null | soft revoke; history never destroyed |

**Constraints:** partial unique `(clinic_id, user_id) WHERE revoked_at IS NULL`; trigger
`assert_staff_seat_cap` raises when active `staff` count > `clinic_settings.staff_seat_max`
(demo default 2 per M01 — Q01 confirms; question in `decisions/01`). Delete: CASCADE from auth (a
deleted login can hold no seat) — but the grant/revoke facts persist in `audit_log`.

### A3. `client_profiles`
**Purpose:** our PII, kept off `auth.users` (owned by Supabase). Serves S01 "so we know who it is"
and the S18 directory (directory reads go through `app.search_clients` RPC so every lookup is
audited — plain SELECTs are not loggable). Only fields with evidence; Q02 extras (notably DOB —
`/faqs/` now *publishes* age limits: under-16 never, under-18 for some treatments) come as future
migrations with a stated reason, not a jsonb junk drawer.
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | **1:1**, `UNIQUE`; kept on deletion (row becomes pseudonymised shell, 03 §6) |
| first_name, last_name | text not null | S01 |
| phone_e164 | text | verified E.164 (S01) |
| phone_raw | text | as typed, for support matching |
| phone_verified_at | timestamptz null | OTP-gated (real OTP from M1; demo D-F1 disables SMS) |
| pseudonymised_at | timestamptz null | set by GDPR deletion workflow (03 §6) |

**Constraints (demo default):** partial unique `(clinic_id, phone_e164) WHERE phone_verified_at IS
NOT NULL AND pseudonymised_at IS NULL` — uniqueness is enforced **only on OTP-verified numbers**
(unverified duplicates allowed, flagged to staff); open question Q17 (household/shared phone).

### A4. `notification_tokens`
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | CASCADE |
| token | text unique | Expo push token; re-install creates new row |
| platform | enum `IOS \| ANDROID` | both platforms, M01/ADR-001 |
| status | enum `ACTIVE \| STALE` | marked stale on Expo "InactiveDevice" responses |

### A5. `consent_records` — evidence, immutable (R08)
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | retained after deletion (legal evidence, 03 §6) |
| kind | enum `DATA_PROCESSING \| MARKETING \| NOTIFICATIONS` (+ `PHOTOS` when Q03 passes) | |
| policy_version | text | e.g. `privacy-2026-10` |
| policy_text_hash | text | sha256 of the exact wording shown — proves *what* was agreed |
| decision | enum `GRANTED \| WITHDRAWN` | withdrawal = **new row**, never an update |
| recorded_at, source | timestamptz, enum `APP \| WEB \| IN_PERSON` | |

### A6. `deletion_requests` (S11)
`user_id`, `status enum REQUESTED | IN_REVIEW | COMPLETED | REJECTED`, `requested_at`,
`completed_at`, `handled_by`, `note`. Owner-visible queue; no silent deletes.

### A7. `clinic_settings`
| Field | Type | Notes |
|---|---|---|
| key / value jsonb / updated_by | | typed keys only, demo defaults in `decisions/02`: `staff_seat_max` (2), `reminder_lead` ('24h', Q07), `booking_callback_promise` (verbatim W03 copy) |

Edits audited; values UI copy must show — never hardcode in the app.

## B. Catalogue & Public Content (what) — public-read (03 tier T0)

### B1. `treatment_categories`
`slug unique per clinic`, `name`, `blurb`, `sort_order`, `published`. Five verified: Laser, Skin,
Anti-Ageing, Body, Wellness (W04).

### B2. `treatments`
**Purpose:** the priced service the client sees; one home category; concern tags separate; honesty
fields (`content_verified`, `source_url`) make the "never invent" rule machine-checkable; the four
visibility flags carry the exact reconciled live-site breakdown (8 / 22 / 31 / 24, W04 re-verified
26 Oct 2026) in one seed.
| Field | Type | Notes |
|---|---|---|
| category_id | uuid → treatment_categories | `ON DELETE RESTRICT` — never orphan a priced service |
| slug, name | text | site-verified names ("Carbon Laser Peel") |
| summary, description | text | reused content |
| price_from_pence | integer null, `>= 0` | 3500 … 12000 for the 8 core (W04); NULL elsewhere |
| pricing_model | enum `PER_SESSION \| FROM_PRICE \| PRICE_ON_CONSULTATION \| FREE` | 8 core = `FROM_PRICE`; renders S03's "From £35 / Price on consultation / Free" labels; NULL price ⇒ `PRICE_ON_CONSULTATION` via CHECK |
| is_featured | bool | true exactly for the 8 core priced treatments (homepage "8 Core Treatments" strip) |
| has_detail_page | bool | true exactly for the 22 mega-menu treatments with dedicated pages |
| show_in_directory | bool | true exactly for the 31 `/treatments/` cards (22 detail + 9 consultation-only) |
| show_in_booking_dropdown | bool | true for the `/book/` dropdown set (24 reported — JS-rendered, advisory count; plus dropdown also offers the free-consultation entry, modelled by `request_kind = CONSULTATION`, not a treatment row) |
| typical_sessions_min / max | smallint null | **only where published** (hair 6–8, tattoo 6–10, rejuvenation 3–6, pigmentation 1–3, veins 1–2, acne 4–6, tightening 3–5 — W04/FAQ); missing ⇒ UI shows "Discussed at consultation" (S04) |
| duration_minutes | int null | only published durations seeded (carbon peel 30); FAQ area-variants (10 upper lip … 60+ full legs) stay text copy until an areas decision (Q13) |
| requires_consultation, requires_patch_test | bool default true | R03; per-treatment override lives here, not in code |
| min_gap_days | smallint null | tattoo "six weeks apart" (FAQ, verified) = 42; rest NULL until owner rules (E1, Q13) — demo default: gap check is a **soft warning**, never a block |
| disclaimer | text | "Individual suitability and results vary." where the site carries it |
| source_url, content_verified | text, bool | evidence per row; seed counts asserted by `npm run verify` Engine A |
| published, sort_order | bool, int | unpublished rows invisible to anon |

### B3. `treatment_concerns` + `treatment_concern_links` (M:N)
`concerns`: slug/name for the five homepage pills. `links`: `(treatment_id, concern_id)` PK both
columns, FKs `CASCADE` (pure association — deleting either edge is allowed, unlike B2's category).

### B4. `treatment_price_history` — append-only (R05, S17)
`treatment_id` (CASCADE), `old_price_pence`, `new_price_pence` (null allowed ⇒ first publish),
`effective_from timestamptz`, `changed_by uuid`, `reason text`. An `AFTER UPDATE` trigger on
`treatments` writes the row automatically when `price_from_pence` changes — staff can't forget, and
Engine A2 asserts the row exists after a test price edit.

### B5. `faq_items`
`question`, `answer`, `category` text, `sort_order`, `published`, `updated_by`. Reuses site FAQs
(`/faqs/` re-fetched 26 Oct: getting-started, safety, cost & courses, practical — seed all verified
Q&A pairs; Q09 edit path undecided — table doesn't care whether edits come from app or dashboard).

### B6. `opening_hours` + `opening_hours_overrides`
`weekday smallint 0–6`, `is_open bool`, `opens/closes time`, `valid_from date` — unique
`(clinic_id, weekday, valid_from)`. Overrides: `(date, is_open, reason)` for bank holidays.
**Seed = verified truth: Mon–Sun 10:00–18:00 (W01, re-verified across five pages 26 Oct 2026; the
V1 9am report is closed).** Versioning via `valid_from` stays because hours are editable in future
(S17), not because today's value is disputed.

## C. Scheduling & Packages (when/money)

### C1. `booking_requests`
**Purpose:** the client's *wish* and the staff queue's unit of work (W03/D03/R02). Carries its own
price/name snapshot so a request is forever explainable even after catalogue edits or client
erasure.
| Field | Type | Notes |
|---|---|---|
| client_user_id | uuid → auth.users | `ON DELETE RESTRICT` while row is live; deletion workflow keeps the row pseudonymised (03 §6) |
| request_kind | enum `CONSULTATION \| TREATMENT \| ADVISE_ME` | mirrors site's "I'm not sure yet, advise me" + free-consultation option (W03) |
| treatment_id | uuid → treatments null | `RESTRICT`; CHECK: required unless `ADVISE_ME` |
| preferred_date | date not null | calendar (S05) |
| preferred_time_band | enum `MORNING \| AFTERNOON \| EVENING` null | granularity BLOCKED on Q04 — bands are the safe default (R02: no fictitious slots) |
| notes_client | text | ⚠ PII/health-adjacent free text — see 03 §1 T2 and E3 |
| status | enum `PENDING \| CONFIRMED \| DECLINED \| RESCHEDULED \| CANCELLED` | state machine enforced in trigger; INSERT forced `PENDING` |
| treatment_name_snapshot, price_from_pence_snapshot, currency_code | text, int, 'GBP' | R05 snapshot computed **server-side** at submit (Engine A2 asserts non-null without client supplying it) |
| idempotency_key | uuid | unique `(clinic_id, client_user_id, idempotency_key)` |
| decided_by | uuid → auth.users staff | set on confirm/decline (S12) |
| decision_reason | text | decline reason shown to client (S12) |

### C2. `booking_request_events` — append-only audit (S12)
`request_id CASCADE`, `actor_user_id`, `actor_role`, `action enum CREATED | CONFIRMED | DECLINED |
RESCHEDULE_PROPOSED | CANCELLED | NOTE_ADDED`, `detail jsonb` (small, no health content),
`created_at`. This *is* the state-transition evidence.

### C3. `appointments`
**Purpose:** calendar facts once staff commit; also the chain object for R03.
| Field | Type | Notes |
|---|---|---|
| client_user_id | uuid → auth.users | RESTRICT live / kept pseudonymised after deletion |
| client_name_snapshot | text | readable history without PII join |
| request_id | uuid → booking_requests null | 1 request → N appointments (consultation + patch-test chain; `/faqs/`: patch test often same day as consultation — two rows) |
| course_id | uuid → client_courses null | session draws from a package |
| treatment_id | uuid → treatments null | `RESTRICT`; consultation may precede treatment choice |
| type | enum `CONSULTATION \| PATCH_TEST \| SESSION` | R03, S06 |
| status | enum `SCHEDULED \| COMPLETED \| CANCELLED \| CANCEL_REQUESTED \| RESCHEDULE_REQUESTED \| NO_SHOW` | `CANCEL_REQUESTED`/`RESCHEDULE_REQUESTED` feed S10/S15 (Q05) |
| scheduled_start timestamptz, duration_minutes int | | UTC always; consultation 20–30 min per `/faqs/` |
| therapist_user_id | uuid → auth.users null | who did it (staff accountability, not a health claim) |

Two **soft-warning triggers** (demo defaults — warn, never block; `decisions/02`):
`warn_session_without_patch_test` — on INSERT/UPDATE of a `SESSION` where the treatment
`requires_patch_test` and no `COMPLETED` `PATCH_TEST` exists for this client+treatment before
`scheduled_start`: `RAISE WARNING` **and insert `audit_log(action='patch_test_warning')`** — the
audit row is what `npm run verify` A2 asserts (Postgres WARNINGs don't cross REST).
`warn_session_gap` — same pattern when `scheduled_start < last COMPLETED SESSION + min_gap_days`
(`action='session_gap_warning'`).

### C4. `appointment_events` — append-only, same shape as C2 (actions `SCHEDULED |
CONFIRMED_BY_STAFF | COMPLETED | CANCEL_REQUESTED | CANCELLED | RESCHEDULE_REQUESTED |
RESCHEDULED | NO_SHOW_RECORDED`).

### C5. `course_packages` (catalogue) + C6. `client_courses` — **structure-only for v1 (Q10)**
`course_packages`: treatment_id RESTRICT, name, `sessions_count = 6` and `discount_percent = 20`
(**verified 26 Oct on `/faqs/`**: "course packages of six sessions at 20 per cent off most
treatments"), `price_pence` NULL (absolute figures never published — discount derives at
consultation; interest-free 3-instalment plans on £500+ are an in-person arrangement, so no
payment columns), published.
`client_courses`: client_user_id, course_package_id, `sessions_total`, `started_at`,
`expires_at` (**demo default NULL** — no expiry rule published; Q16), `status enum ACTIVE |
COMPLETED | EXPIRED | REFUNDED`, `recorded_by` staff (offline purchase logged at desk until Q10).
`sessions_used` is **never stored** — computed `count(*)` over completed `appointments` linked by
`course_id`, so usage can't drift from facts.

### C7. `reminders` — server-owned schedule (D07, S07)
`appointment_id CASCADE`, `user_id`, `channel enum PUSH | SMS` (SMS gated Q07), `scheduled_for
timestamptz`, `status enum SCHEDULED | SENT | FAILED | CANCELLED`, `attempts int`, `last_error text`,
`sent_at`. Unique `(appointment_id, channel, scheduled_for)` ⇒ idempotent dispatch; reschedule
cancels + re-creates rows; Edge Function flips status — a sleeping phone is never the scheduler.
Demo default lead: 24 h (Q07).

## D. Communication (news & conversations)

### D1. `updates` + `update_revisions` + `update_reads`
`updates`: title, body, `status enum DRAFT | PUBLISHED`, published_at, created_by.
`update_revisions`: append-only (update_id CASCADE, title, body, revised_by, revised_at) —
`AFTER UPDATE` trigger writes the prior version automatically (S14 "history preserved"; Engine A2
asserts the row after a staff edit). `update_reads`: PK `(update_id, user_id)`, `read_at` — powers
the unread badge with one tiny upsert.

### D2. `enquiries` + `enquiry_messages`
`enquiries`: client_user_id (RESTRICT-live), treatment_context_id null, `status enum OPEN |
ANSWERED | CLOSED`, `client_name_snapshot`, closed_by/closed_at. Trigger: first `AUTHOR_ROLE =
'staff'` message flips `OPEN → ANSWERED` (Engine A2 asserts).
`enquiry_messages`: enquiry_id CASCADE, `author_user_id`, `author_role enum CLIENT | STAFF`, `body`
(⚠ clients will disclose health here — 03 §1 T2, E3), `sent_at`. Append-only: no edits, corrections
are new messages (thread credibility).

### D3. `notifications` — in-app inbox + push delivery log
`user_id`, `kind enum APPOINTMENT_REMINDER | BOOKING_UPDATE | ENQUIRY_REPLY | NEW_UPDATE`, `title`,
`body` (**R06 tripwire**: guard trigger `assert_r06_generic_copy` raises before insert if `body`
matches any `treatments.name` case-insensitively — testable by asserting error `P0001` on a body
like "Your Laser Hair Removal session is confirmed"), `route text` (Expo Router deep link, e.g.
`/appointments/{id}`), `read_at`, `push_sent_at`. Fallback per S07 when push permission denied.

### D4. `audit_log` — cross-cutting, append-only
`actor_user_id null (=system/edge)`, `actor_role`, `action text` (lowercase snake: `directory_view`,
`patch_test_warning`, `session_gap_warning`, `role_granted`, `price_edited`, `deletion_step`…),
`target_table`, `target_id`, `meta jsonb` (includes `run_id` for verification-suite tagging),
`created_at`. Records at minimum: role grants/revokes (S16), price & hours edits (S17), staff
directory RPC calls (S18 — inside `app.search_clients`), warning triggers (C3), deletion-workflow
steps (S11). Index `(target_table, target_id, created_at desc)`.

### D5. Verification maintenance seam
`app.purge_verification_data(run_id text)` — `SECURITY DEFINER`, service-role `EXECUTE` only,
`SET app.allow_append_only_delete = on` internally; deletes only rows whose `meta->>'run_id'` /
`idempotency_key` tag matches, *after* letting the guard triggers see the GUC. Without this seam,
append-only guard triggers would break FK-cleanup cascades and test rows would pollute the staff
queue. It is a schema prerequisite for `npm run verify` (05 §4).

## E. Dormant clinical partition — designed, `GATED ON Q03`, not applied in v1

Separate Postgres schema **`clinical`** (not `public`) so the anon/authenticated Supabase roles get
zero grants by default — isolation is structural, not a policy to forget. Each table below is the
shape we'd apply if and when the owner opts into in-app health data (D05 currently says no — and the
live site's own fallback matches: health fields on `/book/` are explicitly optional and "your skin
type is assessed at consultation", 04 §1.1).

| Table | Purpose | Key fields |
|---|---|---|
| `clinical.skin_assessments` | Fitzpatrick type per client, by therapist | client_user_id, `fitzpatrick_type smallint 1–6`, assessed_by, assessed_at |
| `clinical.medical_screenings` | **Dynamic intake**: templates version questions; responses store answers + hash | `screening_templates(id, version, questions jsonb, published_at)` / `medical_screening_responses(client_user_id, template_id, answers jsonb, answers_hash, completed_at)` — versioned rows mean form changes never rewrite history |
| `clinical.treatment_plans` | consultation outcome as a plan (not a diagnosis) | client_user_id, treatment_id, recommended_sessions, set_by, set_at |
| `clinical.consent_signatures` | signed medical consent metadata; PDF bytes live in Storage | client_user_id, kind, policy_version, storage_path, signature_hash, signed_at, ip_hash |
| `clinical.progress_media` | before/after photos (W06) | client_user_id, appointment_id, bucket_path, `media_kind BEFORE \| AFTER`, consent_record_id FK to `consent_records`, visibility `STAFF_ONLY` |

Retention rules for these rows are in 03 §5/§6 (they survive client-erasure under Art. 9(2)/clinical
record obligations, flagged `retained_for`).
