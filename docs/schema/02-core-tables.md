# 02 — Core Tables & Entity Relationships

Conventions: `id uuid pk default gen_random_uuid()`; `created_at` / `updated_at timestamptz`
omitted from field lists for brevity but present on every mutable table; event/history tables are
append-only (no `updated_at`, revoke UPDATE/DELETE). Every business table has `clinic_id` (f).
Types are Postgres; money `integer` pence (R05). "Delete rule" = FK referential action.

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
| role | enum `app_role`: `owner \| staff \| client` | clients may have no row = implicit `client` |
| granted_by | uuid → auth.users | owner only (S16) |
| revoked_at | timestamptz null | soft revoke; history never destroyed |

**Constraints:** partial unique `(clinic_id, user_id) WHERE revoked_at IS NULL`; trigger enforces
active `staff` count ≤ `clinic_settings.staff_seat_max` (2 per M01, confirm Q01). Delete:
CASCADE from auth (a deleted login can hold no seat) — but the grant/revoke facts persist in
`audit_log`.

### A3. `client_profiles`
**Purpose:** our PII, kept off `auth.users` (owned by Supabase). Serves S01 "so we know who it is"
and the S18 directory. Only fields with evidence; Q02 extras come as future migrations, not a
jsonb junk drawer.
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | **1:1**, `ON DELETE SET NULL`-style via deletion workflow (03 §5); `UNIQUE` |
| first_name, last_name | text not null | S01 |
| phone_e164 | text | verified E.164 (S01) |
| phone_raw | text | as typed, for support matching |
| phone_verified_at | timestamptz null | OTP-gated (real OTP from M1; demo D-F1 disables SMS) |
| pseudonymised_at | timestamptz null | set by GDPR deletion workflow (03 §5) |

**Constraints:** partial unique `(clinic_id, phone_e164) WHERE phone_verified_at IS NOT NULL AND
pseudonymised_at IS NULL` — see edge case E5 (shared-device/family phone) before relaxing.

### A4. `notification_tokens`
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | CASCADE |
| token | text unique | Expo push token; re-install creates new row |
| platform | `ios \| android` | both platforms, M01/ADR-001 |
| status | `active \| stale` | marked stale on Expo "InactiveDevice" responses |

### A5. `consent_records` — evidence, immutable (R08)
| Field | Type | Notes |
|---|---|---|
| user_id | uuid → auth.users | CASCADE blocked by append-only rule; kept on deletion (legal evidence) |
| kind | enum `data_processing \| marketing \| notifications` (+ `photos` when Q03 passes) | |
| policy_version | text | e.g. `privacy-2026-10` |
| policy_text_hash | text | sha256 of the exact wording shown — proves *what* was agreed |
| decision | `granted \| withdrawn` | withdrawal = **new row**, never an update |
| recorded_at, source | timestamptz, `app \| web \| in_person` | |

### A6. `deletion_requests` (S11)
`user_id`, `status (requested | in_review | completed | rejected)`, `requested_at`,
`completed_at`, `handled_by`, `note`. Owner-visible queue; no silent deletes.

### A7. `clinic_settings`
| Field | Type | Notes |
|---|---|---|
| key / value jsonb / updated_by | | typed keys only: `staff_seat_max` (2), `reminder_lead` ('24h', Q07), `booking_callback_promise` (verbatim W03 copy) |

Edits audited; values UI copy must show — never hardcode in the app.

## B. Catalogue & Public Content (what) — public-read (03 tier T0)

### B1. `treatment_categories`
`slug unique per clinic`, `name`, `blurb`, `sort_order`, `published`. Five verified: Laser, Skin,
Anti-Ageing, Body, Wellness (W04).

### B2. `treatments`
**Purpose:** the priced service the client sees; one home category; concern tags separate; honesty
fields (`content_verified`, `source_url`) make the "never invent" rule machine-checkable.
| Field | Type | Notes |
|---|---|---|
| category_id | uuid → treatment_categories | `ON DELETE RESTRICT` — never orphan a priced service |
| slug, name | text | site-verified names ("Carbon Laser Peel") |
| summary, description | text | reused content |
| price_from_pence | integer null, `>= 0` | 3500 … 12000 for the 8 core (W04); NULL elsewhere |
| pricing_model | enum `per_session \| from_price \| price_on_consultation \| free` | renders S03's "From £35 / Price on consultation / Free" labels; NULL price ⇒ `price_on_consultation` via CHECK |
| typical_sessions_min / max | smallint null | **only where published** (hair 6–8, tattoo 6–10, rejuvenation 3–6, pigmentation 1–3 — W04/FAQ); missing ⇒ UI shows "Discussed at consultation" (S04) |
| duration_minutes | int null | only 30-min carbon peel is published |
| requires_consultation, requires_patch_test | bool default true | R03; per-treatment override lives here, not in code |
| min_gap_days | smallint null | tattoo "six weeks apart" (FAQ) = 42; rest NULL until rules confirmed (E1) |
| disclaimer | text | "Individual suitability and results vary." where the site carries it |
| source_url, content_verified | text, bool | evidence per row; seed counts come from the seed file (08-scope rule) |
| published, sort_order | bool, int | 22 links vs 8 core priced — unreconciled (Q09); unpublished rows invisible to anon |

