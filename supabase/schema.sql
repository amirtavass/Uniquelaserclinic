-- supabase/schema.sql — Unique Laser Clinics v1 demo schema
-- Contract sources: docs/schema/01–05, docs/schema-coaching/01-user-stories.md (S/R),
-- docs/decisions/02-demo-assumptions.md (DA-01…DA-20). Idempotent: safe to re-run.
-- Money = integer pence (R05). Enum casing contract (docs/schema/01 §2e): UPPERCASE labels;
-- app_role lowercase (R01). Apply order: schema.sql → rls.sql → introspection.sql → seed.

create extension if not exists pgcrypto;
create schema if not exists app;
create schema if not exists clinical;
-- SQL-language helper bodies reference tables created below; validate them at first call, not CREATE.
set check_function_bodies = off;
comment on schema clinical is
  'T3 dormant partition (ADR-004). No tables, no grants. Creation of clinical tables requires an accepted Q03 answer.';

-- ---------------------------------------------------------------- helpers (before tables: used in column DEFAULTs)
create or replace function app.uid() returns uuid language sql stable set search_path=public,pg_catalog as
$$ select auth.uid() $$;

create or replace function app.is_staff() returns boolean
language sql stable security definer set search_path=public,pg_catalog as
$$ select exists (select 1 from user_roles ur
                  where ur.user_id = auth.uid() and ur.role in ('owner','staff')
                    and ur.revoked_at is null) $$;

create or replace function app.is_owner() returns boolean
language sql stable security definer set search_path=public,pg_catalog as
$$ select exists (select 1 from user_roles ur
                  where ur.user_id = auth.uid() and ur.role = 'owner' and ur.revoked_at is null) $$;

create or replace function app.tenant_id() returns uuid
language sql stable security definer set search_path=public,pg_catalog as
$$ select id from clinics order by created_at limit 1 $$;

create or replace function app.setting_text(k text) returns text
language sql stable security definer set search_path=public,pg_catalog as
$$ select value #>> '{}' from clinic_settings where key = k limit 1 $$;

-- ---------------------------------------------------------------- enums
do $$
declare e text[]; n text; labels text[];
begin
  foreach n, labels in array [
    ['app_role',                array['owner','staff','client']],
    ['request_kind',            array['CONSULTATION','TREATMENT','ADVISE_ME']],
    ['booking_status',          array['PENDING','CONFIRMED','DECLINED','RESCHEDULED','CANCELLED']],
    ['time_band',               array['MORNING','AFTERNOON','EVENING']],
    ['request_event_action',    array['CREATED','CONFIRMED','DECLINED','RESCHEDULE_PROPOSED','CANCELLED','NOTE_ADDED']],
    ['appointment_type',        array['CONSULTATION','PATCH_TEST','SESSION']],
    ['appointment_status',      array['SCHEDULED','COMPLETED','CANCELLED','CANCEL_REQUESTED','RESCHEDULE_REQUESTED','NO_SHOW']],
    ['appointment_event_action',array['SCHEDULED','CONFIRMED_BY_STAFF','COMPLETED','CANCEL_REQUESTED','CANCELLED','RESCHEDULE_REQUESTED','RESCHEDULED','NO_SHOW_RECORDED']],
    ['pricing_model',           array['PER_SESSION','FROM_PRICE','PRICE_ON_CONSULTATION','FREE']],
    ['token_platform',          array['IOS','ANDROID']],
    ['token_status',            array['ACTIVE','STALE']],
    ['consent_kind',            array['DATA_PROCESSING','MARKETING','NOTIFICATIONS']],
    ['consent_decision',        array['GRANTED','WITHDRAWN']],
    ['consent_source',          array['APP','WEB','IN_PERSON']],
    ['deletion_status',         array['REQUESTED','IN_REVIEW','COMPLETED','REJECTED']],
    ['reminder_channel',        array['PUSH','SMS']],
    ['reminder_status',         array['SCHEDULED','SENT','FAILED','CANCELLED']],
    ['update_status',           array['DRAFT','PUBLISHED']],
    ['enquiry_status',          array['OPEN','ANSWERED','CLOSED']],
    ['message_author_role',     array['CLIENT','STAFF']],
    ['notification_kind',       array['APPOINTMENT_REMINDER','BOOKING_UPDATE','ENQUIRY_REPLY','NEW_UPDATE']],
    ['course_status',           array['ACTIVE','COMPLETED','EXPIRED','REFUNDED']]
  ] loop
    if not exists (select 1 from pg_type t join pg_namespace x on x.oid=t.typnamespace
                   where x.nspname='public' and t.typname = n) then
      execute format('create type public.%I as enum (%L)', n, labels);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- tables
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null, address_line text not null, postcode text not null,
  phone_e164 text not null, email text not null,
  timezone text not null default 'Europe/London',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists user_roles_active_one_per_user
  on public.user_roles (clinic_id, user_id) where revoked_at is null;

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  first_name text not null, last_name text not null,
  phone_e164 text, phone_raw text,
  phone_verified_at timestamptz,
  pseudonymised_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint client_profiles_user_unique unique (user_id)
);
create unique index if not exists client_profiles_unique_verified_phone
  on public.client_profiles (clinic_id, phone_e164)
  where phone_verified_at is not null and pseudonymised_at is null and phone_e164 is not null;

