# ADR-005 — GDPR erasure by pseudonymisation pipeline (not row annihilation)

- Status: ACCEPTED (provisional demo sign-off; retention-window policy text pending owner Q7 — P-14
  tests the mechanism, not the final period)
- Date: 2026-10-26
- Sources: S11, R08, docs/schema/03 §6, `deletion_requests`, `apply_deletion` RPC (schema.sql),
  Engine A2 P-14.

## Context
A client exercising Art. 17 must not erase a clinic's evidence trail: signed consents (proof of
what was agreed), appointment history (safeguard against disputes, HMRC-aligned financial practice)
and audit rows (who changed what) all outlive the marketing account. M01's "so we know who it is"
makes identity *useful to staff* today — deleting it silently would also break S18 lookups mid-term.

## Decision
Deletion is an **owner-executed pipeline**, never a UI button that calls DELETE: `deletion_requests`
row → Owner `IN_REVIEW` → `apply_deletion(p_request_id)` (SECURITY DEFINER, owner-only) → the
person's *readable* data is destroyed: `client_profiles` name → `'Deleted client'`, phones → NULL,
`pseudonymised_at` set; `notes_client` and that client's `enquiry_messages.body` redacted (the T2
free text *is* the personal content); tokens/reminders/`update_reads` deleted; `client_name_snapshot`
columns → `'Former client'`; each step audited to `audit_log` with `retained_for` markers
(`LEGAL_OBLIGATION` / `CLAIMS_DEFENCE`) on surviving rows. The auth identity is retained until the
retention window closes, at which point `auth.admin.deleteUser()` is a separate, irreversible step
(FKs are `RESTRICT` while rows are live, so identity deletion is only safe after this pipeline —
which is exactly why it is a human-gated two-step, not a cascade).

## Why not the alternatives
| Option | Why not |
|---|---|
| `DELETE` the user and cascade | Erases consent evidence and booking history — the clinic loses its own defence; breaks "registers are append-only" and UK GDPR storage-limitation balance. |
| NULL-ing `client_user_id` on FKs | Destroys the graph join that makes "one request → confirmed chain" auditable; snapshots alone can't prove which person agreed to which policy version (only the retained uuid→hash evidence can). |
| Immediate `auth.deleteUser` | GoTrue-level PII removal is right *eventually*, but doing it before pseudonymising app tables hits RESTRICT FKs, and doing it after means the uuid keeps meaning nothing — fine; the window ordering is the point. |
| Silent auto-run (no owner step) | S11 acceptance: "no silent deletes". Also protects against a deleted account wiping records that are actually about a *different* person sharing a number (Q13/E5). |

## Consequences
- P-14 is the standing proof: appointments shell count identical before/after, zero readable PII.
- Redaction inside `apply_deletion` is the *only* sanctioned write to append-only tables
  (`app.allow_append_only_write` function-level GUC — see ADR-006); the guard trigger makes any
  other attempt a hard `42501`.
- The retention-window number (6-year default proposed, docs/schema/03 §5) becomes a settings value
  once owner Q7 answers; the mechanism doesn't change.
