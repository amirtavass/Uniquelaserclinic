# PROGRESS.md

**Current stage:** Gates 1–3 provisionally signed for demo (DA-01…DA-20) → **Stage 4 + 5 complete
(papers) — STOPPED at Gate 5.** Schema v1 ready to lock the moment the apply runbook is executed.
**Updated:** 2026-10-26 (session 4).

| Milestone | Status | Notes |
|---|---|---|
| Demo scaffold | DONE | Expo 57 + TS + Router + Supabase client; `expo-doctor` 21/21; Android bundle exports |
| Supabase access | VERIFIED | Project reachable, keys valid; demo schema not yet applied (PGRST205 expected) |
| Stage 0 — Evidence intake | DONE | `docs/product/00-source-inventory.md`; site re-verified 26 Oct (hours, catalogue, packages, optional health fields) |
| Stage 1 — Questions | Batch 1 sent; Batch 2 in plain English | `docs/progress/07-questions-for-client.md` + `docs/decisions/01-client-questions-for-owner.md` |
| User stories + rules | DRAFT (provisional demo sign-off) | S01–S18, R01–R10; enum-casing contract standardised |
| Schema proposal | DONE | `docs/schema/01–05` |
| **Stage 4 — schema.sql / rls.sql / query pack / seed** | **WRITTEN + typecheck-clean, APPLY PENDING** | `supabase/{schema,rls,introspection}.sql`, `supabase/README.md` runbook, `services/{seed,verify-schema}.ts`, `seed-contract.json`; ADR-003…006; metrics `04`; query pack `02` |
| **Stage 5 — Pressure test** | **DONE (static), PASS on 15 real items** | `docs/schema-coaching/08-pressure-test.md`; live re-run owed after apply |
| Verification harness | DONE | `npm run verify` / `verify:rls`: 35 checks, graceful BLOCKED proven against live DB |
| S02 session storage | FIXED | `expo-secure-store` adapter in `lib/supabase.ts`; seams `lib/auth.ts` + `lib/db.ts` |
| Register | LIVE (append-only) | `docs/schema-coaching/03-schema-status.md` — all UNTESTED/BLOCKED until apply |
| Demo data model blockers | NONE (demo defaults) | Open policy questions parked as DA-## + owner Q##; two advisories: `/book/` dropdown count (0 options in static HTML), homepage "six or eight" copy |
| UI architecture / screens | GATED — Gate 6 | Not started, by instruction |

## Next-up (severity order)

1. **Operator apply step (unblocks everything):** run `supabase/README.md` Option A (Dashboard SQL
   editor paste ×3) or Option B (management-API one-liner with a personal access token), then
   `npm run seed; npm run verify; npm run verify:rls`. Move register rows to PASS with check IDs.
2. Manual browser confirmation of `/book/` dropdown composition (24 options claim vs 0 in static
   HTML — logged deviation), then tighten A-04 from WARN.
3. Owner answers: Q1 seats, Q3 diary truth, Q4 cancellation, Q5 intervals, Q7 health position
   (`docs/decisions/01-client-questions-for-owner.md`).
4. Only after apply turns checks PASS: lock schema v1 (Gate 5) → then request Gate 6 for Stage 6.
