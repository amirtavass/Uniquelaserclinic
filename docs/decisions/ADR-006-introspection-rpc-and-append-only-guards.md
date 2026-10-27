# ADR-006 — Verification via HTTPS: Engine B introspection RPC + GUC-gated append-only guards

- Status: ACCEPTED (tooling decision, not client-facing policy; DA-20 governs demo data hygiene)
- Date: 2026-10-26
- Sources: docs/schema/05 (Engines A/A2/R/B), `supabase/introspection.sql`, `services/verify-schema.ts`,
  AGENTS.md commands (`npm run verify` / `verify:rls`), kickoff trap "RLS needs two users".

## Context
The dev machine reaches Supabase over IPv6 only: a direct `SUPABASE_DB_URL` TCP connection is not
available, so the obvious verification tool (`psql`/CLI `db push` from here) fails the environment,
not the schema. PostgREST, however, is HTTPS and reachable. Append-only guard triggers are strict —
which creates a second problem: verification *runs* on a live demo DB and its rows must be cleanable
without weakening immutability.

## Decision
Two mechanisms, both REST-native:
1. **`get_schema_introspection()`** (Engine B) — a `STABLE SECURITY DEFINER` function in `public`,
   `EXECUTE` revoked from `public/anon/authenticated` and granted **only to `service_role`**. It
   reads `pg_class.relrowsecurity`, `information_schema.columns`, `pg_trigger`, `pg_enum`,
   `has_table_privilege`, and returns one jsonb of violations. The harness calls it with the service
   key over HTTPS and asserts every array is `[]`.
2. **`app.allow_append_only_write`** — the guard triggers (`guard_append_only` on the 7
   event/history/consent/audit tables) check this setting and raise `42501` unless it is `on`.
   Only two `SECURITY DEFINER` functions carry `SET app.allow_append_only_write = 'on'`:
   `apply_deletion` (ADR-005 redaction) and `purge_verification_data(run_id)` (service-only test
   cleanup, deleting exactly the persona rows matched by `verify+<run_id>-%` emails). Everything
   else — including the service role direct — is blocked; `verify:rls` R-05 proves service is too.
   Public wrappers (`search_clients`, `request_appointment_change`, `client_dashboard`,
   `apply_deletion`, `purge_verification_data`, `get_schema_introspection`) exist because PostgREST
   only exposes functions from the `public` schema; the real logic lives in `app.*`.

## Why not the alternatives
| Option | Why not |
|---|---|
| Direct Postgres connection (`psql`, `node-postgres`) | Not reachable from this environment (IPv6-only outbound); would also exclude CI runners and the client's own laptop. HTTPS REST works everywhere the app works. |
| `supabase inspect` CLI | Requires CLI install + `supabase link` + DB password; fine for apply-time (documented for the owner/you), useless as an in-app-package-free check loop. |
| Skipping Engine B ("trust the migrations") | A stale `ALTER TABLE … DISABLE ROW SECURITY` or a float column creeps in silently; R05/R07 are *claims* until introspected. Engine B is the register-evidence generator. |
| Deleting test rows by turning guard triggers off per session | `SET` doesn't persist across PostgREST pooled requests; a global GUC would also be forgeable by any SQL-injection-shaped write. Function-level `SET` is scoped and granted nowhere else. |
| Letting verification rows pollute the demo DB | Staff queue would fill with "Verify ClientA" bookings — a demo-killer; purge keeps the stage clean while keeping history *history*. |

## Consequences
- `npm run verify` / `verify:rls` need only `SUPABASE_URL`, anon and service keys — same `.env` the
  seed script uses.
- Applying SQL still needs the Dashboard SQL editor or `supabase link && db push` (one-time, by the
  key-holder) — documented in Step-3 output; verification itself is 100% HTTPS.
- The GUC name is now part of the security surface: only two functions may set it; Engine B checks
  the guard triggers exist, R-05 checks they bite.
- One deviation logged at apply time (docs/schema-coaching/03-schema-status.md): the user-stated
  "24 static `<option>`s in /book/ HTML" probed **0 options** in the fetched source; dropdown
  counts stay advisory (`WARN`) until a browser-rendered check confirms them — never silently fixed.
