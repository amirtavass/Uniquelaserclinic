# supabase/ — apply runbook (one operator, ~2 minutes)

Files (order matters): `schema.sql` → `rls.sql` → `introspection.sql`.
Service-role key cannot run DDL over REST — apply via the Dashboard or the CLI. All three are
idempotent and safe to re-run.

## Option A — Dashboard SQL Editor (no install)
1. Open https://supabase.com/dashboard/project/rstxutdwalazuhfkbvec/sql/new
2. Paste `supabase/schema.sql`, Run. Repeat for `supabase/rls.sql`, then
   `supabase/introspection.sql` (one paste each; each file ends with `commit` or is
   auto-committed).
3. From the repo root: `npm run seed` then `npm run verify` and `npm run verify:rls`.

## Option B — single PowerShell sequence (needs a Dashboard access token:
## Account → API Keys → "Personal access tokens"; not committed anywhere)
```powershell
$tok  = Read-Host "Supabase access token" -AsSecureString
$plain = [Net.NetworkCredential]::new('', $tok).Password
foreach ($f in 'supabase/schema.sql','supabase/rls.sql','supabase/introspection.sql') {
  Invoke-RestMethod -Method Post `
    -Uri 'https://api.supabase.com/v1/projects/rstxutdwalazuhfkbvec/database/query' `
    -Headers @{ Authorization = "Bearer $plain" } -ContentType 'application/json' `
    -Body (@{ query = (Get-Content $f -Raw) } | ConvertTo-Json -Depth 3)
}
npm run seed; npm run verify; npm run verify:rls
```

## Expected verification output
- `npm run verify` → all 35 checks print with IDs from `docs/schema/05-verification-plan.md`;
  success exit code 0. **A-04 stays WARN** until the `/book/` dropdown composition is confirmed in a
  real browser (static HTML has 0 `<option>` elements — deviation logged 26 Oct).
- Engine B keys must all be empty arrays: `rls_missing`, `public_health_columns`,
  `money_violations`, `mutable_timestamp_gaps`, `append_only_gaps`,
  `enum_label_violations`, `required_triggers_missing`, `tables_missing`.
- If any check is BLOCKED afterwards, the fix is always "apply/seed" — never delete the check.

## Known first-run caveats (already handled by the harness, listed for honesty)
- `verify` creates real auth users `verify+<run>-*` on the project and purges them via
  `purge_verification_data(run_id)` at the end; if the purge RPC is missing you get a WARN with the
  run tag so rows can be removed manually.
- Price edits by the suite append `treatment_price_history` rows *by design* — history shows two
  entries per verify run (edit + restore); the final `price_from_pence` equals the seeded value.
