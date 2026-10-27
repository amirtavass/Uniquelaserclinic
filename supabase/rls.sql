-- supabase/rls.sql — Row-Level Security for Unique Laser Clinics v1 (docs/schema/03 §3 matrix)
-- Idempotent per operation (kickoff trap: stale single-operation policy). Apply AFTER schema.sql.
-- service_role has BYPASSRLS; append-only tables additionally REVOKE its UPDATE/DELETE so even
-- service must go through GUC-gated SECURITY DEFINER functions (ADR-006).

-- ---------------------------------------------------------------- enable on 100% of tables
do $$ declare t text; names text[] := array[
  'clinics','user_roles','client_profiles','notification_tokens','consent_records',
  'deletion_requests','clinic_settings','treatment_categories','treatment_concerns','treatments',
  'treatment_concern_links','treatment_price_history','faq_items','opening_hours',
  'opening_hours_overrides','booking_requests','booking_request_events','appointments',
  'appointment_events','course_packages','client_courses','reminders','updates',
  'update_revisions','update_reads','enquiries','enquiry_messages','notifications','audit_log'];
begin
  foreach t in array names loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- T0 public content
drop policy if exists clinics_read on public.clinics;
create policy clinics_read on public.clinics for select to anon, authenticated using (true);
drop policy if exists clinics_write on public.clinics;
create policy clinics_write on public.clinics for update to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists categories_read on public.treatment_categories;
create policy categories_read on public.treatment_categories for select to anon, authenticated
  using (published and clinic_id = app.tenant_id());
drop policy if exists categories_write on public.treatment_categories;
create policy categories_write on public.treatment_categories for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

drop policy if exists concerns_read on public.treatment_concerns;
create policy concerns_read on public.treatment_concerns for select to anon, authenticated
  using (clinic_id = app.tenant_id());
drop policy if exists concerns_write on public.treatment_concerns;
create policy concerns_write on public.treatment_concerns for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists treatments_read on public.treatments;
create policy treatments_read on public.treatments for select to anon, authenticated
  using (published and clinic_id = app.tenant_id());
drop policy if exists treatments_write on public.treatments;
create policy treatments_write on public.treatments for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

drop policy if exists links_read on public.treatment_concern_links;
create policy links_read on public.treatment_concern_links for select to anon, authenticated using (true);
drop policy if exists links_write on public.treatment_concern_links;
create policy links_write on public.treatment_concern_links for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists faq_read on public.faq_items;
create policy faq_read on public.faq_items for select to anon, authenticated
  using (published and clinic_id = app.tenant_id());
drop policy if exists faq_write on public.faq_items;
create policy faq_write on public.faq_items for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

drop policy if exists hours_read on public.opening_hours;
create policy hours_read on public.opening_hours for select to anon, authenticated
  using (clinic_id = app.tenant_id());
drop policy if exists hours_write on public.opening_hours;
create policy hours_write on public.opening_hours for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

drop policy if exists overrides_read on public.opening_hours_overrides;
create policy overrides_read on public.opening_hours_overrides for select to anon, authenticated
  using (clinic_id = app.tenant_id());
drop policy if exists overrides_write on public.opening_hours_overrides;
create policy overrides_write on public.opening_hours_overrides for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

drop policy if exists packages_read on public.course_packages;
create policy packages_read on public.course_packages for select to anon, authenticated
  using (published and clinic_id = app.tenant_id());
drop policy if exists packages_write on public.course_packages;
create policy packages_write on public.course_packages for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

-- updates: published to everyone, drafts to staff (S08/S14/R-03)
drop policy if exists updates_read on public.updates;
create policy updates_read on public.updates for select to anon, authenticated
  using ((status = 'PUBLISHED' or app.is_staff()) and clinic_id = app.tenant_id());
drop policy if exists updates_write on public.updates;
create policy updates_write on public.updates for all to authenticated
  using (app.is_staff()) with check (app.is_staff() and clinic_id = app.tenant_id());

-- ---------------------------------------------------------------- T1 personal data (own-row / staff)
drop policy if exists profiles_own on public.client_profiles;
create policy profiles_own on public.client_profiles for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
drop policy if exists profiles_insert on public.client_profiles;
create policy profiles_insert on public.client_profiles for insert to authenticated
  with check (user_id = auth.uid() and clinic_id = app.tenant_id());
drop policy if exists profiles_update on public.client_profiles;
create policy profiles_update on public.client_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- (no client_profiles delete policy: rows are pseudonymised, never deleted — ADR-005)

drop policy if exists roles_owner on public.user_roles;
create policy roles_owner on public.user_roles for all to authenticated
  using (app.is_owner()) with check (app.is_owner());

drop policy if exists tokens_own on public.notification_tokens;
create policy tokens_own on public.notification_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists consent_own on public.consent_records;
create policy consent_own on public.consent_records for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
drop policy if exists consent_insert on public.consent_records;
create policy consent_insert on public.consent_records for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists del_read on public.deletion_requests;
create policy del_read on public.deletion_requests for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
drop policy if exists del_insert on public.deletion_requests;
create policy del_insert on public.deletion_requests for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists del_update on public.deletion_requests;
create policy del_update on public.deletion_requests for update to authenticated
  using (app.is_owner()) with check (app.is_owner());

