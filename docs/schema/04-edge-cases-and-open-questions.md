# 04 — Edge Cases, Resolved Contradictions & Open Context

## 1. Contradiction ledger — resolved against the live site (26 Oct 2026 fetches)

Per the evidence rule (website > repo docs), the items previously flagged as contradictions are now
**closed or reclassified**. V1's counting error is a known bad source, not an open question; V2's
audit prompts have been executed.

| # | Was | Now | Basis |
|---|---|---|---|
| 1.1 | Health fields on web form vs none in app (D05/R04) | **RESOLVED — no conflict.** `/book/` marks its health fields **optional** ("You can leave them blank and discuss relevant information directly with the clinic before treatment. Your skin type is assessed at consultation"), and `/faqs/` confirms history + skin assessment happen at the free consultation. Deferring screening to the in-person consultation (D05, v1 default) *matches the website's own fallback workflow*. Residual risk stays as edge case E3 (free-text disclosure), not a contradiction. Caveat: the `/book/` form is JS-rendered, so the field copy is quoted from the V2 walkthrough + owner statement rather than a static re-fetch — re-confirm manually. | /faqs/ verified 26 Oct; V2 §8 |
| 1.2 | "Packages sold but not modellable" | **RESOLVED as data.** `/faqs/` verifies: six-session courses at 20% off most treatments ⇒ `course_packages.sessions_count = 6`, `discount_percent = 20` seeded as catalogue facts; interest-free 3-instalment plans on £500+ are arranged at consultation ⇒ **no payment columns; in-app payments stay parked** per 08-scope/Q10. Remaining unknown is lifecycle (expiry/transfer/refund) → E4/Q16. Note for owner (copy, not schema): homepage FAQ still says "six or eight sessions" while `/faqs/` says "six … 20 per cent" — same offer, looser wording. | /faqs/ verified 26 Oct |
| 1.3 | Catalogue counts 8 / 22 / 31 vs 32 | **RESOLVED.** V1 mixed `/book/` dropdown options with `/treatments/` directory cards. Verified 26 Oct: 8 core priced (`is_featured`), 22 detail pages (`has_detail_page`), 31 directory cards (`show_in_directory`: 22 detail + 9 consultation-only — HIFU face lift, HIFU body sculpting, HydraFacial, RF skin tightening, EMS body sculpting, Cellulite reduction, Skin tag removal, Scar revision, Skin brightening). 24 dropdown items (`show_in_booking_dropdown`) is **asserted but JS-gated** — Engine A treats the 24-count as advisory until manually confirmed; still needs the client's master text/price export for the 23 non-core rows (that half of Q09 remains). | /treatments/, /faqs/, homepage fetches |
| 1.4 | Opening hours 9am vs 10am | **CLOSED — contradiction retired.** Every live page checked (`/`, `/treatments/`, `/book/`, `/faqs/`, `/areas-served/`) states Monday–Sunday 10:00–18:00; the 9am report appears nowhere on the current site. Seed 10:00–18:00 as **verified truth** (Engine A asserts). `opening_hours.valid_from` versioning remains for future edits (S17), not because today is disputed. | 22 + 26 Oct fetches |
| 1.5 | Authority of M01 | **STILL OPEN (governance, not schema)** — owner + 2 staff seats rest on the employee's message; Q01. Seat cap is a settings value (demo default 2). | 00-source-inventory |
| 1.6 | AsyncStorage vs S02 secure-storage acceptance | **STILL OPEN (implementation, not schema)** — fix in M1 hardening; nothing in this schema depends on it, but 03's T3 ambitions do. | code vs stories |

## 2. Critical edge cases (with demo defaults applied — none block seeding)

**E1 — Mandatory waiting period between laser sessions.**
Verified: tattoo removal "six weeks apart" ⇒ seeded `min_gap_days = 42`. Hair-removal intervals are
area-dependent and numerically unpublished. Demo default: `warn_session_gap` trigger **warns staff,
never blocks** (audit row `session_gap_warning` proves the warn fired). Body-area granularity is not
invented — one treatment row per site service, areas as pricing copy until the owner rules.
→ question Q13 (intervals per treatment/area).

**E2 — Patch-test failure / adverse reaction.**
`/faqs/` sharpens the flow: patch test usually done at the consultation, 24–48 h delayed-reaction
wait, then first full session. v1 stores the *scheduling* facts only (PATCH_TEST appointment status);
there is deliberately nowhere to record "reaction" (D05) — staff handle suitability offline. If the
owner wants the client-facing signal, options are (b) binary `appointments.outcome CLEARED |
DEFERRED` (borderline Art. 9) or (c) `clinical.*` under Q03(b). → Q03 + Q14.

**E3 — Health disclosure in free text.**
`notes_client` and `enquiry_messages.body` will attract medical disclosures even though the app never
asks (site's own form has the same exposure and solved it by marking fields optional — see 1.1).
Demo default: steering placeholder copy ("please don't include medical details — we discuss these at
your free consultation") + T2 tier + deletion-pipeline redaction (03 §6). → Q15 (warning copy vs
structured "ask at consultation" chips).

**E4 — Course rollover, expiry, transfer, refund.**
Verified that 6-session/20% courses exist and sell; **nothing published** about validity periods,
pauses, transfers or refunds. Demo default: `client_courses.expires_at IS NULL`, status managed by
staff, usage always computed from completed appointments so a paused course resumes cleanly and gap
warnings (E1) see real history. Transfer entity not invented. → Q16.

**E5 — Late cancellation / no-show, and the one-phone problem.**
(i) Statuses `CANCEL_REQUESTED / RESCHEDULE_REQUESTED / NO_SHOW` + `appointment_events` record every
request and outcome; no penalty is enforced because Q05 has no answer — a policy arriving later is a
`clinic_settings` row + transition-window trigger, not a redesign. (ii) Signup: phone uniqueness is
**demo-defaulted to OTP-verified numbers only** (unverified duplicates allowed and flagged) because
walk-in households (W05) would otherwise be rejected by a hard unique index. → Q17.

**E6 — Age limits are now published facts.**
`/faqs/`: "We don't treat … under 16 (under 18 for some treatments)". Nothing in v1 can check age
because DOB is not collected (Q02). Until Q02 answers, the app's treatment pages must carry the same
age wording (content, not constraint). If the owner wants enforcement, DOB + an age-check rule
becomes a migration with a stated reason — this makes Q02 more urgent than Q13.

## 3. Open questions — moved to `docs/decisions/01-client-questions-for-owner.md`

Batch 1 (Q01–Q12) stays in `docs/progress/07-questions-for-client.md` unedited (append-only
register). Batch-2 questions raised by this schema work — **Q13** intervals/areas, **Q14** patch-test
outcome visibility, **Q15** free-text health policy, **Q16** course lifecycle, **Q17** phone
uniqueness, **Q18** DOB/age verification (now backed by published age rules, E6) — are written in
plain owner-facing English in `decisions/01` and appended to the register only once the batching is
accepted. Every one has a non-blocking demo default (`decisions/02`) so schema creation and seeding
proceed regardless.

## 4. What this proposal deliberately does NOT contain

Payment/`invoices`/instalment tables (Q10 — £500 plans are in-person); live `slots`/`availability`
(Q04/D03/R02); `reviews` beyond the three verified site testimonials (W07); `areas` sub-entities
(Q13 — pricing copy for now); `progress_media`/`clinical.*` applied (Q03); multi-clinic beyond
`clinic_id` (08-scope); loyalty/referral/AI-advice entities (zero evidence — AGENTS.md "Never
invent"). Each arrives, if ever, with a D## decision and a source, exactly like everything above.
