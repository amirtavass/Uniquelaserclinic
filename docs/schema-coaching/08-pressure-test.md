# 08 — Pressure Test (Stage 5, Gate 5)

Method: take **real items** from the client's website/M01 (verified fetches 22 & 26 Oct 2026), run
each through the schema by hand, and check the Stage-5 criteria: nothing forced into a wrong field,
nothing meaningful truncated, every item keeps its evidence, corrections have a home. Static trace
against `supabase/schema.sql` + `supabase/rls.sql` (applied run re-verifies via check IDs).

| # | Real item (source) | Path through the schema | Where it lands | Verdict |
|---|---|---|---|---|
| 1 | **Laser Hair Removal, "From £35 per session", six–eight sessions** (homepage W04) | anon SELECT via `treatments_read`; card renders from one row (no join needed — mobile §3) | `price_from_pence=3500`, `pricing_model=FROM_PRICE`, `is_featured/has_detail_page/show_in_directory/show_in_booking_dropdown=true`, `typical_sessions 6–8`, `source_url` | **PASS** — every published fact has its own field; concern "Unwanted hair" joins via `treatment_concern_links`, not squeezed into `category_id`. |
| 2 | **Laser Tattoo Removal, £60, "six to ten sessions spaced six weeks apart"** (W04 FAQ) | Staff books next session at +14 d → `warn_session_gap` (min_gap_days=42) → **inserts `audit_log(session_gap_warning)`, allows the booking** | `treatments.min_gap_days=42`; warning visible on staff queue via audit row; appointment stays `SCHEDULED` | **PASS** — clinic judgement preserved (DA-05), yet the deviation is on record. Check P-06. |
| 3 | **Carbon Laser Peel, "one 30-minute session"** (homepage) | duration seeded; sessions 1–1; 30-min booking flows to `appointments.duration_minutes` | `duration_minutes=30`, `typical_sessions_min/max=1/1` | **PASS** — the only per-treatment duration the site states numerically; others stay NULL + "discussed at consultation", not invented. |
| 4 | **HydraFacial — directory card without a detail page** (26 Oct `/treatments/`, 9th consult-only card) | `slug=hydrafacial`, `has_detail_page=false`, `show_in_directory=true`, `price=NULL ⇒ PRICE_ON_CONSULTATION` (CHECK-coerced label) | Directory shows it with "Price on consultation"; booking widget treats it as `request_kind=TREATMENT` | **PASS** — the 22-vs-31 reconciliation (04 §1.3) lives in flags, no phantom detail URLs. |
| 5 | **"I'm not sure yet, advise me"** (W03 book widget) | `request_kind=ADVISE_ME`, `treatment_id=NULL` (CHECK allows only for ADVISE_ME); snapshot trigger leaves name/price NULL | Staff queue row labelled "Advise me"; confirm can attach treatment later in `appointments` | **PASS** — the site's escape hatch is a first-class enum value, not a fake treatment row. |
| 6 | **Free consultation → patch test → first full session** (W02 + `/faqs/` "patch test on the day, 24–48 h wait") | Staff confirm creates 3 `appointments` rows (`CONSULTATION`, `PATCH_TEST`, `SESSION`) sharing `request_id`; status transitions auto-log to `appointment_events` | Chain auditable; P-05 confirms SESSION-without-COMPLETED-PATCH_TEST warns without blocking | **PASS** — chain is data (R03); same-day consult+patch = two rows, one day. |
| 7 | **"course packages of six sessions at 20 per cent off most treatments"** (26 Oct `/faqs/`) | `course_packages` 8 rows `sessions_count=6, discount_percent=20, price_pence=NULL`; a sold course = `client_courses` (`expires_at=NULL` DA-16); usage `count(appointments where course_id and status=COMPLETED)` | No stored usage column; £500+ instalment plan stays in-person (no payment columns) | **PASS** — verified numbers seeded; unverified numbers absent (R05/never-invent). Check A-08. |
| 8 | **Client types "I take doxycycline" in booking notes** (T2 risk, E3) | Stored verbatim in `booking_requests.notes_client` (raw text preserved — kickoff rule); RLS: staff sees; client B sees nothing; deletion pipeline redacts to `[redacted — deletion request]` | Classified T2 (docs/schema/03 §1); steering placeholder (DA-10/Q15 pending) | **PASS** — we don't *ask* health questions (D05 intact), we don't pretend the free text is clean, and correction/removal has a home (redaction + events trail). |
| 9 | **Reception looks up "Sarah M." on the phone** (S18, M01 "so we know who it is") | `search_clients('Sarah')` RPC → `app.is_staff()` check → `audit_log(directory_view)` → 50-row-capped match | Every lookup logged with actor + query; staff-only via code, not UI | **PASS** — audited read path exists and fails closed for clients (42501). Check P-13. |
| 10 | **Owner hires a third staff member** (M01: 2 seats) | `user_roles` INSERT by owner token → `assert_staff_seat_cap`: active staff (2) ≥ `staff_seat_max` (2) ⇒ exception | Third grant rejected; two seats granted fine; all grants/revokes audited | **PASS** with caveat — M01 is still STATED-not-signed (Q01); the cap is a setting, so the owner's real number is one edit + audit row. Check P-11. |
| 11 | **Owner raises hair removal "from £35" to £40** (S17) | staff PATCH `treatments.price_from_pence` → `append_price_history` + `audit_log(price_edited)`; old PENDING requests keep `price_from_pence_snapshot=3500` | History append-only; request display immune to later edits (R05) | **PASS** — correction home = new history row; nothing overwritten. Check P-12. |
| 12 | **Christmas Day closed; "Open every day" otherwise** (W01 + real UK holiday) | `opening_hours_overrides(day='2026-12-25', is_open=false, reason='Bank holiday')`; base `opening_hours` rows untouched (10:00–18:00 verified seed) | Widget reads override-first then current-valid row; hours history via `valid_from` | **PASS** — the exception doesn't mutate the rule (P-15 pattern). |
| 13 | **Client requests data deletion** (S11, UK GDPR) | `deletion_requests(REQUESTED)` → owner `apply_deletion`: profile pseudonymised, notes/messages redacted, tokens/reminders deleted, **appointments + consent shells kept** with `retained_for` | Pipeline steps audited; Art. 17 satisfied at the identity layer, Art. 6 evidence survives (ADR-005) | **PASS** — check P-14 asserts both halves (PII gone, records intact). |
| 14 | **Reminder push: "Your Laser Hair Removal session is confirmed"** (the forbidden copy) | `notifications` insert → `assert_r06_generic_copy` matches live `treatments.name` → `P0001` before insert; allowed body = generic R06 sentence | Physical tripwire, not a lint — a bad Edge Function literally cannot write it | **PASS**. Check A-09. |
| 15 | **Enquiry: "how many sessions will I need?" → staff replies** (M01 "ask for enquiries"; answer text real: hair 6–8 at consultation, W04) | `enquiries(OPEN)` + client message; staff reply → `flip_enquiry_answered` → `ANSWERED`; client counter-reply flips back `OPEN`; close = staff `CLOSED` | Thread append-only (no edits — corrections are new messages); A/B isolation proven by R-01 | **PASS**. Check P-09. |

