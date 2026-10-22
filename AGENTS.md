# AGENTS.md — Unique Laser Clinics Mobile App

## Project

Client-facing + staff mobile app (iOS + Android) for **Unique Laser Clinics**, a laser, skin & body
clinic at 327 Deane Road, Bolton BL3 5HN. Website (source of truth): https://uniquelaserclinics.co.uk/

- **Client jobs (from staff message M01):** book appointments, check reminders, see updates, ask
  enquiries, sign up with email + phone + full info.
- **Privileged seats:** owner + 2 staff (confirm Q01).
- **Platforms:** both iOS and Android, one codebase.

## People & sources

- Website > this repo's docs > interview answers > chat > memory. The staff message (M01) is
  evidence, not sign-off.
- Who signs off: TBD (Q01).

## Stack (proposed — ADR-001/002)

Expo + React Native + TypeScript + Expo Router · Supabase (Postgres, Auth, RLS, Storage, Edge
Functions) · expo-notifications via EAS dev builds · money = integer pence · UK spelling.

## Commands (once scaffolded)

`npm run verify` — query pack · `npm run verify:rls` — two-user isolation ·
`eas build --profile development --platform all` — dev builds.

## Process

Staged with gates (see `docs/agent/new-project-kickoff-prompt.md`). Current stage: **Phase 1 docs
complete → Gate 0/1 awaiting client.** No product screens before Gate 6. Registers are append-only.

## Read in this order

1. `docs/README.md`
2. `docs/product/00-source-inventory.md` (includes verbatim staff message M01)
3. `docs/schema-coaching/01-user-stories.md`
4. `docs/decisions/ADR-001-mobile-stack.md`, `ADR-002-database-supabase.md`
5. `docs/schema-coaching/05-decision-log.md` · `08-scope-and-demo-slice.md`
6. `docs/progress/07-questions-for-client.md`

## Never

Commit secrets/PDFs/personal data · invent requirements, prices, hours, or availability · edit
register history · copy decisions from the CalmAnchor reference repo (process only).
