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

## 2026-10-28 — Session 6: Stage 6 Phase 2 — full `docs/ui/` tree (Gate 6 review pending)
- Phase 1 approved at client sign-off; locked decisions recorded as Appendix A in
  `docs/ui/stage6-phase1-journeys-shell-and-plan.md` (shell = Option C + 4th `💆 Treatments`
  consumer tab: ANON Home/Treatments/Consult/Sign-In · CLIENT Home(`client_dashboard()`) /
  Treatments/Request/Profile · ADMIN Queue/Dial/Care/More + Identity Strip; `☎ Dial` hosts the
  day board + COMPLETED/NO_SHOW, `💆 Care` enquiries/updates/prices/hours, `⋯ More` owner items
  + Switch-to-Client-View).
- **Created `docs/ui/` — 42 files counted from the directory (6 top-level + 36 section files):**
  `01-tokens.md` + `00-design-system-usage-rules.md` — brand
  extracted LIVE from `uniquelaserclinics.co.uk` theme `ulc-signature` (site.css `:root` vars +
  `<meta theme-color #1A1220>` + hero SVG `#E6BE45`/`#F2D04A`; fonts Cormorant/Instrument Sans
  preloads). All 14 `theme/tokens.ts` hexes VERIFIED against the live `:root` (V1 research teal
  direction superseded; conflict logged in `01-tokens.md`); `success`/`danger` flagged
  **PROPOSED** (no site equivalents; WCAG pairs computed, incl. the 4.42:1 success-on-pearl
  caveat); verified extras (`#7FD69A` open dot, `#F3E6C4`, `#3B3042`, line/easing tokens) listed
  as M1 token-delta requests — no code touched pre-Gate 6.
- `02-navigation-and-ia.md` + `03-routing-map.md`: route → file → seam map, EXISTS vs ADD(M1)
  honestly flagged (~18 new `lib/db.ts` seams named; screens never import supabase); seat-cap
  SQLSTATE corrected to **P0001** (PL/pgSQL `RAISE EXCEPTION` default — matches Phase 1);
  rows 40–41 marked OWNER-TIER / secondary per `08-scope-and-demo-slice.md`.
- `04-screen-craft.md` (safe areas, keyboard/long-content rules, colour roles, computed contrast
  table, R09 UK-spelling lint list, verified copy bank) + `05-component-library.md`
  (P1–P12, C1–C20, named do-NOT-build list).
- `sections/`: `00-cross-cutting.md` (skeletons, AuthGateSheet, offline-cached banner, no-stale
  rule, idempotency retry dialog, R06 bell sheet, server-error mapping) · `01-auth` · `02-home` ·
  `03-discover` · `04-book` · `05-appointments` · `06-enquiries` · `07-updates` ·
  `08-profile-privacy` · `09-staff-queue` · `10-staff-dialler` · `11-staff-diary` ·
  `12-staff-comms` · `13-staff-catalogue` · `14-owner-access` (full wireframes, secondary) ·
  `15-journeys` (**new folder vs the approved tree** — J1 + J2 five-stage flows needed a home;
  flagged for review). 3 layout variations with rationale/pros-cons/Part-1 mapping for U1, U2,
  C1, C2, F1 (locked defaults: L1 ×5). Every section renders signed-out / empty / loading /
  offline / error-validation (DA-12 duplicate phone, idempotency retry, P0001 seat cap, R06
  generic rule) / edge states (DA-05/DA-06 non-blocking banners, long content, keyboard open).
- Registers: `PROGRESS.md` + this changelog updated; `docs/README.md` reading order extended with
  `ui/`. **Register honesty note:** session 5 (schema apply + seed, 27 Oct) was logged only in
  `PROGRESS.md` — changelog history is not rewritten; acknowledged here.
- **State:** `app/` still locked. STOP — Gate 6 is the client's turn: review `01-tokens.md`, the
  five 3-variant choices, and the `03-routing-map.md` build order; sign off or send edits.
