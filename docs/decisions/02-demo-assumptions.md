# 02 — Demo Assumptions (developer reference)

Every assumption below is an active schema/app default while owner answers are pending. None is
presented to users as clinic policy. Source question numbers reference
`docs/decisions/01-client-questions-for-owner.md` (plain-English) and
`docs/progress/07-questions-for-client.md` (register Batch 1).

| # | Area | Demo default | Implementation | Revisit |
|---|---|---|---|---|
| DA-01 | Privileged seats | owner + **2** staff, hard cap | `clinic_settings.staff_seat_max = 2`; trigger `assert_staff_seat_cap` rejects the 3rd active staff grant | Q01 / owner Q1 |
| DA-02 | Booking model | request → staff confirm, 1 working-day callback copy verbatim from site; **no live slots** | `booking_requests` state machine `PENDING → CONFIRMED/DECLINED/RESCHEDULED/CANCELLED` (R02) | Q04 / owner Q3 |
| DA-03 | Preferred time granularity | day + `MORNING / AFTERNOON / EVENING` band | `preferred_time_band` enum | Q04 |
| DA-04 | Consultation + patch test chain | `CONSULTATION`, `PATCH_TEST`, `SESSION` appointment types; patch test may share consultation day (`/faqs/`) | `appointments.type`; `treatments.requires_patch_test = true` (R03) | — |
| DA-05 | Session-gap rule | tattoo: `min_gap_days = 42` (published). Everything else NULL | soft trigger `warn_session_gap` → `audit_log(action='session_gap_warning')`; **warns, never blocks** | Q13 / owner Q5 |
| DA-06 | Patch-test prerequisite | soft: booking a `SESSION` without a completed `PATCH_TEST` logs `patch_test_warning` + Postgres WARNING; no hard block (staff judgement) | trigger `warn_session_without_patch_test` | Q14 / owner Q8 |
| DA-07 | Cancellations | request-only flow; statuses `CANCEL_REQUESTED` / `RESCHEDULE_REQUESTED`; **no fees, no strikes, no blocking** enforced | statuses + `appointment_events` only | Q05 / owner Q4 |
| DA-08 | Reminders | push channel, **24 h before**, confirmed appointments only, opt-in per booking; SMS off | `clinic_settings.reminder_lead = '24h'`; `reminders.channel` seeds `PUSH` only | Q07 / owner Q6 |
| DA-09 | Reminder preview copy | generic: "An update from Unique Laser Clinics — open the app to view." — treatment names physically rejected | guard trigger `assert_r06_generic_copy` on `notifications` (R06) | — |
| DA-10 | Health data | **not collected in-app** (matches site's optional-field + consultation-assess fallback); free-text boxes carry steering copy only | zero health columns in `public`; `clinical` schema not created | Q03 / owner Q7 |
| DA-11 | Sign-up fields | first name, last name, email, mobile (E.164 + raw). No DOB/address yet | `client_profiles` | Q02, Q18 / owner Q10, Q13, Q14 |
| DA-12 | Phone uniqueness | enforced **only on OTP-verified** numbers, excluding pseudonymised rows; unverified duplicates allowed and flagged to staff | partial unique index (02 A3) | Q17 / owner Q13 |
| DA-13 | Opening hours | seeded Mon–Sun **10:00–18:00** — verified across five live pages 26 Oct (no longer disputed) | `opening_hours` rows, `valid_from` versioning kept | — |
| DA-14 | Catalogue seed | 8 core priced (`is_featured`, £35–£120 → 3500–12000 pence, `FROM_PRICE`); 22 `has_detail_page`; 31 `show_in_directory`; 24 `show_in_booking_dropdown` **advisory** (JS-rendered — manual re-check before demo) | `treatments` flags; Engine A asserts 8/22/31 strictly, 24 as warning-not-fail | Q09 |
| DA-15 | Package data | `sessions_count = 6`, `discount_percent = 20` (verified `/faqs/`); package `price_pence` NULL (no published absolute); homepage "six or eight" wording queried with owner | `course_packages` seed | owner Q11/Q12 |
| DA-16 | Course lifecycle | `expires_at IS NULL`, status staff-managed, usage computed from completed appointments; no transfers, no refunds, no payments | `client_courses` | Q16 / owner Q11 |
| DA-17 | GDPR deletion | pseudonymise-not-destroy pipeline behind owner queue; no silent deletes; tokens hard-deleted, consents retained as evidence | `deletion_requests` + pipeline (03 §6) | Q03 |
| DA-18 | Money & spelling | integer pence everywhere (`*_pence`); UK spelling in copy and docs | R05/R09; Engine B scan | — |
| DA-19 | Demo auth shortcuts | email/password real; phone OTP and server push simulated locally for demo (D-F1/D-F4) — schema unchanged | see `docs/demo/01-demo-scope.md` | M1 |
| DA-20 | Verification data hygiene | test-suite rows tagged with `run_id`; `app.purge_verification_data(run_id)` is the only path allowed past append-only guards, service-role only | 02 D5, 05 §4 | — |

When an owner answer arrives: change the setting/migration, append a D## row to
`05-decision-log.md`, and mark the matching row in `docs/schema-coaching/03-schema-status.md`
`FIXED` — never edit the history of either file.