drop policy if exists settings_read on public.clinic_settings;
create policy settings_read on public.clinic_settings for select to authenticated
  using (app.is_staff());
drop policy if exists settings_write on public.clinic_settings;
create policy settings_write on public.clinic_settings for all to authenticated
  using (app.is_owner()) with check (app.is_owner());

-- booking (S05/S06/S12/R02)
drop policy if exists req_select on public.booking_requests;
create policy req_select on public.booking_requests for select to authenticated
  using (client_user_id = auth.uid() or app.is_staff());
drop policy if exists req_insert on public.booking_requests;
create policy req_insert on public.booking_requests for insert to authenticated
  with check (client_user_id = auth.uid() and status = 'PENDING');
drop policy if exists req_update on public.booking_requests;
create policy req_update on public.booking_requests for update to authenticated
  using (client_user_id = auth.uid() or app.is_staff())
  with check (client_user_id = auth.uid() or app.is_staff());
-- decision columns are staff-only at the privilege layer as well as the trigger layer:
revoke update on public.booking_requests from authenticated;
grant update (status, decided_by, decision_reason) on public.booking_requests to authenticated;

drop policy if exists req_events_read on public.booking_request_events;
create policy req_events_read on public.booking_request_events for select to authenticated
  using (app.is_staff() or request_id in
         (select id from booking_requests where client_user_id = auth.uid()));
drop policy if exists req_events_insert on public.booking_request_events;
create policy req_events_insert on public.booking_request_events for insert to authenticated
  with check (app.is_staff());

drop policy if exists appt_select on public.appointments;
create policy appt_select on public.appointments for select to authenticated
  using (client_user_id = auth.uid() or app.is_staff());
drop policy if exists appt_write on public.appointments;
create policy appt_write on public.appointments for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists appt_events_read on public.appointment_events;
create policy appt_events_read on public.appointment_events for select to authenticated
  using (app.is_staff() or appointment_id in
         (select id from appointments where client_user_id = auth.uid()));
drop policy if exists appt_events_insert on public.appointment_events;
create policy appt_events_insert on public.appointment_events for insert to authenticated
  with check (app.is_staff());

drop policy if exists rem_select on public.reminders;
create policy rem_select on public.reminders for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
drop policy if exists rem_write on public.reminders;
create policy rem_write on public.reminders for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists courses_read on public.client_courses;
create policy courses_read on public.client_courses for select to authenticated
  using (client_user_id = auth.uid() or app.is_staff());
drop policy if exists courses_write on public.client_courses;
create policy courses_write on public.client_courses for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists hist_read on public.treatment_price_history;
create policy hist_read on public.treatment_price_history for select to authenticated
  using (app.is_staff());
drop policy if exists hist_insert on public.treatment_price_history;
create policy hist_insert on public.treatment_price_history for insert to authenticated
  with check (app.is_staff());

drop policy if exists rev_read on public.update_revisions;
create policy rev_read on public.update_revisions for select to authenticated
  using (app.is_staff());
drop policy if exists rev_insert on public.update_revisions;
create policy rev_insert on public.update_revisions for insert to authenticated
  with check (app.is_staff());

-- ---------------------------------------------------------------- T2 communication
drop policy if exists enq_rw on public.enquiries;
create policy enq_select on public.enquiries for select to authenticated
  using (client_user_id = auth.uid() or app.is_staff());
drop policy if exists enq_insert on public.enquiries;
create policy enq_insert on public.enquiries for insert to authenticated
  with check (client_user_id = auth.uid());
drop policy if exists enq_update on public.enquiries;
create policy enq_update on public.enquiries for update to authenticated
  using (client_user_id = auth.uid() or app.is_staff())
  with check (client_user_id = auth.uid() or app.is_staff());

drop policy if exists msg_read on public.enquiry_messages;
create policy msg_read on public.enquiry_messages for select to authenticated
  using (app.is_staff() or enquiry_id in
         (select id from enquiries where client_user_id = auth.uid()));
drop policy if exists msg_insert on public.enquiry_messages;
create policy msg_insert on public.enquiry_messages for insert to authenticated
  with check (author_user_id = auth.uid());

drop policy if exists notif_own on public.notifications;
create policy notif_own on public.notifications for all to authenticated
  using (user_id = auth.uid() or app.is_staff())
  with check (user_id = auth.uid() or app.is_staff());

drop policy if exists reads_own on public.update_reads;
create policy reads_own on public.update_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using (app.is_staff());
drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log for insert to authenticated
  with check (app.is_staff());

-- ---------------------------------------------------------------- append-only privilege walls
revoke update, delete on
  public.booking_request_events, public.appointment_events, public.treatment_price_history,
  public.update_revisions, public.enquiry_messages, public.consent_records, public.audit_log
  from anon, authenticated, service_role;

-- ---------------------------------------------------------------- clinical (ADR-004): deny by default, no grants
revoke all on schema clinical from anon, authenticated, service_role;
-- (schema is intentionally empty in v1; table grants will be added by the Q03-accepted migration)