### B3. `treatment_concerns` + `treatment_concern_links` (M:N)
`concerns`: slug/name for the five homepage pills. `links`: `(treatment_id, concern_id)` PK both
columns, FKs `CASCADE` (pure association — deleting either edge is allowed, unlike B2's category).

### B4. `treatment_price_history` — append-only (R05, S17)
`treatment_id` (CASCADE), `old_price_pence`, `new_price_pence` (null allowed ⇒ first publish),
`effective_from timestamptz`, `changed_by uuid`, `reason text`. A `AFTER UPDATE` trigger on
`treatments` writes the row automatically when `price_from_pence` changes — staff can't forget.

### B5. `faq_items`
`question`, `answer`, `category` smallint, `sort_order`, `published`, `updated_by`. Reuses site
FAQs (W06/Q09 edit path undecided — table doesn't care whether edits come from app or dashboard).

### B6. `opening_hours` + `opening_hours_overrides`
`weekday smallint 0–6`, `is_open bool`, `opens/closes time`, `valid_from date` — unique
`(clinic_id, weekday, valid_from)`. Overrides: `(date, is_open, reason)` for bank holidays.
Current truth 10:00–18:00 daily (W01/D06 — PROPOSED, owner to confirm).

## C. Scheduling & Packages (when/money)

### C1. `booking_requests`
**Purpose:** the client's *wish* and the staff queue's unit of work (W03/D03/R02). Carries its own
price/name snapshot so a request is forever explainable even after catalogue edits or client
erasure.
| Field | Type | Notes |
|---|---|---|
| client_user_id | uuid → auth.users | `ON DELETE RESTRICT` while row is live; deletion workflow keeps the row pseudonymised (03 §5) |
| request_kind | enum `consultation \| treatment \| advise_me` | mirrors site's "I'm not sure yet, advise me" (W03) |
| treatment_id | uuid → treatments null | `RESTRICT`; CHECK: required unless `advise_me` |
| preferred_date | date not null | calendar (S05) |
| preferred_time_band | enum `morning \| afternoon \| evening` null | granularity BLOCKED on Q04 — bands are the safe default |
| notes_client | text | ⚠ PII/health-adjacent free text — see 03 §2 and E3 |
| status | enum `pending \| confirmed \| declined \| rescheduled \| cancelled` | CHECK state machine in trigger |
| treatment_name_snapshot, price_from_pence_snapshot, currency_code | text, int, 'GBP' | R05 snapshot at submit |
| idempotency_key | uuid | unique `(clinic_id, client_user_id, idempotency_key)` |
| decided_by | uuid → auth.users staff | set on confirm/decline (S12) |
| decision_reason | text | decline reason shown to client (S12) |

### C2. `booking_request_events` — append-only audit (S12)
`request_id CASCADE`, `actor_user_id`, `actor_role`, `action enum created|confirmed|declined|
reschedule_proposed|cancelled|note_added`, `detail jsonb` (small, no health content),
`created_at`. This *is* the state-transition evidence.

### C3. `appointments`
**Purpose:** calendar facts once staff commit; also the chain object for R03.
| Field | Type | Notes |
|---|---|---|
| client_user_id | uuid → auth.users | RESTRICT live / kept pseudonymised after deletion |
| client_name_snapshot | text | readable history without PII join |
| request_id | uuid → booking_requests null | 1 request → N appointments (consultation + patch-test chain) |
| course_id | uuid → client_courses null | session draws from a package |
| treatment_id | uuid → treatments null | `RESTRICT`; consultation may precede treatment choice |
| type | enum `consultation \| patch_test \| session` | R03, S06 |
| status | enum `scheduled \| completed \| cancelled \| cancelled_requested \| reschedule_requested \| no_show` | last two feed S10/S15 (phase 2, Q05) |
| scheduled_start timestamptz, duration_minutes int | | UTC always |
| therapist_user_id | uuid → auth.users null | who did it (staff accountability, not a health claim) |

Trigger `warn_session_without_patch_test`: BEFORE INSERT/UPDATE — if `type='session'` and
treatment `requires_patch_test` and no `completed patch_test` appointment exists for this
client+treatment before `scheduled_start`, RAISE WARNING (soft in v1; escalation in E2).

### C4. `appointment_events` — append-only, same shape as C2 (actions include
`scheduled|confirmed_by_staff|completed|cancelled_requested|cancelled|no_show_recorded`).

### C5. `course_packages` (catalogue) + C6. `client_courses` — **structure-only for v1 (Q10)**
`course_packages`: treatment_id RESTRICT, name, sessions_count (6/8 — FAQ wording), `price_pence`
NULL (no published figure — never invent), published.
`client_courses`: client_user_id, course_package_id, `sessions_total`, `started_at`,
`expires_at null` (rollover policy unknown — E4), `status active|completed|expired|refunded`,
`recorded_by` staff (offline purchase logged at desk until payments exist).
`sessions_used` is **never stored** — computed `count(*)` over completed `appointments` linked by
`course_id`, so usage can't drift from facts.

### C7. `reminders` — server-owned schedule (D07, S07)
`appointment_id CASCADE`, `user_id`, `channel enum push|sms` (sms gated Q07), `scheduled_for
timestamptz`, `status enum scheduled|sent|failed|cancelled`, `attempts int`, `last_error text`,
`sent_at`. Unique `(appointment_id, channel, scheduled_for)` ⇒ idempotent dispatch; reschedule
cancels + re-creates rows; Edge Function flips status — a sleeping phone is never the scheduler.

## D. Communication (news & conversations)

### D1. `updates` + `update_revisions` + `update_reads`
`updates`: title, body, `status draft|published`, published_at, created_by, published bool via
status. `update_revisions`: append-only (update_id CASCADE, title, body, revised_by, revised_at) —
S14 "history preserved". `update_reads`: PK `(update_id, user_id)`, `read_at` — powers the unread
badge with one tiny upsert.

### D2. `enquiries` + `enquiry_messages`
`enquiries`: client_user_id (RESTRICT-live), treatment_context_id null, `status open|answered|
closed`, `client_name_snapshot`, closed_by/closed_at.
`enquiry_messages`: enquiry_id CASCADE, `author_user_id`, `author_role client|staff`, `body`
(⚠ clients will disclose health here — 03 §2, E3), `sent_at`. Append-only: no edits, corrections
are new messages (thread credibility).

### D3. `notifications` — in-app inbox + push delivery log
`user_id`, `kind appointment_reminder|booking_update|enquiry_reply|new_update`, `title`, `body`
(**R06 assertion**: CHECK/tripwire forbids treatment names — content policy as a constraint),
`route text` (Expo Router deep link, e.g. `/appointments/{id}`), `read_at`, `push_sent_at`.
Fallback per S07 when push permission denied.

### D4. `audit_log` — cross-cutting, append-only
`actor_user_id null (=system/edge)`, `actor_role`, `action text`, `target_table`, `target_id`,
`meta jsonb`, `created_at`. Records at minimum: role grants/revokes (S16), price & hours edits
(S17), staff directory lookups (S18 "access audited"), deletion-workflow steps (S11). Index
`(target_table, target_id, created_at desc)`.

## E. Dormant clinical partition — designed, `GATED ON Q03`, not applied in v1

Separate Postgres schema **`clinical`** (not `public`) so the anon/authenticated Supabase roles get
zero grants by default — isolation is structural, not a policy to forget. Each table below is the
shape we'd apply if and when the owner opts into in-app health data (D05 currently says no).

| Table | Purpose | Key fields |
|---|---|---|
| `clinical.skin_assessments` | Fitzpatrick type per client, by therapist | client_user_id, `fitzpatrick_type smallint 1–6`, assessed_by, assessed_at |
| `clinical.medical_screenings` | **Dynamic intake**: templates version questions; responses store answers + hash | `screening_templates(id, version, questions jsonb, published_at)` / `medical_screening_responses(client_user_id, template_id, answers jsonb, answers_hash, completed_at)` — versioned rows mean form changes never rewrite history |
| `clinical.treatment_plans` | consultation outcome as a plan (not a diagnosis) | client_user_id, treatment_id, recommended_sessions, set_by, set_at |
| `clinical.consent_signatures` | signed medical consent metadata; PDF bytes live in Storage | client_user_id, kind, policy_version, storage_path, signature_hash, signed_at, ip_hash |
| `clinical.progress_media` | before/after photos (W06) | client_user_id, appointment_id, bucket_path, `media_kind before\|after`, consent_record_id FK to `consent_records`, visibility `staff_only` |

Retention rules for these rows are in 03 §5 (they survive client-erasure under Art. 9(2)/clinical
record obligations, flagged `retention_basis`).
