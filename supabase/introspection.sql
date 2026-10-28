-- supabase/introspection.sql — Engine B: schema self-inspection RPC
-- Status: DELIVERABLE (not applied yet — project currently has no demo schema; see
-- docs/schema-coaching/03-schema-status.md SUITE row). Apply with the dashboard SQL editor or
-- `npx supabase db push` tooling once schema.sql/rls.sql exist.
-- Callable ONLY with the service-role key over REST:  POST /rpc/get_schema_introspection
-- (no direct database connection required — works around IPv6-only SUPABASE_DB_URL hosts).

begin;

create or replace function public.get_schema_introspection()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  c_append_only constant text[] := array[
    'booking_request_events','appointment_events','treatment_price_history',
    'update_revisions','enquiry_messages','consent_records','audit_log'];
  c_expected_tables constant text[] := array[
    'clinics','user_roles','client_profiles','notification_tokens','consent_records',
    'deletion_requests','clinic_settings','treatment_categories','treatments',
    'treatment_concerns','treatment_concern_links','treatment_price_history','faq_items',
    'opening_hours','opening_hours_overrides','booking_requests','booking_request_events',
    'appointments','appointment_events','course_packages','client_courses','reminders',
    'updates','update_revisions','update_reads','enquiries','enquiry_messages',
    'notifications','audit_log'];
  c_required_triggers constant text[] := array[
    'assert_staff_seat_cap','warn_session_without_patch_test','warn_session_gap',
    'assert_r06_generic_copy','append_price_history','append_update_revision',
    'flip_enquiry_answered','force_request_pending','compute_request_snapshot',
    'guard_append_only'];
  c_health_pattern constant text :=
    'fitzpatrick|medical|medication|pregnan|contraindicat|screening|diagnos|health_condition';
  v_rls_missing text[];
  v_health_cols jsonb;
  v_clinical_grants jsonb;
  v_money jsonb;
  v_ts_gaps jsonb;
  v_append_gaps jsonb;
  v_enum_violations jsonb;
  v_triggers_missing text[];
  v_tables_missing text[];
