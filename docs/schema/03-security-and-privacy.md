# 03 — Security, Privacy & Clinical Compliance

Enforcement layer: Supabase Postgres **Row-Level Security** (ADR-002, R07). Rules are database
facts, never UI hiding. Policies are per-operation and idempotent (`drop policy if exists …;
create policy …`) so migrations replay safely, and are verified with two real users via
`npm run verify:rls` — not by eyeballing screens.

## 1. Data isolation tiers

| Tier | Contents | Tables | Exposure |
|---|---|---|---|
| **T0 — Public content** | catalogue, prices, FAQs, published updates, opening hours, clinic info | `treatments`, `treatment_categories`, `treatment_concerns(_links)`, `faq_items`, `updates`(published), `opening_hours(_overrides)`, `clinics` | readable by `anon` (S03 browsing needs no login); writable only by staff/owner |
| **T1 — Standard PII** | name, email (in `auth.users` — hashed by Supabase), phone, tokens, booking history, profile | `client_profiles`, `user_roles`, `notification_tokens`, `booking_requests`+events, `appointments`+events, `reminders`, `notifications`, `update_reads`, `course*`, `consent_records`, `deletion_requests` | owner ⇒ `client` role only via own-row predicates; staff sees all (S18, by design) |
| **T2 — Free-text with inference risk** | `booking_requests.notes_client`, `enquiry_messages.body`, `audit_log.meta` | ⚠ clients *will* volunteer medical history in notes ("I'm on isotretinoin…"). This is effectively health data by inference even under D05. Mitigations: UI placeholder copy steers away from health details; retention is minimal; these are the only columns ever redacted by the deletion workflow. |
| **T3 — Clinical (DORMANT)** | Fitzpatrick, screening answers, plans, signed consents, photos | `clinical.*` schema + private Storage bucket | **no grants to `anon`/`authenticated` at all**; only `service_role` and explicitly SECURITY DEFINER functions in staff context. Gated on Q03 — not applied in v1. |

Health vs standard data separation rationale: T3 lives in a *different database schema*, so the
default Supabase roles cannot see it even if someone later writes a sloppy policy on a `public`
table; and v1's `public` schema deliberately has no health columns at all, which keeps the D05/R04
promise ("app does not collect health data") verifiable by anyone with `\dt public.*`.

## 2. Roles & RBAC helpers

One set of `STABLE SECURITY DEFINER` helpers in schema `app` (search_path pinned, owner = postgres)
so policies stay short and consistent:

- `app.uid()` → `auth.uid()`
- `app.is_staff()` → exists active `user_roles` row (`owner` or `staff`, `revoked_at IS NULL`)
- `app.is_owner()` → active `owner` row
- `app.tenant_id()` → the single clinic id (cached)

Privilege model (M01/R01/D04): `client` (implicit, no row needed) < `staff` (max 2 seats, seat cap
trigger) < `owner` (adds role management, settings, deletion workflow). Service role exists for
Edge Functions (reminder dispatch) only — never bundled in the app (`.env` split already enforces:
`SERVICE-ROLE`/`SUPABASE_SERVICE_ROLE_KEY` are server-side-only keys per `.env.example`).

## 3. RLS matrix (per operation)

| Table | anon | client (self) | staff | owner | service |
|---|---|---|---|---|---|
| catalogue/content tables | SELECT (published=true only, via policy predicate) | + SELECT | SELECT, INSERT, UPDATE | SELECT, UPDATE | all |
| `client_profiles` | — | SELECT, UPDATE (own; phone change resets `phone_verified_at`) | SELECT (directory S18 — audited) | SELECT | all |
| `user_roles` | — | — | — | SELECT; INSERT/UPDATE grants & revokes only | all |
| `booking_requests` | — | SELECT own, INSERT own (status forced `pending` by trigger; snapshot columns server-computed, not client-supplied) | SELECT all, UPDATE `status/decided_by/decision_reason` only (column-privilege grant, not row rewrite) | all of staff | all |
| `booking_request_events`, `appointment_events`, `*_history`, `update_revisions`, `enquiry_messages`, `audit_log`, `consent_records` | — | SELECT own (where user-linked); INSERT own (requests: `booking_requests`-linked events; `consent_records`; `enquiry_messages`) | SELECT all; INSERT (their own actions) | staff + | all — **UPDATE/DELETE revoked for every role** |
| `appointments` | — | SELECT own | SELECT all, INSERT/UPDATE all (staff create walk-ins) | staff + | all |
| `reminders` | — | SELECT own | SELECT all; UPDATE dispatch-status only via service | — | all |
| `enquiries` | — | SELECT/INSERT own; UPDATE `status` ∈ {open→cancelled-by-client} | SELECT all, UPDATE status/reply via `enquiry_messages` | staff + | all |
| `updates` | SELECT published | SELECT published + upsert own `update_reads` | SELECT all, INSERT/UPDATE drafts+publish | staff + | all |
| `consent_records` | — | SELECT own, INSERT own (new decision rows) | SELECT all | SELECT all | all |
| `deletion_requests` | — | INSERT own, SELECT own | SELECT all | SELECT + UPDATE status (workflow) | all |
| `clinical.*` (dormant) | **no USAGE on schema** | none | none directly — only via `app.clinical_*` DEFINER functions with staff check inside | same | all |