## Stage-5 criteria — item-by-item audit

- **Nothing forced into the wrong field:** flagged (1.3/DA-14) only for the `show_in_booking_dropdown`
  composition (seeded 8; live 24 unconfirmable — WARN by design), and the homepage "six or eight"
  wording vs `/faqs/` "six at 20 per cent" (owner question, DA-15).
- **Nothing meaningful truncated:** durations for per-area treatments intentionally stay prose;
  `typical_sessions` only where the site publishes it.
- **Every item keeps its evidence:** `source_url` + `content_verified` on every seeded treatment;
  settings carry verbatim site copy (`booking_callback_promise`).
- **Corrections have a home:** price history, update revisions, message append, event tables,
  hours `valid_from`, override rows — five distinct correction mechanisms, all append-only.

## Deviations recorded at run time (never silently fixed)

1. Operator statement (26 Oct) that `/book/` renders **24 static `<option>`s** did not reproduce:
   raw fetch of `https://uniquelaserclinics.co.uk/book/` returned **0** `<option>` elements
   (form is JS-rendered; the page's own copy asks users to enable JavaScript). Dropdown count
   remains advisory/WARN until a browser-rendered check confirms it — see `supabase/README.md`,
   DA-14, seed-contract `_deviation`.
2. `docs/schema-coaching/08-pressure-test.md` reuses number 08 alongside existing
   `08-scope-and-demo-slice.md` per explicit instruction; noted for the index.

## Gate 5 conclusion

Schema answers all 15 real items with correct fields, evidence and correction paths; no blocking
internal contradictions remain (policy-variant questions are parked with defaults). **Schema v1 is
ready to lock the moment `schema.sql + rls.sql + introspection.sql + seed` verify green**
(apply runbook: `supabase/README.md`). Per instruction, STOP here — no Stage 6/UI work.
