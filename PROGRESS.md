# PROGRESS.md

**Current stage:** **Gate 6 SIGNED 28 Oct → Stage 7 M1 demo build EXECUTED (same day).**
Three role shells live (`app/` consumer tabs + admin workspace), clinic photography normalised +
uniform-framed, token delta applied, demo personas seeded live (`npm run seed:demo`), bundle
exported green, `verify` **35 PASS · 0 FAIL · 1 WARN (A-04, pre-existing)** and `verify:rls`
**7 PASS**; `typecheck` EXIT 0. Schema hot-fixes registered
(`03-schema-status.md` “M1 smoke fixes”). **→ READY: client presentation rehearsal on two phones**
(EAS dev build path unchanged); Gate 4–6 docs remain the spec of record.
**Updated:** 2026-10-28 (session 7).

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
| UI architecture / screens | **M1 BUILT (demo scope)** | `docs/ui/` spec → `app/` 3 shells + components; register `docs/progress/milestones/m1-project-setup.md`; secondary CRUD = showcase per client directive |

## Next-up (severity order)

1. **Presentation rehearsal on two phones:** EAS dev builds (`npm run build:dev:android` / iOS
   equivalent), then walk D-F1…D-F8 from `docs/demo/01-demo-scope.md` with the quick-login card
   (Priya → Sam confirm → Ayesha seats/GDPR → sign out to guest). Re-run `npm run seed:demo`
   before the meeting to re-fresh relative dates.
2. M1.5 upgrades behind owner answers: price/hours edit write forms (Care), typed-intent deletion
   gate, real SMS OTP + server push (needs keys — never committed).
3. Manual browser confirmation of `/book/` dropdown composition (24 options claim vs 0 in static
   HTML — logged deviation), then tighten A-04 from WARN.
4. Owner answers: Q1 seats, Q3 diary truth, Q4 cancellation, Q5 intervals, Q7 health position
   (`docs/decisions/01-client-questions-for-owner.md`) — UI carries none as policy (DA-## only).
5. Asset asks to client: real treatment photography to replace the flagged before/after crop +
   the mirrored machine shot; logo licence files.