create table if not exists public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform public.token_platform not null,
  status public.token_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  user_id uuid not null references auth.users(id),
  kind public.consent_kind not null,
  policy_version text not null, policy_text_hash text not null,
  decision public.consent_decision not null,
  source public.consent_source not null default 'APP',
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  user_id uuid not null references auth.users(id),
  status public.deletion_status not null default 'REQUESTED',
  completed_at timestamptz, handled_by uuid references auth.users(id), note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  key text not null, value jsonb not null,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, key)
);

create table if not exists public.treatment_categories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  slug text not null, name text not null, blurb text, sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, slug)
);

create table if not exists public.treatment_concerns (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  slug text not null, name text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, slug)
);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  category_id uuid not null references public.treatment_categories(id) on delete restrict,
  slug text not null, name text not null,
  summary text not null, description text,
  price_from_pence integer check (price_from_pence is null or price_from_pence >= 0),
  pricing_model public.pricing_model not null default 'FROM_PRICE',
  is_featured boolean not null default false,
  has_detail_page boolean not null default false,
  show_in_directory boolean not null default true,
  show_in_booking_dropdown boolean not null default false,
  typical_sessions_min smallint, typical_sessions_max smallint,
  duration_minutes integer,
  requires_consultation boolean not null default true,
  requires_patch_test boolean not null default true,
  min_gap_days smallint,
  disclaimer text, source_url text, content_verified boolean not null default false,
  published boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, slug),
  constraint treatments_price_model_coherent check (
    (price_from_pence is null and pricing_model = 'PRICE_ON_CONSULTATION')
    or (price_from_pence is not null and pricing_model <> 'PRICE_ON_CONSULTATION')),
  constraint treatments_featured_priced check (
    not is_featured or (price_from_pence is not null and pricing_model = 'FROM_PRICE'))
);

create table if not exists public.treatment_concern_links (
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  concern_id uuid not null references public.treatment_concerns(id) on delete cascade,
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (treatment_id, concern_id)
);

create table if not exists public.treatment_price_history (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  old_price_pence integer, new_price_pence integer,
  effective_from timestamptz not null default now(),
  changed_by uuid, reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  question text not null, answer text not null, category text,
  sort_order int not null default 0, published boolean not null default true,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  weekday smallint not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  opens time, closes time,
  valid_from date not null default date '2000-01-01',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, weekday, valid_from)
);

create table if not exists public.opening_hours_overrides (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  day date not null, is_open boolean not null, reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, day)
);

