# 04 — Edge Cases, Contradictions & Missing Context

## 1. Contradictions between sources (flagged, not reconciled silently)

| # | Contradiction | Evidence | Schema stance |
|---|---|---|---|
| 1.1 | **Health data on the web form vs none in the app.** The website booking form reportedly collects medical conditions, medications and pregnancy status (V2 §8, W-source-inventory "GDPR/health consent fields on the web form"), while D05/R04 forbid in-app collection. The same client will exist in two systems with different medical completeness — the app cannot tell staff "this client is medically cleared". | V2 vs D05 | v1 models only the *scheduling* fact (`appointments.type='patch_test'`, status) and never a clinical result. The gap is surfaced to staff as a hard-coded consultation step, not papered over with a checkbox. Blocked on Q03; `clinical.medical_screenings` is the shape if (b)/(c) chosen. |
| 1.2 | **Packages are sold but not modellable.** Site FAQ promises "discounted course packages of six or eight sessions" and the business depends on them, yet M01/demo scope excludes payments (Q10, D-F list). | W-FAQ vs M01/08-scope | Catalogue shape ships (`course_packages`, `client_courses`), prices stay NULL (never invent), purchase is staff-recorded offline. Fully dormant but zero-migration if Q10 changes. |
| 1.3 | **Catalogue size disagrees with itself.** Mega-menu = 22 links / 8 core priced treatments (W04, verified 22 Oct) vs the V1 extraction's 31 (with its own counts totalling 32). | W04 vs V2 §B | `published` + `content_verified` + `source_url` on `treatments` let us ship only the 8 verified rows now; the reconciliation needs the client's master export (Q09) — the schema must not guess which 14–24 links are duplicates vs missing. |
| 1.4 | **Opening hours.** Four site locations say 10:00–18:00 (W01) but V1 reported a 9am–6am variant somewhere. | W01 vs V1 | `opening_hours.valid_from` keeps both facts *possible*; v1 seeds 10–6 marked PROPOSED (D06). Owner confirms; a change is a new row, never an edit of history. |
| 1.5 | **Authority of M01 itself.** The whole role model (owner + exactly 2 staff) rests on an employee's message, not the owner's sign-off (Q01). | 00-source-inventory reading | `staff_seat_max` is a *setting* audited via `clinic_settings`, seeded 2 from M01 — if the owner says 3, it's a settings migration, not a redesign. |
| 1.6 | **Session security vs current implementation.** S02 acceptance: tokens in secure storage; `lib/supabase.ts` passes AsyncStorage to `createClient`. Not a schema bug, but the compliance section (03 §4) depends on it before any T3 exists. | 01-user-stories S02 vs code | Fix in M1 hardening; noted so nobody treats "RLS done" as "secure done". |

## 2. Critical edge cases

**E1 — Mandatory waiting period between laser sessions.**
Tattoo removal is published as "six weeks apart" (FAQ ⇒ `min_gap_days = 42`); hair-removal intervals
are area-dependent (face ~4 weeks, legs ~8–12) and **nothing on the site states them numerically**.
Schema accommodation: `treatments.min_gap_days` (NULL = no published rule ⇒ app cannot enforce) +
a confirm-time trigger on `appointments` that raises a warning when
`new.scheduled_start < last_completed_session + min_gap_days` for the same client/treatment.
The trigger *warns staff* (queue banner) rather than blocking, because clinic judgement overrides
(early due to regrowth patterns). **Need:** per-treatment (ideally per-area) minimum intervals from
the owner — proposed Batch-2 Q13. Also note: gaps are per treatment, and if two courses overlap on
the same body area the rule needs area-level granularity, which implies an `areas`/`treatment_areas`
dimension we have deliberately **not** invented (the site prices "full legs vs small areas" under one
treatment — Q13 covers whether areas become sub-entities or stay pricing flavour text).

