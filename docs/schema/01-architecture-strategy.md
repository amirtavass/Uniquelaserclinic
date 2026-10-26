# 01 — Architectural Strategy & Justification (The "Why")

Status: PROPOSED. Sources cited as W## (verified website evidence), M01 (staff message),
R## / D## (rules & decisions in `docs/schema-coaching/`).

## 1. Context mapping — what shaped this data model

### From the website (evidence W01–W08)

| Website fact | Schema consequence |
|---|---|
| W04 — 5 treatment categories, 22 menu links, 8 core priced treatments (£35–£120/session), concern pills ("Unwanted hair", "Ageing and texture", "Pigment and veins", "Acne", "Tattoos") | `treatment_categories` (1:N to `treatments`) plus a **separate** `treatment_concerns` M:N dimension: the site's IA has one home category per treatment but a treatment answers several concerns (e.g. laser hair removal ↔ "Unwanted hair"; rejuvenation ↔ both "Ageing and texture" and "Pigment and veins"). Collapsing concerns into the category would make the homepage filter pills unimplementable without inventing data. |
| W02 — "Every new treatment starts with a free consultation and patch test"; patch test "24 to 48 hours before your first full session" | The booking domain cannot be one table. `appointments.type` is an enum `CONSULTATION | PATCH_TEST | SESSION` and `treatments.requires_consultation` / `requires_patch_test` are first-class flags, so the chain is *data*, not app folklore (R03). |
| W03 — request → "we'll be in touch within one working day"; no live slots | `booking_requests` (client intent, mutable status machine) is split from `appointments` (staff-committed calendar facts). One request confirms into one-or-more appointments. A single merged `bookings` table would force either fake availability or overwrite the client's original ask — both break the verified workflow (D03, R02). |
| W04/FAQ — "discounted course packages of six or eight sessions"; per-session prices | `course_packages` (catalogue) + `client_courses` (a client's purchased course) + `appointments.course_id`. Prices stay NULL-until-published — the site gives no package figures, and we never invent (R05, "Never" list). Purchase/payments remain out of v1 (Q10) but the shape costs nothing now and avoids a painful retrofit later. |
| W01 — 10:00–18:00 daily, 7 days (D06 still pending owner) | `opening_hours` with `valid_from` — hours are a *published, versioned fact*, because the V1 report found a 9am/10am conflict; the open/closed widget must read the currently-valid row, and history must survive a change. |
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

**e. Enum handling.** Postgres `enum` types per status in a dedicated `app`-owned type namespace
(`booking_status`, `appointment_type`, `appointment_status`, `pricing_model`, `time_band`,
`consent_kind`, `reminder_status`, `role`), values UPPERCASE. Enums (not check-constraint text)
give the mobile TS codegen a closed union and make an unknown state a hard write error rather than
silent UI breakage.

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
