# PROGRESS.md

**Current stage:** Gates 1–3 provisionally signed for demo (DA-01…DA-20) → Stage 4 + 5 complete;
schema v1 APPLIED + SEEDED (27 Oct). Live suite: **35 PASS · 0 FAIL · 1 WARN (A-04) · 0 BLOCKED**;
`verify:rls` 7 PASS; `typecheck` clean. **Stage 6 Phase 1 APPROVED + Phase 2 EXECUTED 28 Oct:
full `docs/ui/` tree written (tokens verified against live site CSS; locked 4-tab consumer +
4-tab admin shell; U1/U2/C1/C2/F1 ×3 layout variants; J1+J2 5-stage journeys; `14-owner-access`
wireframed, Owner-tier/secondary). → **GATE 6 AWAITING CLIENT REVIEW**; `app/` screens stay
locked until cleared.
**Updated:** 2026-10-28 (session 6).

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
| UI architecture / screens | **Stage 6 Phase 2 DONE (docs)** — Gate 6 review pending | `docs/ui/` full tree 28 Oct; shell locked (Option C + Treatments tab, 4/4); `app/` locked until sign-off |

## Next-up (severity order)

1. **Gate 6 review** of `docs/ui/` (client): confirm the 5 × 3-layout locked defaults, token
   deltas in `01-tokens.md` §5 (statusOpen dot, line/border + easing tokens, PROPOSED `success`/
   `danger` colours), then M1 build starts at `03-routing-map.md` section C (token delta PR first).
2. Manual browser confirmation of `/book/` dropdown composition (24 options claim vs 0 in static
   HTML — logged deviation), then tighten A-04 from WARN.
3. Owner answers: Q1 seats, Q3 diary truth, Q4 cancellation, Q5 intervals, Q7 health position
   (`docs/decisions/01-client-questions-for-owner.md`) — UI specs carry none as policy (DA-## only).
4. Keep the demo DB clean: test personas are purged by `purge_verification_data`; seeded content
   remains (31 treatments, 7 opening-hours rows, 8 course packages).