**E2 — Patch-test failure / adverse reaction between test and first session.**
Flow: consultation → patch test 24–48 h before first session (W02/R03) → sometimes the skin reacts
and the course must not proceed. v1 can express "PATCH_TEST appointment COMPLETED" but **has nowhere
to store the outcome**, because outcomes are health data (D05). So today a failed patch test
materialises as staff declining/cancelling sessions by phone — invisible to the client's app except
as status change. Options ranked: (a) keep as-is, staff communicates offline (v1 default); (b) a
binary, minimised `appointments.outcome enum cleared|deferred` — borderline Art. 9, needs owner +
legal position; (c) proper `clinical.*` partition under Q03(b). **Need:** Q03 answer plus proposed
Q14 (how does the clinic want the client to *see* "patch test unsuitable — try different settings
later"?).

**E3 — Clients will write medical history into free text anyway.**
`booking_requests.notes_client` and `enquiry_messages.body` invite disclosures ("I'm pregnant",
"taking doxycycline"). Under D05 the app doesn't *collect* health data, but once typed, it *holds*
it — a contradiction of intent. Mitigations already in design: steering placeholder copy, the T2
tier in 03 §1, redaction in the deletion pipeline (03 §6), and staff-training note. **Need:** owner
decision Q15 — blocklist prompt ("please don't include medical details") vs routing health questions
into a "discuss at consultation" canned option (structured, not free text).

**E4 — Course/package session rollover, expiry and transfer.**
Real-world cases: client buys an 8-session hair-removal course, pauses for summer, wants to
transfer remaining sessions to a sibling, or the clinic closes for a month. Schema:
`client_courses.expires_at NULL-able` (validity unknown), usage computed (02 C5), transfer would
need `client_course_transfers` — **not** invented now because no evidence any exist. Late-session
validations (`min_gap_days`, E1) interact: a paused course resuming must not be blocked by its own
history. **Need:** Q10 expansion (proposed Q16) — expiry months? transfers? refunds? Until then
`client_courses` rows can exist with `expires_at IS NULL` and status managed by staff.

**E5 — Late cancellation, no-show and the one-phone problem.**
(i) No-show/late-cancel: `appointments.status (… | cancelled_requested | cancelled | no_show)` +
`appointment_events` give the clinic the full picture and make counting trivial
(`no_show_count` as a view, never a mutable column — no invented strike system). Penalties cannot be
modelled because the policy itself is unknown (Q05); when it arrives, it's a
`cancellation_policy` row in `clinic_settings` + an enforced transition window, not a redesign.
(ii) Signup: M01's unique-phone rule ("so we know who it is") collides with households sharing a
number (partner books from the same phone; clinic already takes walk-ins, W05). The partial unique
index on verified `phone_e164` (02 A3) would reject the second legit account with a confusing error.
**Need:** Q17 — is a UK mobile number unique-per-client a clinic rule or a convenience? (Default
recommendation: relax uniqueness to un-verified, keep verified unique; support "linked household"
later only if asked.)

## 3. Missing context — proposed Batch 2 questions

(These are *proposals only*; per append-only register discipline they go into
`docs/progress/07-questions-for-client.md` — becoming D## entries — once accepted.)

- **Q13** Per-treatment/area minimum session intervals (only "tattoo 6 weeks" is published — E1).
- **Q14** How should a failed patch test or "postpone the course" be surfaced to the client, given
  D05 bans storing outcomes in-app? (E2)
- **Q15** Free-text health disclosure policy in notes/enquiries: warning copy, structured routing,
  or staff redaction duty? (E3)
- **Q16** Course package lifecycle rules: validity period, rollover pauses, transfers, refunds? (E4)
- **Q17** Is a verified phone number strictly one-account-per-client, including households? (E5)

## 4. What this proposal deliberately does NOT contain

Payment/`invoices` tables (Q10); live `slots`/`availability` (Q04/D03); `reviews` beyond the three
verified site testimonials (W07 — displayed as seeded `updates`); `progress_media`/`clinical.*`
applied (Q03); multi-clinic beyond `clinic_id` (08-scope); loyalty/referral/AI-advice entities
(zero evidence — AGENTS.md "Never invent"). If any appear in a later version, they arrive with a D##
decision and a source, exactly like everything above.
