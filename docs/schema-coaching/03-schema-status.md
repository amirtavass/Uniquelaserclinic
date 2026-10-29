# 03 — Schema Status Register (append-only)

Rule: rows are **never edited or removed** — a later session appends a new row for the same story/rule
with the updated status; the newest row per ID is the current view. Check IDs (`A-01`, `P-03`, `R-05`,
`B-*`) are defined in `docs/schema/05-verification-plan.md` and printed by `npm run verify` /
`npm run verify:rls`.

## Status definitions

- `UNTESTED` — the schema objects exist in the design; no executed check yet. Includes "cannot run yet
  because the schema is not applied" (as of 26 Oct the database returns `PGRST205` on `treatments` —
  schema.sql/rls.sql/introspection.sql are not applied).
- `PASS` / `FAIL` — an executed check succeeded / failed, with check IDs as evidence.
- `FIXED` — previously FAIL; a new row below records the fix + re-check.
- `BLOCKED` — cannot be *designed or decided*, not merely unexecuted: needs an owner/policy answer.
  Every BLOCKED row names the question in `docs/decisions/01-client-questions-for-owner.md` (owner Q#)
  and its non-blocking demo default in `docs/decisions/02-demo-assumptions.md` (DA-#). A demo default
  present means the *story* returns to UNTESTED; only the *policy variant* stays BLOCKED (noted inline).

| Date | Story / Rule | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-10-26 | S01 | UNTESTED | plan: P-01, P-02 | fields frozen pending owner Q14 ("full info" = Q02); DOB deliberately absent (owner Q10 raises urgency) |
| 2026-10-26 | S02 | UNTESTED | plan: P-01 | auth via Supabase; secure-storage deviation open (04 §1.6) — M1 fix, schema-neutral |
| 2026-10-26 | S03 | UNTESTED | plan: A-01…A-05, A-10, R-03 | counts 8/22/31 verified on live site 26 Oct; 24 dropdown = WARN-only until manual check (A-04, DA-14) |
| 2026-10-26 | S04 | UNTESTED | plan: A-07, A-08 | missing prices/sessions render "Discussed at consultation", never invented |
| 2026-10-26 | S05 | UNTESTED | plan: P-03, A-10 | bands not slots (Q04); ADVISE_ME + CONSULTATION kinds cover site options |
| 2026-10-26 | S06 | UNTESTED | plan: P-04, P-05 | chain types exist; enforcement soft per DA-06 |
| 2026-10-26 | S07 | UNTESTED | plan: P-07, A-09 | push + 24 h default (DA-08, owner Q6); **SMS variant BLOCKED** (owner Q6 — demo default doesn't decide channel mix) |
| 2026-10-26 | S08 | UNTESTED | plan: P-08, R-03 | "updates" scope draft-as-announcements (Q06, owner Q… feed content question) |
| 2026-10-26 | S09 | UNTESTED | plan: P-09 | email mirroring BLOCKED (Q08) — not schema-affecting |
| 2026-10-26 | S10 | UNTESTED | plan: P-10 | request-only flow ships (DA-07); **penalties/notice-window BLOCKED** (owner Q4 / Q05) |
| 2026-10-26 | S11 | UNTESTED | plan: P-14 | pseudonymise pipeline designed (03-sec §6); legal retention text BLOCKED on owner Q7 data position — demo runs owner-queue workflow |
| 2026-10-26 | S12 | UNTESTED | plan: P-04, R-04, R-06 | confirm → chain create; column-restricted staff UPDATE |
| 2026-10-26 | S13 | UNTESTED | plan: P-09 | reply flip OPEN→ANSWERED by trigger |
| 2026-10-26 | S14 | UNTESTED | plan: P-08 | auto-revision on edit; unpublish keeps history |
| 2026-10-26 | S15 | UNTESTED | plan: P-10 | staff resolve path |
| 2026-10-26 | S16 | UNTESTED | plan: P-11 | 2-seat cap is demo default DA-01; **seat count BLOCKED** (owner Q1 / Q01 sign-off) |
| 2026-10-26 | S17 | UNTESTED | plan: P-12, P-15, A-06 | hours seed now VERIFIED truth (10–6); edit path in-app vs dashboard BLOCKED (Q09) — table-agnostic |
| 2026-10-26 | S18 | UNTESTED | plan: P-13 | read path via `app.search_clients` so audit is provable |
| 2026-10-26 | R01 | UNTESTED | plan: P-11 | owner+2 seats; no self-promotion |
| 2026-10-26 | R02 | UNTESTED | plan: P-03, A-04 note | no availability tables exist at all — verified by Engine B (no `slots` relation) |
| 2026-10-26 | R03 | UNTESTED | plan: P-04, P-05 | warning-level in demo (DA-06); hard-enforce variant BLOCKED (owner Q5/Q8 patch-test rules) |
| 2026-10-26 | R04 | UNTESTED | plan: B (`public_health_columns = []`) | design guarantee; **in-app collection variants (b)/(c) BLOCKED** (owner Q7 / Q03) |
| 2026-10-26 | R05 | UNTESTED | plan: A-01, A-07, P-03, P-12, B (`money_violations`) | integer pence + snapshots + append-only history |
| 2026-10-26 | R06 | UNTESTED | plan: A-09 | physical tripwire on `notifications`, not convention |
| 2026-10-26 | R07 | UNTESTED | plan: Engine R (R-01…R-06), B (`rls_missing`) | two real users, not UI hiding |
| 2026-10-26 | R08 | UNTESTED | plan: P-01, P-14, R-05 | versioned + text-hash consents; withdrawal as new row |
| 2026-10-26 | R09 | UNTESTED | plan: A-05 content spot-check | copy discipline (colour/centre) — content review, not SQL |
| 2026-10-26 | R10 | UNTESTED | n/a platform | EAS dev builds concern the app pipeline, tracked outside this register; schema is platform-neutral |
| 2026-10-26 | SUITE | BLOCKED | `checkConnection()` = "demo schema not applied yet" (PGRST205, live-tested 26 Oct) | **nothing above can move UNTESTED→PASS until `supabase/schema.sql`, `rls.sql`, `introspection.sql` + seed are applied**; harness itself now exists and fails gracefully |

## Open questions for the Client (Synced with decisions/)

Owner-facing plain-English list: `docs/decisions/01-client-questions-for-owner.md`. Register (technical
wording, Batch 1): `docs/progress/07-questions-for-client.md`. Currently policy-BLOCKED above:
owner Q1 (seats), Q3 (diary truth), Q4 (cancellation policy), Q5 (session intervals/areas), Q6
(reminder channel/timing), Q7 (health-data position), Q8 (patch-test outcome visibility), Q9 (notes
policy), Q10 (DOB/age check), Q11 (course lifecycle), Q12 (payments), Q13 (phone uniqueness),
Q14 (sign-up fields). Non-technical copy check: homepage "six or eight sessions" vs `/faqs/` "six at
20 per cent off". Manual check owed: `/book/` dropdown item count (JS-rendered; DA-14).

## Fixed this session

| Date | Item | What was fixed |
|---|---|---|
| 2026-10-26 | Docs P2-1 | Enum labels standardised to story casing (UPPERCASE statuses/types; lowercase `owner/staff/client` roles only, per R01) across `docs/schema/01`, `02`, `03`; `cancelled_requested` → `CANCEL_REQUESTED`; contract now enforced by check A-10 + Engine B `enum_label_violations` |
| 2026-10-26 | Docs P2-2 | `01-user-stories.md` S17 shorthand `price_history` → `treatment_price_history` (consistent with S03/02 B4) |
| 2026-10-26 | Contradictions 1.1–1.4 | Closed against live site (hours 10–6 verified 5 pages; catalogue 8/22/31 + flags; packages 6 @ 20% verified; web health fields optional ⇒ D05 matches site fallback). 1.3's residue (master text export) stays Q09 |
| 2026-10-26 | Trigger testability | Soft-warning triggers now also write `audit_log` rows (`patch_test_warning`, `session_gap_warning`) — Postgres WARNINGs don't cross REST, so without this P-05/P-06 were unverifiable |
| 2026-10-26 | S18 auditability | Directory reads routed through `app.search_clients` RPC (Postgres has no SELECT triggers — previous "policy-side logging on SELECT" wording was not implementable) |
| 2026-10-26 | Append-only vs cleanup | Added `app.purge_verification_data(run_id)` GUC-gated maintenance seam (02 D5) so guard triggers can't deadlock test cleanup or FK cascades |
| 2026-10-26 | Harness | `services/verify-schema.ts` + `supabase/introspection.sql` created; `npm run verify` / `verify:rls` wired in `package.json` |


---

## Session 2 � 2026-10-26 (Stages 4�5: SQL + seed + query pack + ADRs, static trace only)

| Date | Story / Rule | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-10-26 | SUITE | BLOCKED | `npm run seed` ? PGRST205 `public.clinics` (expected, pre-apply); `npm run verify` ? 35 BLOCKED / 0 FAIL, exit 1; `npm run typecheck` clean | **Files created:** `supabase/schema.sql` (29 tables, 22 enums, 14 triggers, 6 RPCs), `supabase/rls.sql` (RLS on 100% + privilege walls), `supabase/README.md` apply runbook, `services/seed.ts` + `services/seed-contract.json` (self-check passed: 8/22/31/8-seeded, advisory 24), `docs/schema-coaching/02-query-pack.md`, `04-metrics-and-evidence.md`, `templates/ADR.md`, ADR-003�006, `08-pressure-test.md`. Cannot apply from this environment: no Dashboard/CLI DDL credential present (service key cannot run SQL � ADR-006). All 35 rows above stay UNTESTED until operator runs `supabase/README.md` (Option A/B), then re-verify to move them to PASS |
| 2026-10-26 | 15-item pressure test | PASS (static) | `docs/schema-coaching/08-pressure-test.md` � real site items traced to fields/triggers | Gate 5 evidence; live re-run owed after apply |
| 2026-10-26 | A-04 deviation | BLOCKED?advisory | Operator claim "24 static `<option>` in /book/ HTML" did **not** reproduce: raw fetch 26 Oct = 0 `<option>` elements (JS-rendered form) | Logged per "report deviations, never silently fix"; seed dropdown=8, WARN kept (DA-14). Manual browser check owed before demo |
| 2026-10-26 | S02 / contradiction 1.6 | FIXED (design) | `lib/supabase.ts` now persists tokens via `expo-secure-store` (Keychain/Keystore) with AsyncStorage fallback on web; `lib/auth.ts` + `lib/db.ts` seams created | Device-level confirmation during M1 build |

---

## Session 3 — 2026-10-27 (Option B apply + live verification)

Applied `supabase/schema.sql` → `rls.sql` → `introspection.sql` via the Supabase Management API
(Dashboard PAT supplied by the operator; token not committed), then `npm run seed`. The live suite is
green: `npm run verify` = **35 PASS · 0 FAIL · 1 WARN (A-04) · 0 BLOCKED**; `npm run verify:rls` =
7 PASS; `npm run typecheck` clean. Test personas were purged; the DB holds seeded content only
(31 treatments, 7 opening-hours rows, 8 course packages).

| Date | Story / Rule | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-10-27 | S01 | PASS | P-01, P-02 | profile + consent insert; verified-phone uniqueness holds |
| 2026-10-27 | S02 | PASS | P-01 | secure-store adapter already in place; device-level confirmation still owed at M1 |
| 2026-10-27 | S03 | PASS | A-01–A-05, A-10, R-03 | A-04 remains WARN (8 vs 24 advisory); manual `/book/` browser check owed |
| 2026-10-27 | S04 | PASS | A-07, A-08 | NULL prices/sessions render "Discussed at consultation", not invented |
| 2026-10-27 | S05 | PASS | P-03, A-10 | PENDING forced server-side; snapshot + idempotency proven |
| 2026-10-27 | S06 | PASS | P-04, P-05 | 3-row CONSULTATION → PATCH_TEST → SESSION chain; soft warning audited |
| 2026-10-27 | S07 | PASS | P-07, A-09 | push demo default works; SMS channel mix still BLOCKED (owner Q6) |
| 2026-10-27 | S08 | PASS | P-08, R-03 | draft hidden from client/anon; edit appends revision |
| 2026-10-27 | S09 | PASS | P-09 | schema reply flip works; email mirroring still BLOCKED (Q08), schema-neutral |
| 2026-10-27 | S10 | PASS | P-10 | request-only flow; penalties/notice window still BLOCKED (Q4/Q05) |
| 2026-10-27 | S11 | PASS | P-14 | pseudonymise pipeline proven; legal retention wording still BLOCKED (Q7) |
| 2026-10-27 | S12 | PASS | P-04, R-04, R-06 | confirm → chain; column-restricted staff UPDATE enforced |
| 2026-10-27 | S13 | PASS | P-09 | staff reply flips OPEN → ANSWERED |
| 2026-10-27 | S14 | PASS | P-08 | auto-revision on body edit |
| 2026-10-27 | S15 | PASS | P-10 | staff resolve path (status + event row) |
| 2026-10-27 | S16 | PASS | P-11 | 2-seat demo cap (DA-01); seat count still BLOCKED (Q1) |
| 2026-10-27 | S17 | PASS | P-12, P-15, A-06 | price history + hours versioning; edit path still BLOCKED (Q9) |
| 2026-10-27 | S18 | PASS | P-13 | audited directory RPC |
| 2026-10-27 | R01 | PASS | P-11 | owner + 2 seats; no self-promotion |
| 2026-10-27 | R02 | PASS | P-03, A-04 note | no availability tables; bands only (Q04 still open) |
| 2026-10-27 | R03 | PASS | P-04, P-05 | warning-level demo default (DA-06); hard-enforce variant BLOCKED (Q5/Q8) |
| 2026-10-27 | R04 | PASS | B `public_health_columns=[]`; clinical grants `[]` | in-app collection variants still BLOCKED (Q7/Q03) |
| 2026-10-27 | R05 | PASS | A-01, A-07, P-03, P-12, B `money_violations=[]` | integer pence + snapshots + append-only history |
| 2026-10-27 | R06 | PASS | A-09 | physical tripwire on notifications |
| 2026-10-27 | R07 | PASS | R-01–R-06, B `rls_missing=[]` | two real users, not UI hiding |
| 2026-10-27 | R08 | PASS | P-01, P-14, R-05 | versioned + text-hash consents; withdrawal = new row |
| 2026-10-27 | R09 | UNTESTED | manual copy review | not a SQL check; A-05 counts pass, copy still to review |
| 2026-10-27 | R10 | UNTESTED | n/a platform | EAS pipeline outside this schema register |
| 2026-10-27 | SUITE | PASS | `npm run verify` 35 PASS / 0 FAIL / 1 WARN / 0 BLOCKED; `npm run verify:rls` 7 PASS; `npm run typecheck` clean | Applied via Management API; seed loaded; verification personas/rows purged (0 auth users, 0 requests, 0 appointments) |

### Fixed this session (apply-run blockers)

| Item | What was fixed |
|---|---|
| Enum bootstrap | `schema.sql` replaced the invalid multi-target `FOREACH`/mixed `array[...]` block with a JSONB spec loop that emits `create type ... as enum (...)` |
| Event triggers | `app.log_request_event` / `app.log_appointment_event` no longer read `OLD` on INSERT; removed the impossible `appointment_status = 'RESCHEDULED'` CASE branch |
| Client status guard | `app.block_client_status_edit` is now `SECURITY DEFINER` (authenticated role had no `app` schema USAGE) |
| Deletion pipeline | Removed the write to non-existent `enquiries.retained_for` in `app.apply_deletion` |
| Append-only GUC | `apply_deletion` / `purge_verification_data` now call `set_config(..., true)`; function `SET` on the custom GUC was permission-denied |
| Introspection | `storage.buckets.name` corrected (was `bucket_name`); enum-label violations scoped to schema `public` only |
| RLS idempotency | Added the missing `drop policy if exists enq_select` in `rls.sql` |
| Harness | `countRows` uses `Prefer: count=exact` (not URL params); preflight prints the real probe error; P-02 selects `phone_e164`; B isolation rows use `ADVISE_ME` (CHECK requires a treatment unless `ADVISE_ME`); P-15 deletes its tomorrow row before/after so repeat runs don't collide |

## M1 smoke fixes (2026-10-28 — persona tokens hit live paths for the first time)

| Date | Story | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-10-28 | S06 dashboard RPC | FIXED | live POST /rpc/client_dashboard as priya → 42803 before, 200 + correct payload after | app.client_dashboard() had latent jsonb_agg + ORDER BY + LIMIT (non-grouped column); it had never executed under a persona token before the M1 smoke — ordering/limit moved into an inner subselect; payload contract unchanged |
| 2026-10-28 | S06/R07 wrapper grants | FIXED | 42501 "permission denied for schema app" under anon/authenticated before → 200 after | public.client_dashboard()/public.my_role() wrappers made SECURITY DEFINER (same pattern as search_clients); bodies remain auth.uid()-column-scoped; new my_role() wrapper added for 02-navigation role switching (schema.sql re-applied via Management API, HTTP 201) |
| 2026-10-28 | S18/staffQueue embed | FIXED | PGRST200 (no FK booking_requests→client_profiles) | seam now two-query attachProfiles() in lib/db.ts; RLS unchanged (staff-read on client_profiles proven by verify:rls 7/7) |
| 2026-10-28 | R01/DA-01 suite interaction | PASS (adapted) | verify re-run 35/0/1W after fix; clinic_settings value = 2 after runs | persistent demo seats occupy the tenant cap → engine A2 raises staff_seat_max to activeStaff+2 for its own run and restores it at CLEANUP; DA-01 shipped cap untouched; P-11 semantics intact |
| 2026-10-28 | S05 seed posture | PASS | seed:demo second run performs zero status patches | booking_requests confirmations must come from a staff-signed PATCH (force_request_pending + block_client_status_edit) — services/seed-demo.ts signs in as Sam to confirm the fixture request, producing a genuine audit event |
