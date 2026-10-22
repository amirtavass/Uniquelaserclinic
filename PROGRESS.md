# PROGRESS.md

**Current stage:** Phase 1 (planning docs) complete → **Gate 0/1: awaiting client**.
**Updated:** 2026-10-22 · Demo scaffold installed (SDK 57 pinned to CalmAnchor versions).

| Milestone | Status | Notes |
|---|---|---|
| Demo scaffold | DONE | Expo 57 + TS + Router + Supabase client; `expo-doctor` 21/21; tsc clean; Android bundle exports |
| Demo schema + seed | NEXT | `supabase/demo-schema.sql`, verified treatment content, demo accounts |
| Stage 0 — Evidence intake | DONE (self, pending client confirm) | `docs/product/00-source-inventory.md`; site re-verified 2026-10-22; staff message M01 recorded verbatim |
| Stage 1 — Questions | DONE (batch sent, awaiting answers) | `docs/progress/07-questions-for-client.md` Q01–Q12 |
| User stories (draft) | DONE — all `[NOT YET BRIEFED]` | S01–S18 + rules R01–R10 in `docs/schema-coaching/01-user-stories.md` |
| Stack + database | PROPOSED | ADR-001 Expo/RN · ADR-002 Supabase/Postgres |
| Scope + demo slice | DRAFT | `docs/schema-coaching/08-scope-and-demo-slice.md` |
| Schema + RLS + query pack | BLOCKED — Gate 3 (stories signed) | Next after sign-off |
| Journeys & edge cases | TODO — Stage 2 | After Q answers |
| UI architecture, M1 build | TODO — Stages 5–7 | No screens before Gate 6 |

## Next-up (severity order)

1. Get owner answers Q04 (diary reality) and Q01 (who signs off) — everything else is cheap to
   re-decide; these two are not.
2. Write `07-journeys-and-edge-cases.md` once Q04/Q02/Q03 answered.
3. Gate 3 sign-off → schema.sql + rls.sql + query pack.
