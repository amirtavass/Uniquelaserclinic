# ADR-004 — Four-tier data isolation, dormant `clinical` schema, audited directory RPC

- Status: ACCEPTED (provisional demo sign-off — D05/DA-10; T3 activation gated on Q03/owner Q7)
- Date: 2026-10-26
- Sources: R04/R07, D05, docs/schema/03 §1–3, docs/schema/02 §E, ADR-002.

## Context
Public marketing content and personal booking data share one database, and a future health tier
(Fitzpatrick, intake answers, consent PDFs, progress photos) must not be reachable "by accident"
when a new policy is written. Site `/faqs/` publishes that skin assessment happens **at
consultation**, so v1 collects nothing health-shaped.

## Decision
Four tiers as *structural* facts: **T0** public content (`treatments`, `faq_items`, published
`updates`, `opening_hours`, `clinics`) — anon SELECT, staff write. **T1** PII app data — own-row
policies for clients, all-row for staff. **T2** inference-risk free text (`notes_client`,
`enquiry_messages.body`) — same policies but explicitly classified: minimal retention, redaction
targets in the deletion pipeline. **T3** clinical — created as an *empty, ungranted* Postgres schema
`clinical`: no tables, zero grants to `anon`/`authenticated`; Engine B asserts both empties
(`public_health_columns=[]`, clinical grants `{}`), so the D05 promise is machine-checkable.
Staff client lookups go through `app.search_clients(p_query)` (public wrapper `search_clients`) —
a SECURITY DEFINER RPC that checks `app.is_staff()` and writes `audit_log(directory_view)` per
call, because Postgres has no SELECT trigger and a bare table grant would leave S18 unprovable.

## Why not the alternatives
| Option | Why not |
|---|---|
| Health columns in `public` behind RLS | One forgotten policy = leak; "not collected" becomes unauditable. Schema separation makes the default deny. |
| Separate Supabase project for clinical | Two auth/RLS stacks for one clinic — overengineering for pre-Gate-6 scope; `clinical` can be promoted to its own project later without row-shape changes. |
| `client_profiles` SELECT + logging trigger-like hack | Not implementable; the RPC seam is the honest audited read path. |
| Column-encryption in v1 (pgcrypto) | Nothing sensitive enough to warrant it (T1/T2 protected by RLS + minimal collection); documented for T3 (docs/schema/03 §4). Doing crypto before data exists is cost without risk reduction. |

## Consequences
- T3 tables, storage buckets (`consents`, `progress-media`) and envelope encryption have a named
  home and an ADR-gated checklist (Q03/owner Q7) — zero migration when/if it lands.
- Every future policy addition has a tier to belong to; "just add SELECT staff" now visibly
  violates a tier definition and fails review.
- `verify:rls` R-03 (anon sees 0 draft/personal) and B-02 are permanent tripwires for this ADR.
