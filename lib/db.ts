import { supabase } from './supabase';

// The single data-access seam (kickoff Stage 7: screens never import supabase directly).
// Queries mirror docs/schema-coaching/02-query-pack.md one-to-one; every RLS rule is enforced by
// the database regardless of what this file does — screens only shape the calls.

export type DbResult<T> = { data: T | null; error: string | null };

function fail(error: { message: string } | null): DbResult<never> {
  return { data: null, error: error?.message ?? 'Unknown database error' };
}

// ---------------------------------------------------------------- catalogue (T0, no login)
export async function getCategories(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase
    .from('treatment_categories').select('id,slug,name,blurb,sort_order')
    .eq('published', true).order('sort_order');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getTreatments(opts: { search?: string; categoryId?: string; concernSlug?: string } = {}): Promise<DbResult<any[]>> {
  let query = supabase
    .from('treatments')
    .select('id,slug,name,summary,category_id,price_from_pence,pricing_model,typical_sessions_min,typical_sessions_max,is_featured,show_in_directory,sort_order,disclaimer')
    .eq('published', true).eq('show_in_directory', true).order('sort_order');
  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.search) query = query.or(`name.ilike.%${opts.search}%,summary.ilike.%${opts.search}%`);
  if (opts.concernSlug) {
    const { data: links } = await supabase
      .from('treatment_concerns').select('id').eq('slug', opts.concernSlug).maybeSingle();
    if (links) {
      const { data: joined } = await supabase
        .from('treatment_concern_links').select('treatment_id').eq('concern_id', (links as any).id);
      const ids = (joined ?? []).map((j: any) => j.treatment_id);
      query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    }
  }
  const { data, error } = await query;
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getTreatmentBySlug(slug: string): Promise<DbResult<any>> {
  const { data, error } = await supabase
    .from('treatments')
    .select('*, treatment_categories(slug,name), course_packages(name,sessions_count,discount_percent,published)')
    .eq('slug', slug).eq('published', true).maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function getPublishedUpdates(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase
    .from('updates').select('id,title,body,published_at')
    .eq('status', 'PUBLISHED').order('published_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getFaqItems(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase
    .from('faq_items').select('question,answer,category').eq('published', true).order('sort_order');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getOpeningStatus(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase
    .from('opening_hours').select('weekday,is_open,opens,closes,valid_from').order('valid_from', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

// ---------------------------------------------------------------- client data (own rows)
export async function saveClientProfile(input: {
  userId: string; clinicId: string; firstName: string; lastName: string;
  phoneE164: string; phoneRaw: string;
}): Promise<DbResult<any>> {
  const patch: any = {
    clinic_id: input.clinicId, user_id: input.userId, first_name: input.firstName,
    last_name: input.lastName, phone_e164: input.phoneE164, phone_raw: input.phoneRaw,
  };
  // DA-12 rule: a changed number is unverified until OTP lands — clear the stamp when it differs.
  const { data: current } = await supabase.from('client_profiles')
    .select('phone_e164').eq('user_id', input.userId).maybeSingle();
  if (current && (current as any).phone_e164 !== input.phoneE164) patch.phone_verified_at = null;
  const { data, error } = await supabase.from('client_profiles').upsert(patch, { onConflict: 'user_id' }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function recordConsent(input: {
  userId: string; kind: 'DATA_PROCESSING' | 'MARKETING' | 'NOTIFICATIONS';
  policyVersion: string; policyTextHash: string; decision: 'GRANTED' | 'WITHDRAWN';
}): Promise<DbResult<any>> {
  const { data, error } = await supabase.from('consent_records').insert({
    user_id: input.userId, kind: input.kind, policy_version: input.policyVersion,
    policy_text_hash: input.policyTextHash, decision: input.decision, source: 'APP',
  }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function createBookingRequest(input: {
  clientUserId: string; clinicId: string; requestKind: 'CONSULTATION' | 'TREATMENT' | 'ADVISE_ME';
  treatmentId?: string; preferredDate: string; timeBand?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  notes?: string; idempotencyKey: string;
}): Promise<DbResult<any>> {
  const { data, error } = await supabase.from('booking_requests').insert({
    clinic_id: input.clinicId, client_user_id: input.clientUserId, request_kind: input.requestKind,
    treatment_id: input.treatmentId ?? null, preferred_date: input.preferredDate,
    preferred_time_band: input.timeBand ?? null, notes_client: input.notes ?? null,
    idempotency_key: input.idempotencyKey,
  }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function myDashboard(): Promise<DbResult<any>> {
  const { data, error } = await supabase.rpc('client_dashboard');
  return error ? fail(error) : { data, error: null };
}

export async function myAppointments(): Promise<DbResult<any[]>> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in to see appointments' };
  const res = await supabase.from('appointments')
    .select('id,type,status,scheduled_start,duration_minutes,treatment_id')
    .eq('client_user_id', uid).order('scheduled_start', { ascending: false });
  return res.error ? fail(res.error) : { data: res.data ?? [], error: null };
}

export async function requestAppointmentChange(appointmentId: string,
  kind: 'CANCEL_REQUESTED' | 'RESCHEDULE_REQUESTED'): Promise<DbResult<boolean>> {
  const { error } = await supabase.rpc('request_appointment_change',
    { p_appointment_id: appointmentId, p_kind: kind });
  return error ? fail(error) : { data: true, error: null };
}

export async function createEnquiry(input: {
  clientUserId: string; clinicId: string; firstMessage: string; treatmentContextId?: string;
}): Promise<DbResult<any>> {
  const { data: enq, error } = await supabase.from('enquiries').insert({
    clinic_id: input.clinicId, client_user_id: input.clientUserId,
    treatment_context_id: input.treatmentContextId ?? null, status: 'OPEN',
  }).select().maybeSingle();
  if (error || !enq) return error ? fail(error) : { data: null, error: 'Could not open enquiry' };
  const msg = await supabase.from('enquiry_messages').insert({
    enquiry_id: enq.id, author_user_id: input.clientUserId, author_role: 'CLIENT', body: input.firstMessage,
  });
  return msg.error ? fail(msg.error) : { data: enq, error: null };
}

export async function markUpdateRead(updateId: string): Promise<DbResult<boolean>> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in required' };
  const { error } = await supabase.from('update_reads').upsert(
    { update_id: updateId, user_id: uid, read_at: new Date().toISOString() },
    { onConflict: 'update_id,user_id' });
  return error ? fail(error) : { data: true, error: null };
}

// ---------------------------------------------------------------- staff surface (RLS enforces)
// PostgREST cannot embed client_profiles through auth.users (no direct FK) — resolve the join
// in two queries; shape kept as { ..., client_profiles } so cards/components don't care (M1 smoke).
async function attachProfiles(rows: any[]): Promise<any[]> {
  const ids = [...new Set(rows.map(r => r.client_user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data } = await supabase.from('client_profiles')
    .select('user_id,first_name,last_name,phone_e164,phone_verified_at').in('user_id', ids);
  const byUser = new Map((data ?? []).map(p => [p.user_id, p]));
  return rows.map(r => ({ ...r, client_profiles: byUser.get(r.client_user_id) ?? null }));
}

export async function staffQueue(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('booking_requests')
    .select('*').eq('status', 'PENDING').order('created_at', { ascending: false });
  return error ? fail(error) : { data: await attachProfiles(data ?? []), error: null };
}

export async function decideBooking(requestId: string, decision: 'CONFIRMED' | 'DECLINED' | 'RESCHEDULED',
  reason?: string): Promise<DbResult<any>> {
  const { data: me } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('booking_requests').update({
    status: decision, decided_by: me.user?.id ?? null, decision_reason: reason ?? null,
  }).eq('id', requestId).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function getRequestDetail(requestId: string): Promise<DbResult<any>> {
  const { data: request, error } = await supabase.from('booking_requests')
    .select('*').eq('id', requestId).maybeSingle();
  if (error) return fail(error);
  if (!request) return { data: null, error: null };
  const [withProfile] = await attachProfiles([request]);
  const { data: events } = await supabase.from('booking_request_events')
    .select('action,detail,actor_role,created_at').eq('request_id', requestId).order('created_at');
  const { data: appts } = await supabase.from('appointments')
    .select('id,type,status,scheduled_start').eq('request_id', requestId).order('scheduled_start');
  return { data: { request: withProfile, events: events ?? [], appointments: appts ?? [] }, error: null };
}

export async function scheduleAppointments(input: {
  clinicId: string; clientUserId: string; clientNameSnapshot: string; requestId: string;
  treatmentId?: string; chain: { type: 'CONSULTATION' | 'PATCH_TEST' | 'SESSION'; start: string; minutes?: number }[];
}): Promise<DbResult<any[]>> {
  const rows = input.chain.map(c => ({
    clinic_id: input.clinicId, client_user_id: input.clientUserId,
    client_name_snapshot: input.clientNameSnapshot, request_id: input.requestId,
    treatment_id: input.treatmentId ?? null, type: c.type, status: 'SCHEDULED',
    scheduled_start: c.start, duration_minutes: c.minutes ?? null,
  }));
  const { data, error } = await supabase.from('appointments').insert(rows).select('id,type,scheduled_start');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function searchClients(query: string): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.rpc('search_clients', { p_query: query });
  return error ? fail(error) : { data: (data as any[]) ?? [], error: null };
}

// ---------------------------------------------------------------- M1 demo batch (docs/ui/03-routing-map.md ADD(M1))
// Same contract: RLS enforces everything; these only shape the call.

export async function getClinic(): Promise<DbResult<any>> {
  const { data, error } = await supabase.from('clinics').select('*').order('created_at').limit(1).maybeSingle();
  return error ? fail(error) : { data, error: null };
}

let cachedClinicId: string | null = null;
/** Single-tenant runtime (schema 01 §1): resolve the one clinic id once, cache it. */
export async function clinicId(): Promise<string> {
  if (cachedClinicId) return cachedClinicId;
  const r = await getClinic();
  const id: string = r.data?.id ?? '00000000-0000-4000-8000-00000000c11c';
  cachedClinicId = id;
  return id;
}

export async function getConcerns(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('treatment_concerns').select('id,slug,name');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getHoursOverrides(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('opening_hours_overrides').select('day,is_open,reason');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function getMyProfile(): Promise<DbResult<any>> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('client_profiles')
    .select('*').eq('user_id', uid).maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function getMyRole(): Promise<DbResult<'owner' | 'staff' | 'client'>> {
  const { data, error } = await supabase.rpc('my_role');
  return error ? fail(error) : { data: (data as any) ?? 'client', error: null };
}

export async function getMyConsents(): Promise<DbResult<any[]>> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('consent_records')
    .select('kind,decision,policy_version,recorded_at').eq('user_id', uid).order('recorded_at');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function requestDeletion(): Promise<DbResult<any>> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('deletion_requests')
    .insert({ user_id: uid }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function deletionQueueOwn(): Promise<DbResult<any>> {
  const uid = await sessionUid();
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('deletion_requests')
    .select('id,status,created_at').eq('user_id', uid).in('status', ['REQUESTED', 'IN_REVIEW'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function myRequests(): Promise<DbResult<any[]>> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in to see your requests' };
  const { data, error } = await supabase.from('booking_requests')
    .select('id,request_kind,treatment_name_snapshot,preferred_date,preferred_time_band,notes_client,status,decision_reason,created_at')
    .eq('client_user_id', uid).order('created_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function myEnquiries(): Promise<DbResult<any[]>> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('enquiries')
    .select('id,status,treatment_context_id,created_at,updated_at').eq('client_user_id', uid)
    .order('updated_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

async function sessionUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function enquiryThread(enquiryId: string): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('enquiry_messages')
    .select('id,author_role,body,sent_at').eq('enquiry_id', enquiryId).order('sent_at');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function replyEnquiry(enquiryId: string, body: string): Promise<DbResult<any>> {
  const uid = await sessionUid();
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('enquiry_messages')
    .insert({ enquiry_id: enquiryId, author_user_id: uid, author_role: 'CLIENT', body }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

// ---------------------------------------------------------------- staff/admin reads
export async function staffEnquiries(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('enquiries')
    .select('id,status,client_name_snapshot,treatment_context_id,created_at,updated_at')
    .order('updated_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function staffReplyEnquiry(enquiryId: string, body: string): Promise<DbResult<any>> {
  const uid = await sessionUid();
  if (!uid) return { data: null, error: 'Sign in required' };
  const { data, error } = await supabase.from('enquiry_messages')
    .insert({ enquiry_id: enquiryId, author_user_id: uid, author_role: 'STAFF', body }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function staffUpdatesAll(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('updates')
    .select('id,title,body,status,published_at,created_at').order('created_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function publishUpdate(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<DbResult<boolean>> {
  const patch: any = { status };
  if (status === 'PUBLISHED') patch.published_at = new Date().toISOString();
  const { error } = await supabase.from('updates').update(patch).eq('id', id);
  return error ? fail(error) : { data: true, error: null };
}

export async function createUpdate(title: string, body: string): Promise<DbResult<any>> {
  const uid = await sessionUid();
  const { data, error } = await supabase.from('updates').insert({
    title, body, status: 'PUBLISHED', published_at: new Date().toISOString(), created_by: uid,
  }).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function staffTreatments(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('treatments')
    .select('id,slug,name,price_from_pence,pricing_model,is_featured,published,sort_order')
    .order('sort_order');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function staffClientDetail(userId: string): Promise<DbResult<any>> {
  const { data: profile, error: e1 } = await supabase.from('client_profiles')
    .select('first_name,last_name,phone_e164,phone_raw,phone_verified_at,pseudonymised_at,created_at')
    .eq('user_id', userId).maybeSingle();
  if (e1) return fail(e1);
  const { data: requests, error: e2 } = await supabase.from('booking_requests')
    .select('id,request_kind,treatment_name_snapshot,preferred_date,preferred_time_band,status,created_at')
    .eq('client_user_id', userId).order('created_at', { ascending: false });
  if (e2) return fail(e2);
  const { data: appointments, error: e3 } = await supabase.from('appointments')
    .select('id,type,status,scheduled_start,duration_minutes,treatment_id')
    .eq('client_user_id', userId).order('scheduled_start', { ascending: false });
  if (e3) return fail(e3);
  return { data: { profile, requests: requests ?? [], appointments: appointments ?? [] }, error: null };
}

export async function staffAppointmentsOn(dateFrom: string, dateTo: string): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('appointments')
    .select('id,type,status,scheduled_start,duration_minutes,client_name_snapshot,client_user_id,treatment_id')
    .gte('scheduled_start', dateFrom).lt('scheduled_start', dateTo)
    .order('scheduled_start');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function staffChangeRequests(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('appointments')
    .select('id,type,status,scheduled_start,duration_minutes,client_name_snapshot,client_user_id')
    .in('status', ['CANCEL_REQUESTED', 'RESCHEDULE_REQUESTED']).order('scheduled_start');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function recordAppointmentOutcome(appointmentId: string, outcome: 'COMPLETED' | 'NO_SHOW'): Promise<DbResult<boolean>> {
  const { error } = await supabase.from('appointments').update({ status: outcome }).eq('id', appointmentId);
  return error ? fail(error) : { data: true, error: null };
}

// ---------------------------------------------------------------- owner reads (RLS owner-only)
export async function staffSeats(): Promise<DbResult<any[]>> {
  const { data: roles, error } = await supabase.from('user_roles')
    .select('id,user_id,role,granted_by,revoked_at,created_at').is('revoked_at', null).order('created_at');
  if (error) return fail(error);
  const ids = (roles ?? []).map(r => r.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('client_profiles').select('user_id,first_name,last_name').in('user_id', ids)
    : { data: [] as any[] };
  const byUser = new Map((profiles ?? []).map(p => [p.user_id, p]));
  return { data: (roles ?? []).map(r => ({ ...r, name: byUser.get(r.user_id) ?? null })), error: null };
}

export async function deletionQueue(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('deletion_requests')
    .select('id,user_id,status,created_at,completed_at,note').order('created_at');
  if (error) return fail(error);
  const ids = (data ?? []).map(d => d.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('client_profiles').select('user_id,first_name,last_name').in('user_id', ids)
    : { data: [] as any[] };
  const byUser = new Map((profiles ?? []).map(p => [p.user_id, p]));
  return { data: (data ?? []).map(d => ({ ...d, name: byUser.get(d.user_id) ?? null })), error: null };
}

export async function startDeletionReview(id: string): Promise<DbResult<boolean>> {
  const { error } = await supabase.from('deletion_requests').update({ status: 'IN_REVIEW' }).eq('id', id);
  return error ? fail(error) : { data: true, error: null };
}

export async function applyDeletion(id: string): Promise<DbResult<boolean>> {
  const { error } = await supabase.rpc('apply_deletion', { p_request_id: id });
  return error ? fail(error) : { data: true, error: null };
}