begin
  -- 1. RLS coverage (R07): every real public table must have rowsecurity = true.
  select coalesce(array_agg(t.relname order by t.relname), '{}') into v_rls_missing
  from pg_class t
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relkind in ('r','p')
    and t.relname <> 'spatial_ref_sys'
    and not t.relrowsecurity;

  -- 2. Zero health/medical columns in public (R04 / D05).
  select jsonb_agg(column_name) into v_health_cols
  from (
    select table_name || '.' || column_name as column_name
    from information_schema.columns
    where table_schema = 'public' and column_name ~* c_health_pattern
    order by 1
  ) h;

  -- 3. clinical schema isolation (R04): no grants of any kind to anon/authenticated, at schema
  --    level or table level. Empty object = PASS (schema may also not exist yet — reported via
  --    clinical_schema_exists by the caller's own tables check).
  select jsonb_build_object(
    'exists', exists (select 1 from pg_namespace where nspname = 'clinical'),
    'schema_level_grants', coalesce((
      select jsonb_agg(distinct grantee)
      from information_schema.usage_privileges
      where object_schema = 'clinical' and grantee in ('anon','authenticated')
    ), '[]'::jsonb),
    'table_grants', coalesce((
      select jsonb_agg(distinct (table_name || ':' || privilege_type))
      from information_schema.table_privileges
      where table_schema = 'clinical' and grantee in ('anon','authenticated')
    ), '[]'::jsonb),
    'storage_bucket_public', coalesce((
      select jsonb_agg(name) from storage.buckets
      where (name = 'consents' or name = 'progress-media') and public
    ), '[]'::jsonb)
  ) into v_clinical_grants;

  -- 4. Money discipline (R05): *_pence must be integer; no float money-ish columns at all.
  select jsonb_agg(violation) into v_money
  from (
    select table_name || '.' || column_name || ' (' || data_type || ')' as violation
    from information_schema.columns
    where table_schema = 'public'
      and (
        (column_name like '%\_pence' and data_type <> 'integer')
        or (data_type in ('numeric','double precision','real','money')
            and column_name ~* 'price|amount|cost|fee|total')
      )
  ) m;

  -- 5. Mutable tables have created_at + updated_at timestamptz; append-only exempt.
  select jsonb_agg(gap) into v_ts_gaps
  from (
    select c.relname as gap
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname = any (c_expected_tables)
      and not (c.relname = any (c_append_only))
      and (
        not exists (
          select 1 from information_schema.columns k
          where k.table_schema='public' and k.table_name=c.relname
            and k.column_name='created_at' and k.data_type like 'timestamp%')
        or not exists (
          select 1 from information_schema.columns k
          where k.table_schema='public' and k.table_name=c.relname
            and k.column_name='updated_at' and k.data_type like 'timestamp%')
      )
  ) g;

  -- 6. Append-only integrity: table exists, has created_at or recorded_at (timestamptz),
  --    a guard trigger named guard_append_only, and NO update/delete privilege for
  --    anon/authenticated (service may hold grants — the guard trigger is its leash).
  select jsonb_agg(gap) into v_append_gaps
  from unnest(c_append_only) as t(tbl)
  cross join lateral (
    select
      (case when to_regclass('public.' || tbl) is null then 'missing-table'
            when not exists (
              select 1 from information_schema.columns k
              where k.table_schema='public' and k.table_name=tbl
                and k.column_name in ('created_at','recorded_at')
                and k.data_type like 'timestamp%') then 'missing-timestamp'
            when not exists (
              select 1 from pg_trigger tg
              join pg_class c on c.oid = tg.tgrelid
              where c.relname = tbl and tg.tgname = 'guard_append_only'
                and not tg.tgisinternal) then 'missing-guard-trigger'
            when has_table_privilege('anon', 'public.' || tbl, 'UPDATE')
              or has_table_privilege('anon', 'public.' || tbl, 'DELETE')
              or has_table_privilege('authenticated', 'public.' || tbl, 'UPDATE')
              or has_table_privilege('authenticated', 'public.' || tbl, 'DELETE')
              then 'privilege-leak'
            else null end) as gap
  ) x
  where x.gap is not null;

  -- 7. Enum casing contract (docs/schema/01 §2e): UPPERCASE labels everywhere except app_role
  --    (lowercase owner|staff|client per R01).
  select jsonb_agg(violation) into v_enum_violations
  from (
    select e.enumlabel || ' :: ' || t.typname as violation
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname <> 'app_role' and e.enumlabel !~ '^[A-Z0-9_]+$'
    union all
    select e.enumlabel || ' :: ' || t.typname
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'app_role' and e.enumlabel !~ '^[a-z_]+$'
  ) ev;

  -- 8. Required named triggers present (05 plan prerequisites).
  select coalesce(array_agg(want order by want), '{}') into v_triggers_missing
  from unnest(c_required_triggers) as want
  where not exists (
    select 1 from pg_trigger tg where tg.tgname = want and not tg.tgisinternal);

  -- 9. Expected tables present (drives harness BLOCKED vs FAIL reporting).
  select coalesce(array_agg(want order by want), '{}') into v_tables_missing
  from unnest(c_expected_tables) as want
  where to_regclass('public.' || want) is null;

  return jsonb_build_object(
    'generated_at', now(),
    'rls_missing', v_rls_missing,
    'public_health_columns', coalesce(v_health_cols, '[]'::jsonb),
    'clinical', v_clinical_grants,
    'money_violations', coalesce(v_money, '[]'::jsonb),
    'mutable_timestamp_gaps', coalesce(v_ts_gaps, '[]'::jsonb),
    'append_only_gaps', coalesce(v_append_gaps, '[]'::jsonb),
    'enum_label_violations', coalesce(v_enum_violations, '[]'::jsonb),
    'required_triggers_missing', v_triggers_missing,
    'tables_missing', v_tables_missing
  );
end $$;

revoke execute on function public.get_schema_introspection()
  from public, anon, authenticated;
grant execute on function public.get_schema_introspection() to service_role;

comment on function public.get_schema_introspection() is
  'Engine B read-only schema self-inspection for npm run verify (service role only). Returns
   violations arrays; empty arrays = PASS. See docs/schema/05-verification-plan.md.';

commit;
