# 06 — Changelog (append-only, newest last)

## 2026-10-22 — Session 1
- Repo initialised; kickoff process adopted; source inventory (`00`, W01–W08 + verbatim M01);
  user stories S01–S18 + rules R01–R10; decision log D01–D07; ADR-001/002; questions Q01–Q12;
  demo slice + scope docs; Expo scaffold with live website-derived demo screen.

## 2026-10-26 — Session 2: Supabase access verified
- Confirmed project `rstxutdwalazuhfkbvec` reachable (REST 200; anon + service keys valid);
  `public.treatments` absent → demo schema not applied (PGRST205).

## 2026-10-26 — Session 3: Schema proposal + reconciliation + verification harness
- `docs/schema/01–05` written; contradictions reconciled against re-fetched live site (hours
  10–6 verified across 5 pages; catalogue 8/22/31 with visibility flags; `/faqs/` verified 6-session
  20%-off courses + £500 3-instalment plans; `/book/` health fields optional ⇒ D05 matches site
  fallback). Enum casing standardised to story contract; S17 naming fixed.
- `docs/decisions/01-client-questions-for-owner.md` (plain English) + `02-demo-assumptions.md`
  (DA-01…DA-20 non-blocking defaults).
- Append-only register `docs/schema-coaching/03-schema-status.md` (S/R rows, UNTESTED vs BLOCKED).
- Harness v1: `services/verify-schema.ts` + `supabase/introspection.sql` + `npm run verify` /
  `verify:rls`; graceful BLOCKED output proven against the live (empty) database; typecheck clean.

## 2026-10-26 — Session 4: Stages 4–5 executed (provisional Gate 1–3 demo sign-off)
- **Created:** `supabase/schema.sql`, `supabase/rls.sql`, `supabase/README.md` (apply runbook),
  `services/seed.ts` + `services/seed-contract.json` (counts-as-contract; internal self-check
  passes: 8 featured / 22 detail / 31 directory / 7×10:00–18:00 / 8 courses 6×20% / 12 FAQs /
  settings DA-01/07/02), `docs/schema-coaching/02-query-pack.md`, `04-metrics-and-evidence.md`,
  `08-pressure-test.md` (15 real items, all PASS static; Gate 5 evidence),
  `docs/schema-coaching/templates/ADR.md`, ADR-003 (request/appointment split + soft-warn audit
  triggers), ADR-004 (4-tier isolation + dormant `clinical` + RPC audit seam), ADR-005 (GDPR
  pseudonymise-don't-annihilate), ADR-006 (introspection RPC + GUC guards).
- **S02 fix (contradiction 1.6):** session storage now `expo-secure-store` (Keychain/Keystore)
  with web fallback; new seams `lib/auth.ts`, `lib/db.ts` (sole data-access entry).
- **Harness hardening found while writing SQL:** owner-seat bootstrap for fresh personas;
  R-01 per-table owner columns; tamper probes now require `return=representation` + non-empty
  result (RLS-filtered writes previously looked like "accepted"); `verify:rls` bootstraps its own
  personas; seed counts imported from `seed-contract.json` instead of literals.
- **Deviation logged:** "/book/ has 24 static `<option>`s" — raw fetch shows 0 (JS-rendered);
  dropdown seeding remains advisory WARN (DA-14) pending a browser-rendered check.
- **State:** all 35 checks BLOCKED (schema not applied — no DDL credential in this environment).
  Next action belongs to the key-holder: run `supabase/README.md` Option A or B, then
  `npm run seed && npm run verify && npm run verify:rls`; register moves UNTESTED→PASS on evidence.
  **STOP at Gate 5** — no screens before Gate 6.