create table if not exists public.course_packages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  treatment_id uuid not null references public.treatments(id) on delete restrict,
  name text not null,
  sessions_count integer not null check (sessions_count > 0),
  discount_percent integer check (discount_percent between 0 and 100),
  price_pence integer check (price_pence is null or price_pence >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.client_courses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  client_user_id uuid not null references auth.users(id),
  course_package_id uuid references public.course_packages(id) on delete restrict,
  treatment_id uuid references public.treatments(id) on delete restrict,
  sessions_total integer not null check (sessions_total > 0),
  started_at timestamptz, expires_at timestamptz,
  status public.course_status not null default 'ACTIVE',
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  client_user_id uuid not null references auth.users(id),
  request_kind public.request_kind not null,
  treatment_id uuid references public.treatments(id) on delete restrict,
  preferred_date date not null,
  preferred_time_band public.time_band,
  notes_client text,
  status public.booking_status not null default 'PENDING',
  treatment_name_snapshot text, price_from_pence_snapshot integer,
  currency_code text not null default 'GBP',
  idempotency_key uuid,
  decided_by uuid references auth.users(id), decision_reason text,
  retained_for text check (retained_for in ('LEGAL_OBLIGATION','CLAIMS_DEFENCE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint booking_requests_treatment_required
    check (request_kind = 'ADVISE_ME' or treatment_id is not null),
  unique (clinic_id, client_user_id, idempotency_key)
);

create table if not exists public.booking_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_requests(id) on delete cascade,
  actor_user_id uuid,
  actor_role public.app_role,
  action public.request_event_action not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  client_user_id uuid not null references auth.users(id),
  client_name_snapshot text not null,
  request_id uuid references public.booking_requests(id) on delete restrict,
  course_id uuid references public.client_courses(id) on delete restrict,
  treatment_id uuid references public.treatments(id) on delete restrict,
  type public.appointment_type not null,
  status public.appointment_status not null default 'SCHEDULED',
  scheduled_start timestamptz not null,
  duration_minutes integer,
  therapist_user_id uuid references auth.users(id),
  retained_for text check (retained_for in ('LEGAL_OBLIGATION','CLAIMS_DEFENCE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists appointments_client_time on public.appointments (client_user_id, scheduled_start desc);

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_user_id uuid, actor_role public.app_role,
  action public.appointment_event_action not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel public.reminder_channel not null default 'PUSH',
  scheduled_for timestamptz not null,
  status public.reminder_status not null default 'SCHEDULED',
  attempts integer not null default 0, last_error text, sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (appointment_id, channel, scheduled_for)
);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  title text not null, body text not null,
  status public.update_status not null default 'DRAFT',
  published_at timestamptz, created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.update_revisions (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  title text not null, body text not null,
  revised_by uuid, revised_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.update_reads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  update_id uuid not null references public.updates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (update_id, user_id)
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  client_user_id uuid not null references auth.users(id),
  treatment_context_id uuid references public.treatments(id),
  status public.enquiry_status not null default 'OPEN',
  client_name_snapshot text,
  closed_by uuid references auth.users(id), closed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.enquiry_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_user_id uuid not null, author_role public.message_author_role not null,
  body text not null, sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null default app.tenant_id() references public.clinics(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null, body text not null,
  route text, read_at timestamptz, push_sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role public.app_role,
  action text not null,
  target_table text, target_id uuid,
  meta jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);
create index if not exists audit_log_target on public.audit_log (target_table, target_id, recorded_at desc);

-- ---------------------------------------------------------------- app logic functions
create or replace function app.touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;

-- Append-only guard (ADR-006): only apply_deletion / purge_verification_data set the GUC.
create or replace function app.guard_append_only() returns trigger language plpgsql as
$$ begin
  if coalesce(current_setting('app.allow_append_only_write', true), '') <> 'on' then
    raise exception 'append-only table %: % is forbidden', tg_table_name, tg_op using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- Seat cap (R01/S16/DA-01)
create or replace function app.assert_staff_seat_cap() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
declare active int; cap int;
begin
  if new.role = 'staff' and new.revoked_at is null then
    select count(*) into active from user_roles
      where role = 'staff' and revoked_at is null and id <> new.id
        and clinic_id = app.tenant_id();
    cap := coalesce((app.setting_text('staff_seat_max'))::int, 2);
    if active >= cap then
      raise exception 'staff_seat_max (%) reached — ask the owner to raise clinic_settings.staff_seat_max', cap;
    end if;
  end if;
  return new;
end $$;

-- Request: force PENDING + server-computed snapshots (R02/R05, P-03)
create or replace function app.force_request_pending() returns trigger language plpgsql as
$$ begin new.status := 'PENDING'; return new; end $$;

create or replace function app.compute_request_snapshot() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
begin
  if new.treatment_id is not null then
    select t.name, t.price_from_pence into new.treatment_name_snapshot, new.price_from_pence_snapshot
      from treatments t where t.id = new.treatment_id;
  end if;
  new.currency_code := 'GBP';
  return new;
end $$;

create or replace function app.block_client_status_edit() returns trigger language plpgsql as
$$ begin
  if not app.is_staff() and (
       new.status is distinct from old.status
       or new.decided_by is distinct from old.decided_by
       or new.decision_reason is distinct from old.decision_reason) then
    raise exception 'clients cannot edit request status or decision fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- Event logs (S12 auto-trail) — SECURITY DEFINER so the client-created request can still log
-- its own CREATED row (staff-only event INSERT policies would otherwise reject the trigger).
create or replace function app.log_request_event() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$ declare act public.request_event_action;
begin
  if tg_op = 'INSERT' then act := 'CREATED';
  else
    act := case new.status
      when 'CONFIRMED'    then 'CONFIRMED'
      when 'DECLINED'     then 'DECLINED'
      when 'RESCHEDULED'  then 'RESCHEDULE_PROPOSED'
      when 'CANCELLED'    then 'CANCELLED'
      else 'NOTE_ADDED' end;
  end if;
  insert into booking_request_events (request_id, actor_user_id, actor_role, action, detail)
  values (coalesce(new.id, old.id), auth.uid(),
          coalesce((select ur.role from user_roles ur where ur.user_id = auth.uid()
                    and ur.revoked_at is null limit 1), 'client'),
          act, jsonb_build_object('from', old.status, 'to', new.status));
  return new;
end $$;

create or replace function app.log_appointment_event() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$ declare act public.appointment_event_action;
begin
  if tg_op = 'INSERT' then act := 'SCHEDULED';
  else
    act := case new.status
      when 'COMPLETED'             then 'COMPLETED'
      when 'CANCEL_REQUESTED'      then 'CANCEL_REQUESTED'
      when 'CANCELLED'             then 'CANCELLED'
      when 'RESCHEDULE_REQUESTED'  then 'RESCHEDULE_REQUESTED'
      when 'RESCHEDULED'           then 'RESCHEDULED'
      when 'NO_SHOW'               then 'NO_SHOW_RECORDED'
      else 'CONFIRMED_BY_STAFF' end;
  end if;
  insert into appointment_events (appointment_id, actor_user_id, actor_role, action, detail)
  values (new.id, auth.uid(),
          coalesce((select ur.role from user_roles ur where ur.user_id = auth.uid()
                    and ur.revoked_at is null limit 1), 'client'),
          act, jsonb_build_object('from', old.status, 'to', new.status));
  return new;
end $$;

-- Soft warnings, audited (R03, DA-05/06 — warns never block)
create or replace function app.warn_session_without_patch_test() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
begin
  if new.type = 'SESSION' and not (new.status in ('CANCELLED','NO_SHOW')) then
    if exists (select 1 from treatments t where t.id = new.treatment_id and t.requires_patch_test)
      and not exists (
        select 1 from appointments a
        where a.client_user_id = new.client_user_id and a.treatment_id = new.treatment_id
          and a.type = 'PATCH_TEST' and a.status = 'COMPLETED'
          and a.scheduled_start <= new.scheduled_start) then
      insert into audit_log (actor_user_id, action, target_table, target_id, meta)
      values (auth.uid(), 'patch_test_warning', 'appointments', new.id,
              jsonb_build_object('request_id', new.request_id, 'appointment_id', new.id));
      raise warning 'R03: SESSION scheduled without a completed PATCH_TEST (appointment %)', new.id;
    end if;
  end if;
  return new;
end $$;

create or replace function app.warn_session_gap() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
declare gap smallint;
begin
  if new.type = 'SESSION' then
    select t.min_gap_days into gap from treatments t where t.id = new.treatment_id;
    if gap is not null and exists (
        select 1 from appointments a
        where a.client_user_id = new.client_user_id and a.treatment_id = new.treatment_id
          and a.type = 'SESSION' and a.status = 'COMPLETED'
          and a.scheduled_start < new.scheduled_start
          and new.scheduled_start < a.scheduled_start + make_interval(days => gap::int)) then
      insert into audit_log (actor_user_id, action, target_table, target_id, meta)
      values (auth.uid(), 'session_gap_warning', 'appointments', new.id,
              jsonb_build_object('min_gap_days', gap, 'appointment_id', new.id));
      raise warning 'min_gap_days (%) may be violated (appointment %)', gap, new.id;
    end if;
  end if;
  return new;
end $$;

-- Catalogue history + content revisions (R05, S14)
create or replace function app.append_price_history() returns trigger language plpgsql as
$$ begin
  insert into treatment_price_history (treatment_id, old_price_pence, new_price_pence, changed_by)
  values (new.id, old.price_from_pence, new.price_from_pence, auth.uid());
  insert into audit_log (actor_user_id, action, target_table, target_id, meta)
  values (auth.uid(), 'price_edited', 'treatments', new.id,
          jsonb_build_object('old_pence', old.price_from_pence, 'new_pence', new.price_from_pence));
  return new;
end $$;

create or replace function app.append_update_revision() returns trigger language plpgsql as
$$ begin
  insert into update_revisions (update_id, title, body, revised_by)
  values (old.id, old.title, old.body, auth.uid());
  return new;
end $$;

create or replace function app.flip_enquiry_answered() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
begin
  if new.author_role = 'STAFF' then
    update enquiries set status = 'ANSWERED' where id = new.enquiry_id and status = 'OPEN';
  elsif new.author_role = 'CLIENT' then
    update enquiries set status = 'OPEN' where id = new.enquiry_id and status = 'ANSWERED';
  end if;
  return new;
end $$;

-- R06 tripwire: treatment names physically forbidden in notification copy (S07)
create or replace function app.assert_r06_generic_copy() returns trigger language plpgsql
security definer set search_path=public,pg_catalog as $$
begin
  if exists (select 1 from treatments t
             where new.body ilike '%'||t.name||'%' or new.title ilike '%'||t.name||'%') then
    raise exception 'R06 violation: notification preview must not contain treatment names';
  end if;
  return new;
end $$;

-- S18 audited directory seam (ADR-004) — VOLATILE by design: it writes its own audit row
create or replace function app.search_clients(p_query text)
returns setof public.client_profiles language plpgsql security definer
set search_path=public,pg_catalog as $$
begin
  if not app.is_staff() then
    raise exception 'search_clients requires staff' using errcode = '42501';
  end if;
  insert into audit_log (actor_user_id, action, target_table, meta)
  values (auth.uid(), 'directory_view', 'client_profiles',
          jsonb_build_object('query', p_query));
  return query select * from client_profiles cp
    where cp.pseudonymised_at is null
      and (cp.first_name ilike '%'||p_query||'%' or cp.last_name ilike '%'||p_query||'%'
           or coalesce(cp.phone_raw,'') like '%'||p_query||'%' or coalesce(cp.phone_e164,'') like '%'||p_query||'%')
    order by cp.last_name, cp.first_name limit 50;
end $$;

-- S10 client-initiated change
create or replace function app.request_appointment_change(p_appointment_id uuid, p_kind text)
returns void language plpgsql security definer set search_path=public,pg_catalog as $$
begin
  if p_kind not in ('CANCEL_REQUESTED','RESCHEDULE_REQUESTED') then
    raise exception 'p_kind must be CANCEL_REQUESTED or RESCHEDULE_REQUESTED';
  end if;
  if not exists (select 1 from appointments a
                 where a.id = p_appointment_id
                   and (a.client_user_id = auth.uid() or app.is_staff())) then
    raise exception 'not your appointment' using errcode = '42501';
  end if;
  update appointments set status = p_kind::appointment_status
    where id = p_appointment_id and status = 'SCHEDULED';
end $$;

-- One-round-trip dashboard (01 §3), invoker-scoped
create or replace function app.client_dashboard() returns jsonb language plpgsql stable as $$
declare out jsonb;
begin
  select jsonb_build_object(
    'upcoming_appointments', coalesce((select jsonb_agg(jsonb_build_object(
        'id', a.id, 'type', a.type, 'status', a.status, 'scheduled_start', a.scheduled_start))
      from appointments a where a.client_user_id = auth.uid()
        and a.status = 'SCHEDULED' and a.scheduled_start >= now() order by a.scheduled_start limit 5), '[]'::jsonb),
    'pending_requests', coalesce((select count(*) from booking_requests b
      where b.client_user_id = auth.uid() and b.status = 'PENDING'), 0),
    'unread_updates', coalesce((select count(*) from updates u
      where u.status = 'PUBLISHED' and not exists (select 1 from update_reads r
        where r.update_id = u.id and r.user_id = auth.uid())), 0),
    'open_enquiries', coalesce((select count(*) from enquiries e
      where e.client_user_id = auth.uid() and e.status in ('OPEN','ANSWERED')), 0)
  ) into out;
  return out;
end $$;

-- ADR-005 deletion pipeline (owner-gated, audited step by step)
create or replace function app.apply_deletion(p_request_id uuid) returns void
language plpgsql security definer set search_path=public,pg_catalog
set app.allow_append_only_write = 'on' as $$
declare u uuid;
begin
  if not app.is_owner() then raise exception 'deletion is owner-executed' using errcode='42501'; end if;
  select dr.user_id into u from deletion_requests dr where dr.id = p_request_id;
  if u is null then raise exception 'deletion request not found'; end if;

  update client_profiles set first_name='Deleted client', last_name='Former client',
    phone_e164=null, phone_raw=null, phone_verified_at=null, pseudonymised_at=now()
    where user_id = u;
  update booking_requests set notes_client='[redacted — deletion request]',
    retained_for='LEGAL_OBLIGATION' where client_user_id = u;
  update enquiry_messages set body='[redacted — deletion request]'
    where enquiry_id in (select id from enquiries where client_user_id = u);
  update enquiries set client_name_snapshot='Former client', retained_for='LEGAL_OBLIGATION'
    where client_user_id = u;
  update appointments set client_name_snapshot='Former client',
    retained_for=coalesce(retained_for,'LEGAL_OBLIGATION') where client_user_id = u;
  delete from notification_tokens where user_id = u;
  delete from reminders where user_id = u;
  delete from update_reads where user_id = u;
  delete from notifications where user_id = u;
  update deletion_requests set status='COMPLETED', completed_at=now(), handled_by=auth.uid()
    where id = p_request_id;
  insert into audit_log (actor_user_id, action, target_table, target_id, meta)
  values (auth.uid(), 'deletion_pseudonymised', 'auth.users', u,
          jsonb_build_object('request_id', p_request_id));
end $$;

-- ADR-006 test-data hygiene: deletes ONLY persona rows matched by run_id.
create or replace function app.purge_verification_data(run_id text) returns integer
language plpgsql security definer set search_path=public,pg_catalog
set app.allow_append_only_write = 'on' as $$
declare ids uuid[]; n int;
begin
  select coalesce(array_agg(au.id), '{}') into ids
    from auth.users au where au.email like 'verify+'||run_id||'-%';
  if array_length(ids,1) is null then return 0; end if;
  delete from appointment_events where appointment_id in
    (select a.id from appointments a where a.client_user_id = any(ids)
       or a.therapist_user_id = any(ids) or a.request_id in
       (select b.id from booking_requests b where b.client_user_id = any(ids)));
  delete from reminders where user_id = any(ids);
  delete from appointments where client_user_id = any(ids) or therapist_user_id = any(ids);
  delete from booking_request_events where request_id in
    (select b.id from booking_requests b where b.client_user_id = any(ids));
  delete from booking_requests where client_user_id = any(ids);
  delete from enquiry_messages where enquiry_id in
    (select e.id from enquiries e where e.client_user_id = any(ids));
  delete from enquiries where client_user_id = any(ids);
  delete from update_reads where user_id = any(ids);
  delete from update_revisions where update_id in
    (select up.id from updates up where up.created_by = any(ids));
  delete from updates where created_by = any(ids);
  delete from treatment_price_history where changed_by = any(ids);
  delete from consent_records where user_id = any(ids);
  delete from notification_tokens where user_id = any(ids);
  delete from notifications where user_id = any(ids);
  delete from deletion_requests where user_id = any(ids) or handled_by = any(ids);
  delete from client_courses where client_user_id = any(ids) or recorded_by = any(ids);
  delete from audit_log where actor_user_id = any(ids);
  delete from client_profiles where user_id = any(ids);
  delete from user_roles where user_id = any(ids);
  delete from auth.users where id = any(ids);
  select array_length(ids,1) into n;
  return n;
end $$;

-- Public wrappers (PostgREST exposes public schema only)
create or replace function public.search_clients(p_query text)
returns setof public.client_profiles language sql security definer set search_path=public,pg_catalog as
$$ select * from app.search_clients(p_query) $$;

create or replace function public.request_appointment_change(p_appointment_id uuid, p_kind text)
returns void language sql security definer set search_path=public,pg_catalog as
$$ select app.request_appointment_change(p_appointment_id, p_kind) $$;

create or replace function public.client_dashboard()
returns jsonb language sql stable as
$$ select app.client_dashboard() $$;

create or replace function public.apply_deletion(p_request_id uuid)
returns void language sql security definer set search_path=public,pg_catalog as
$$ select app.apply_deletion(p_request_id) $$;

create or replace function public.purge_verification_data(run_id text)
returns integer language sql security definer set search_path=public,pg_catalog as
$$ select app.purge_verification_data(run_id) $$;

-- ---------------------------------------------------------------- triggers
-- updated_at on every mutable table
do $$ declare t text; mutables text[] := array[
  'clinics','user_roles','client_profiles','notification_tokens','deletion_requests','clinic_settings',
  'treatment_categories','treatment_concerns','treatments','treatment_concern_links','faq_items',
  'opening_hours','opening_hours_overrides','course_packages','client_courses','booking_requests',
  'appointments','reminders','updates','update_reads','enquiries','notifications'];
begin
  foreach t in array mutables loop
    execute format('drop trigger if exists set_updated_at on public.%I;
                    create trigger set_updated_at before update on public.%I
                    for each row execute function app.touch_updated_at()', t, t);
  end loop;
end $$;

-- append-only guards
do $$ declare t text; guarded text[] := array[
  'booking_request_events','appointment_events','treatment_price_history','update_revisions',
  'enquiry_messages','consent_records','audit_log'];
begin
  foreach t in array guarded loop
    execute format('drop trigger if exists guard_append_only on public.%I;
                    create trigger guard_append_only before update or delete on public.%I
                    for each row execute function app.guard_append_only()', t, t);
  end loop;
end $$;

drop trigger if exists assert_staff_seat_cap on public.user_roles;
create trigger assert_staff_seat_cap before insert or update on public.user_roles
  for each row execute function app.assert_staff_seat_cap();

drop trigger if exists force_request_pending on public.booking_requests;
create trigger force_request_pending before insert on public.booking_requests
  for each row execute function app.force_request_pending();

drop trigger if exists compute_request_snapshot on public.booking_requests;
create trigger compute_request_snapshot before insert on public.booking_requests
  for each row execute function app.compute_request_snapshot();

drop trigger if exists block_client_status_edit on public.booking_requests;
create trigger block_client_status_edit before update on public.booking_requests
  for each row execute function app.block_client_status_edit();

drop trigger if exists log_request_event on public.booking_requests;
create trigger log_request_event after insert or update of status on public.booking_requests
  for each row execute function app.log_request_event();

drop trigger if exists log_appointment_event on public.appointments;
create trigger log_appointment_event after insert or update of status on public.appointments
  for each row execute function app.log_appointment_event();

drop trigger if exists warn_session_without_patch_test on public.appointments;
create trigger warn_session_without_patch_test before insert or update on public.appointments
  for each row execute function app.warn_session_without_patch_test();

drop trigger if exists warn_session_gap on public.appointments;
create trigger warn_session_gap before insert or update on public.appointments
  for each row execute function app.warn_session_gap();

drop trigger if exists append_price_history on public.treatments;
create trigger append_price_history after update of price_from_pence on public.treatments
  for each row when (old.price_from_pence is distinct from new.price_from_pence)
  execute function app.append_price_history();

drop trigger if exists append_update_revision on public.updates;
create trigger append_update_revision after update of title, body on public.updates
  for each row execute function app.append_update_revision();

drop trigger if exists flip_enquiry_answered on public.enquiry_messages;
create trigger flip_enquiry_answered after insert on public.enquiry_messages
  for each row execute function app.flip_enquiry_answered();

drop trigger if exists assert_r06_generic_copy on public.notifications;
create trigger assert_r06_generic_copy before insert or update on public.notifications
  for each row execute function app.assert_r06_generic_copy();

-- function EXECUTE grants (get_schema_introspection is granted inside introspection.sql)
revoke execute on function public.purge_verification_data(text) from public, anon, authenticated;
grant execute on function public.purge_verification_data(text) to service_role;
grant execute on function public.search_clients(text) to authenticated, service_role;
grant execute on function public.request_appointment_change(uuid, text) to authenticated, service_role;
grant execute on function public.client_dashboard() to anon, authenticated, service_role;
grant execute on function public.apply_deletion(uuid) to authenticated, service_role;