Notes:
- Every personal policy also ANDs `clinic_id = app.tenant_id()` — tenant shape from birth.
- The `app.client_dashboard()` RPC (01 §3) runs as invoker with respect to its own check
  (`WHERE user_id = app.uid() OR app.is_staff()` at the call boundary) and DEFINER only for
  composing counts — it can return no more than the caller's policies allow.
- `verify:rls` must prove: client A cannot read client B's requests/appointments/enquiries by id;
  client cannot UPDATE `status` on own request; staff cannot grant roles; anon cannot read draft
  `updates`; events tables reject UPDATE/DELETE from every role including service (guard trigger).

## 4. Encryption & storage

- **In transit:** TLS everywhere (Supabase enforces); app connects via HTTPS REST only.
- **At rest (platform):** Supabase-managed disks are AES-256 encrypted; project region must be
  EU/UK-appropriate (ADR-002 consequence: region choice + transfer position ADR once health data is
  opted in).
- **At rest (column-level, defence in depth):** for T2/T3 text we plan `pgcrypto`/envelope
  encryption — encrypted by an Edge Function key held in server env (never committed, per
  PROGRESS guardrails), decrypted only inside staff-context DEFINER functions. In v1 the practical
  control is *minimal collection* (D05): there is nothing worth column-encrypting until Q03 flips.
- **Auth session storage:** S02 acceptance says tokens in secure storage — flagged as a live
  contradiction (04 §1.6); schema-wise irrelevant but must be fixed before health-era features.
- **Storage buckets:** `consents` and `progress-media` (phase 2) — private, no public URLs; signed
  URLs TTL ≤ 60 s, single object; object naming `tenant/user/…`; bucket policies separate from
  table RLS (ADR-002) so a leak in one doesn't assume the other.

## 5. Auditability & immutability

- **Immutable by three mechanisms:** (1) `REVOKE UPDATE, DELETE` on all event/history/consent/audit
  tables; (2) guard triggers raising `insufficient_privilege` even for the table owner; (3)
  `verify:rls` includes tamper tests. Registers are append-only — mirrors AGENTS.md.
- **Signed medical consent evidence:** the *bytes* (signed PDF) never live in the database
  (AGENTS.md "Never commit PDFs/personal data") — Storage holds the object, `consent_records` /
  `clinical.consent_signatures` hold `policy_version`, `policy_text_hash` (sha256 of exact wording),
  `signature_hash`, `signed_at`, `source`. That tuple is what proves who agreed to what text,
  without keeping a readable document in a row. Withdrawal = new `withdrawn` row; the granted row
  stays.
- **Staff directory audit:** every `client_profiles` SELECT by staff logs
  `audit_log(action='directory_view', target_id, actor)` via a policy-side `SECURITY DEFINER`
  logging function in the read path — S18 acceptance ("access audited") with no app-code trust.
- **Retention schedule (per record class):** T1 booking history — 6 years (aligned to UK financial
  record practice, confirm with owner); consent evidence — lifetime of client relationship + legal
  retention; notifications — 12 months; audit log — 24 months, then archive & pseudonymise actor
  ids. No silent purge of anything clinically or financially relevant.

## 6. GDPR / data-deletion workflow (rights vs records)

`deletion_requests` drives a **pseudonymise, don't annihilate** pipeline (owner-executed, S11 —
"no silent delete"):

1. Client taps "Request data deletion" → row created; Owner notified.
2. Owner review window (policy text pending — Q03/privacy legal position); consent marketing flags
   withdrawn first (new `consent_records` rows, R08).
3. Pipeline (Edge Function, service role, steps individually audited to `audit_log`):
   - `auth.admin.deleteUser()` → removes email/password/OTP identity (Supabase-managed PII).
   - `client_profiles`: name → `'Deleted client'`, `phone_e164/raw` → NULL,
     `pseudonymised_at = now()`.
   - `booking_requests` / `appointments` / `enquiries`: `client_user_id → NULL` **is avoided** —
     FKs are RESTRICT while rows live; instead rows keep the (now meaningless) uuid and all
     *readable* PII comes only from `client_name_snapshot`-style columns which are set to
     `'Former client'`. `notes_client` and `enquiry_messages.body` for that user are **redacted**
     (`'[redacted — deletion request]'`) because T2 free text is the actual personal content.
   - `notification_tokens` hard-deleted (useless without identity); `consent_records` retained
     (Art. 6(1)(f)/6(1)(c) evidence obligation — hash contains no PII anyway); `reminders`,
     `update_reads` deleted.
4. Status `completed`; `retained_for` marker on financial/clinical rows:
   `legal_obligation | claims_defence` so a future auditor can see *why* a shell row exists.

This keeps the clinic's books and course/pack history intact (no broken FKs, no vanished takings)
while removing what identifies the person — the balance Art. 17 actually requires. Multi-year HMRC
style retention for paid packages (if Q10 ever turns on payments) is handled by the same
`retained_for` marker.
