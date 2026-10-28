# PROGRESS.md

**Current stage:** Gates 1–3 provisionally signed for demo (DA-01…DA-20) → **Stage 4 + 5 complete
(papers) → schema v1 APPLIED + SEEDED 27 Oct 2026.** Live suite: **35 PASS · 0 FAIL · 1 WARN
(A-04) · 0 BLOCKED**; `verify:rls` 7 PASS; `typecheck` clean. Gate 5 lock ready once A-04 browser
check and owner answers land.
**Updated:** 2026-10-27 (session 5).

| Milestone | Status | Notes |
|---|---|---|
| Demo scaffold | DONE | Expo 57 + TS + Router + Supabase client; `expo-doctor` 21/21; Android bundle exports |
| Supabase access | VERIFIED | Project reachable, keys valid; schema + RLS + introspection applied 27 Oct (Management API, Option B); seed loaded |
| Stage 0 — Evidence intake | DONE | `docs/product/00-source-inventory.md`; site re-verified 26 Oct (hours, catalogue, packages, optional health fields) |
| Stage 1 — Questions | Batch 1 sent; Batch 2 in plain English | `docs/progress/07-questions-for-client.md` + `docs/decisions/01-client-questions-for-owner.md` |
| User stories + rules | DRAFT (provisional demo sign-off) | S01–S18, R01–R10; enum-casing contract standardised |
| Schema proposal | DONE | `docs/schema/01–05` |
| **Stage 4 — schema.sql / rls.sql / query pack / seed** | **APPLIED + SEEDED (27 Oct 2026)** | `supabase/{schema,rls,introspection}.sql` applied via Management API (Option B), then `npm run seed`; `services/{seed,verify-schema}.ts`, `seed-contract.json`; ADR-003…006; metrics `04`; query pack `02` |
| **Stage 5 — Pressure test** | **DONE (static + live suite)** | `docs/schema-coaching/08-pressure-test.md`; live re-run: 35 PASS / 0 FAIL / 1 WARN (A-04) / 0 BLOCKED |
| Verification harness | DONE (live) | `npm run verify`: 35 PASS / 0 FAIL / 1 WARN (A-04) / 0 BLOCKED; `npm run verify:rls`: 7 PASS |
| S02 session storage | FIXED | `expo-secure-store` adapter in `lib/supabase.ts`; seams `lib/auth.ts` + `lib/db.ts` |
| Register | LIVE (append-only) | `docs/schema-coaching/03-schema-status.md` — Session 3 appended 27 Oct with PASS rows/check IDs; A-04 WARN; policy variants remain BLOCKED |
| Demo data model blockers | NONE (demo defaults) | Open policy questions parked as DA-## + owner Q##; two advisories: `/book/` dropdown count (0 options in static HTML), homepage "six or eight" copy |
| UI architecture / screens | GATED — Gate 6 | Not started, by instruction |

## Next-up (severity order)

1. Manual browser confirmation of `/book/` dropdown composition (24 options claim vs 0 in static
   HTML — logged deviation), then tighten A-04 from WARN.
2. Owner answers: Q1 seats, Q3 diary truth, Q4 cancellation, Q5 intervals, Q7 health position
   (`docs/decisions/01-client-questions-for-owner.md`).
3. Lock schema v1 (Gate 5) now that the live suite is green; then request Gate 6 for Stage 6.
4. Keep the demo DB clean: test personas are purged by `purge_verification_data`; seeded content
   remains (31 treatments, 7 opening-hours rows, 8 course packages).
