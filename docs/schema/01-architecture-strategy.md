# 01 — Architectural Strategy & Justification (The "Why")

Status: PROPOSED. Sources cited as W## (verified website evidence), M01 (staff message),
R## / D## (rules & decisions in `docs/schema-coaching/`).

## 1. Context mapping — what shaped this data model

### From the website (evidence W01–W08)

| Website fact | Schema consequence |
|---|---|
| W04 — **reconciled catalogue (26 Oct 2026 live fetch):** 8 core priced treatments (£35–£120 →
  `3500`–`12000` pence), 22 mega-menu detail pages, **31 cards on `/treatments/`** (22 with detail
  pages + 9 "book a consultation" cards such as HIFU face lift, HydraFacial, RF/EMS sculpting, skin
  tag removal), 24 items reported in the `/book/` dropdown (JS-rendered — advisory, re-verify
  manually), 5 categories, concern pills ("Unwanted hair", "Ageing and texture", "Pigment and
  veins", "Acne", "Tattoos"). V1's 32-count was a mix-up of `/book/` options with directory cards —
  closed, not an open contradiction. | `treatment_categories` (1:N to `treatments`) plus a **separate**
  `treatment_concerns` M:N dimension: the site's IA has one home category per treatment but a treatment
  answers several concerns (e.g. laser hair removal ↔ "Unwanted hair"; rejuvenation ↔ both "Ageing and
  texture" and "Pigment and veins"). Collapsing concerns into the category would make the homepage filter
  pills unimplementable without inventing data. Four visibility flags (`is_featured`,
  `has_detail_page`, `show_in_directory`, `show_in_booking_dropdown`) let one seed file carry the exact
  8 / 22 / 31 / 24 breakdown without inventing entities (02 §B2). |
| W02 — "Every new treatment starts with a free consultation and patch test"; patch test "24 to 48
  hours before your first full session"; `/faqs/` adds that the patch test is usually performed **on
  the consultation day** and the 20-minute consultation reviews medical history | The booking domain
  cannot be one table. `appointments.type` is an enum `CONSULTATION | PATCH_TEST | SESSION` and
  `treatments.requires_consultation` / `requires_patch_test` are first-class flags, so the chain is
  *data*, not app folklore (R03). Consultation and patch test may share a day — two appointment rows,
  not one. |
| W03 — request → "we'll be in touch within one working day"; no live slots | `booking_requests` (client intent, mutable status machine) is split from `appointments` (staff-committed calendar facts). One request confirms into one-or-more appointments. A single merged `bookings` table would force either fake availability or overwrite the client's original ask — both break the verified workflow (D03, R02). |
| W-FAQ — **verified 26 Oct on `/faqs/`:** "course packages of six sessions at 20 per cent off most
  treatments" + interest-free payment plans on courses of £500+ split over three monthly instalments
  (arranged in person) | `course_packages` (catalogue: `sessions_count = 6`, `discount_percent = 20` —
  verified data) + `client_courses` (a client's course, staff-recorded) + `appointments.course_id`.
  Absolute package prices are still not published (discount is % off session rates) so `price_pence`
  stays NULL (R05); payment plans and any in-app purchase remain parked (Q10). The homepage FAQ's
  looser "six or eight sessions" wording vs `/faqs/`' specific "six … 20 per cent" is a copy question
  for the owner (`decisions/02-demo-assumptions.md`), not a schema contradiction. |
| W01 — **verified truth, re-confirmed 26 Oct 2026:** every live page (`/`, `/treatments/`, `/book/`,
  `/faqs/`, `/areas-served/`) states Monday–Sunday 10:00–18:00. The V1 "9am" report does not appear
  anywhere on the current site — contradiction closed. | `opening_hours` seeded 10:00–18:00 × 7 with
  `valid_from` versioning anyway, because opening hours are a *published fact that can change*: the
  open/closed widget reads the currently-valid row and history must survive any future edit (S17). |
| W06 — Fitzpatrick suitability, insured therapists, before/after photography | Designed into the **dormant `clinical` schema** (02 §E), not into `public`: app-side health data collection is parked by D05/R04 pending Q03. |
| W08 — FAQs, testimonials, aftercare as content | `faq_items`, `updates` (with revisions) — staff-editable content tables with draft/publish states; testimonials deliberately excluded (only 3 verifiable, W07 — no review entity invented). |

### From M01 + team notes (staff message, user stories, demo slice)

| Operational signal | Schema consequence |
|---|---|
| M01: "Admin should be the owner, and 2 people to control it" | Privileges live in `user_roles` (owner-granted, revocation time-stamped, `staff_seat_max` enforced by trigger). Not a column on profiles: role is security state and must be writable only by owner via RLS (S16, R01). |
| M01: "sign up with their email and number and full info so we know who it is" | `client_profiles` (1:1 to `auth.users`) + S18 staff directory. The exact extra-field list is **Q02-blocked** — the schema deliberately has no speculative DOB/address columns; additions are migrations with a stated reason. |
| M01: "check reminders and stuff like that" | `reminders` as server-owned schedule rows (D07 — a sleeping phone cannot remind anyone) with a dispatch state machine; `notifications` as the in-app fallback and delivery log (S07). |
| M01: "check updates" | `updates` + `update_reads` (per-client unread state) + `update_revisions` (S14 "history preserved"). |
| M01: "ask for enquiries" | `enquiries` + append-only `enquiry_messages` thread (S09/S13) — threaded replies visible only to the client, mirrored status `OPEN | ANSWERED | CLOSED`. |
| R07 + kickoff trap list: "verified with two real users, not by UI hiding" | Every personal table is written so a single RLS predicate suffices: ownership via `user_id = auth.uid()` directly on the row (no deep joins needed for the common case) — see 03. |
| R05: money = integer pence; snapshots with effective dates | `*_pence integer` columns; `treatment_price_history` and the snapshot fields on `booking_requests` are append-only (02 §B, §C). |
| Demo slice D-F1–D-F8 (`docs/demo/01-demo-scope.md`) | The v1 applied set is exactly the tables the REAL/SIMPLE demo features need; nothing in the demo requires a dormant/clinical table. |

## 2. Design decisions (and the alternatives rejected)

**a. Request/appointment split with event tables.**
`booking_requests` carries the *client's wish* (preferred date + time band) and a status machine
`PENDING | CONFIRMED | DECLINED | RESCHEDULED | CANCELLED`; `booking_request_events` records every
transition with actor. Rejected: one `bookings` table (conflates wish with commitment; destroys the
audit trail S12 requires) and a live `slots` table (fictitious availability — R02/BLOCKED on Q04).

**b. 1:N vs M:N, deliberately.**
- category → treatments: **1:N** — the site's IA gives each treatment exactly one home; secondary
  categorisation is expressed through concerns, not a second FK, so menus can never disagree.
- treatments ↔ concerns: **M:N** (junction table) — filters must combine (02 §B).
- `auth.users` ↔ profile: **1:1** — Supabase owns identity; we own tenant-scoped PII. Putting
  profile columns on `auth.users` would fight Supabase migrations and leak across the RLS boundary.
- appointments → request: **1:N nullable** — confirm may create a chain (consultation + patch test
  per R03); later session re-requests may also reference the original. Nullable because staff can
  create walk-in appointments with no request (W05 walk-ins).

**c. Normalisation level: 3NF with two *justified* denormalisations.**
Catalogue and people data are 3NF. The exceptions: (1) price/name **snapshot columns** on
`booking_requests` and `appointments` — a request must display forever with the price the client
saw at request time (R05), immune to later edits and to GDPR pseudonymisation; (2) `*_events`
tables duplicate a little status data because they are immutable audit facts, not current state.
Everything else joins.

**d. Complex clinic logic lives in constraints + triggers, not app code.**
- Patch-test prerequisite: a `BEFORE INSERT/UPDATE` trigger warns (not blocks) when a `SESSION` is
  scheduled without a prior `COMPLETED` `PATCH_TEST` for that client + treatment; hard-enforcement
  level is a Q03/Q04 decision (04 §2.3).
- Staff seat cap: trigger counts active `staff` rows against `clinic_settings.staff_seat_max`
  (default 2 from M01, confirm Q01).
- Append-only: `REVOKE UPDATE, DELETE` on event/history tables + guard triggers; even the service
  role obeys, so "the register is append-only" is a database fact (AGENTS.md "Never").

**e. Enum handling & casing convention (single standard, per 01-user-stories wording).**
Postgres `enum` types per status in a dedicated `app`-owned type namespace (`booking_status`,
`appointment_type`, `appointment_status`, `pricing_model`, `time_band`, `consent_kind`,
`reminder_status`, …). **Rule: enum labels are exactly the strings `docs/schema-coaching/01-user-
stories.md` already writes** — UPPERCASE with underscores for statuses/types/kinds/channels
(`PENDING | CONFIRMED | DECLINED | RESCHEDULED | CANCELLED`, `CONSULTATION | PATCH_TEST | SESSION`,
`CANCEL_REQUESTED | RESCHEDULE_REQUESTED`, `DRAFT | PUBLISHED`, `OPEN | ANSWERED | CLOSED`,
`IOS | ANDROID`, `PUSH | SMS`, `GRANTED | WITHDRAWN`) — **lowercase only where the stories themselves
use lowercase**, i.e. the three role names `owner | staff | client` (R01). Non-enum action tags
(`audit_log.action` e.g. `directory_view`) stay lowercase snake_case. Enums (not check-constraint
text) give the mobile TS codegen a closed union and make an unknown state a hard write error rather
than silent UI breakage. `npm run verify` (Engine B) fails the build if any enum label deviates from
this contract.

**f. One-tenant shape, multi-tenant structure.** Every business table carries
`clinic_id uuid NOT NULL REFERENCES clinics` with composite FKs where children must stay inside
their tenant. Runtime seeds one row. This costs almost nothing and keeps the door open (08-scope
"multi-clinic shape beyond `clinic_id` column" stays out, but the column is the shape).

## 3. Mobile optimisation

| Concern | How the schema serves the phone |
|---|---|
| **Payload size** | Clients never fetch catalogue joins to render cards: `treatments` rows are self-sufficient (name, summary, `price_from_pence`, `pricing_model`, session guidance). `checkConnection()` already uses `head: true` exact counts — supported by narrow indexed lookups, not wide selects. |
| **Round-trip minimisation** | One `app.client_dashboard(user_id)` `STABLE SECURITY DEFINER` RPC returns upcoming appointment + pending request + unread counts (updates, enquiries, unseen queue-as-applicable) in **a single HTTP round trip** — important on a Bolton bus's 4G. Function still consults RLS-scoped views, so it cannot widen access (documented in 03 §4). |
| **Offline caching / sync** | Content tables (`treatments`, `faq_items`, published `updates`, `opening_hours`) carry `updated_at` and are pull-delta-syncable (`where updated_at > :cached_watermark`); the app caches catalogue + published content in AsyncStorage with stale-while-revalidate. Personal data is **not** offline-mutated — booking is created online, optimistic UI only. |
| **Double-submit safety** | Client generates `idempotency_key uuid` at form-open; unique `(clinic_id, client_user_id, idempotency_key)` makes a retry after a dropped connection a no-op, not a duplicate request. |
| **Notification previews (R06)** | `notifications.body` and `reminders` payload copy contain no treatment names; schema stores deep-link route in `notifications.route` so the phone resolves detail *after* unlock. |
| **Keyset pagination** | List tables (`appointments`, `enquiries`, `updates`, events) are indexed `(tenant/user, created_at desc, id)` for cursor paging — no OFFSET scans as history grows. |
| **Timezones** | All instants `timestamptz` UTC; `clinics.timezone = 'Europe/London'`; reminder scheduling computed server-side so BST/GMT flips don't double-send (04 §2.5). |
