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
    .select('id,slug,name,summary,price_from_pence,pricing_model,typical_sessions_min,typical_sessions_max,is_featured,show_in_directory,sort_order,disclaimer')
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
  const { data, error } = await supabase.from('client_profiles').upsert({
    clinic_id: input.clinicId, user_id: input.userId, first_name: input.firstName,
    last_name: input.lastName, phone_e164: input.phoneE164, phone_raw: input.phoneRaw,
  }, { onConflict: 'user_id' }).select().maybeSingle();
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
export async function staffQueue(): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.from('booking_requests')
    .select('*, client_profiles(first_name,last_name,phone_e164)')
    .eq('status', 'PENDING').order('created_at', { ascending: false });
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function decideBooking(requestId: string, decision: 'CONFIRMED' | 'DECLINED' | 'RESCHEDULED',
  reason?: string): Promise<DbResult<any>> {
  const { data: me } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('booking_requests').update({
    status: decision, decided_by: me.user?.id ?? null, decision_reason: reason ?? null,
  }).eq('id', requestId).select().maybeSingle();
  return error ? fail(error) : { data, error: null };
}

export async function scheduleAppointments(input: {
  clinicId: string; clientUserId: string; clientNameSnapshot: string; requestId: string;
  treatmentId?: string; chain: { type: 'CONSULTATION' | 'PATCH_TEST' | 'SESSION'; start: string; minutes: number }[];
}): Promise<DbResult<any[]>> {
  const rows = input.chain.map(c => ({
    clinic_id: input.clinicId, client_user_id: input.clientUserId,
    client_name_snapshot: input.clientNameSnapshot, request_id: input.requestId,
    treatment_id: input.treatmentId ?? null, type: c.type, status: 'SCHEDULED',
    scheduled_start: c.start, duration_minutes: c.minutes,
  }));
  const { data, error } = await supabase.from('appointments').insert(rows).select('id,type,scheduled_start');
  return error ? fail(error) : { data: data ?? [], error: null };
}

export async function searchClients(query: string): Promise<DbResult<any[]>> {
  const { data, error } = await supabase.rpc('search_clients', { p_query: query });
  return error ? fail(error) : { data: (data as any[]) ?? [], error: null };
}
