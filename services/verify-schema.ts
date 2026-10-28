// services/verify-schema.ts — three-engine schema verification harness (Engines A, A2, R, B).
// Run: npm run verify        (full suite)
//      npm run verify:rls    (two-user isolation suite only)
// Node 24 executes this TS directly (erasable-syntax only). HTTPS REST + Auth admin API only —
// no direct database connection (works on IPv6-only networks, see docs/schema/05-verification-plan.md).

type Verdict = 'PASS' | 'FAIL' | 'WARN' | 'BLOCKED';

// Expected seed counts come from the SAME file the seeder posts (kickoff rule: counts from files,
// never chat summaries).
const CONTRACT = require('./seed-contract.json') as {
  counts: { categories: number; concerns: number; featured: number; detailPages: number;
    directory: number; dropdownSeeded: number; dropdownAdvisoryExpected: number;
    openingHoursRows: number; coursePackages: number };
  treatments: { slug: string; price: number | null }[];
};

interface CheckResult {
  id: string;
  status: Verdict;
  detail: string;
}

const results: CheckResult[] = [];
function record(id: string, status: Verdict, detail = ''): void {
  results.push({ id, status, detail });
  const mark = { PASS: 'ok  ', FAIL: 'FAIL', WARN: 'WARN', BLOCKED: 'SKIP' }[status];
  console.log(`  [${mark}] ${id} ${detail}`);
}

try {
  process.loadEnvFile('.env');
} catch {
  /* env may be injected by CI instead */
}
const BASE = (process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
if (!BASE || !SERVICE_KEY || !ANON_KEY) {
  console.error('verify needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and EXPO_PUBLIC_SUPABASE_ANON_KEY (.env)');
  process.exitCode = 2;
}

const RUN_ID = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '.' + Math.random().toString(36).slice(2, 7);

interface ApiError { code?: string; message?: string; }
interface ApiRes { ok: boolean; status: number; data: any; err?: ApiError; count?: number; }

async function call(
  method: string,
  path: string,
  o: { token?: string; key?: string; body?: unknown; prefer?: string } = {},
): Promise<ApiRes> {
  const key = o.key ?? SERVICE_KEY;
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${o.token ?? key}`,
    'Content-Type': 'application/json',
  };
  if (o.prefer) headers.Prefer = o.prefer;
  else if (method === 'POST' && path.startsWith('/rest/v1/')) headers.Prefer = 'return=representation';
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: o.body === undefined ? undefined : JSON.stringify(o.body),
    });
  } catch (e: any) {
    return { ok: false, status: 0, data: null, err: { message: 'network error: ' + (e?.message ?? e) } };
  }
  const range = res.headers.get('content-range');
  const count = range ? Number(range.split('/')[1]) : undefined;
  const text = await res.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch { /* keep raw */ }
  return {
    ok: res.ok,
    status: res.status,
    data,
    count,
    err: res.ok ? undefined : typeof data === 'object' && data ? data : { message: String(text).slice(0, 220) },
  };
}

const rest = (m: string, t: string, qs = '', o = {}) => call(m, `/rest/v1/${t}${qs ? '?' + qs : ''}`, o);
const rpc = (fn: string, args: unknown, token?: string) => call('POST', `/rest/v1/rpc/${fn}`, { token, body: args });

const isMissing = (r: ApiRes): boolean =>
  ['PGRST205', 'PGRST202', '42P01', 'PGRST404'].includes(r.err?.code ?? '') || r.status === 404;

async function countRows(table: string, filter: string, token?: string): Promise<number | null> {
  const r = await rest('GET', table, `select=id&${filter}`, { token, prefer: 'count=exact' });
  if (!r.ok) return null;
  return r.count ?? 0;
}

async function rows(table: string, select: string, filter: string, token?: string): Promise<any[] | null> {
  const r = await rest('GET', table, `select=${encodeURIComponent(select)}&${filter}`, { token });
  if (!r.ok) return null;
  return Array.isArray(r.data) ? r.data : null;
}

// ---------------------------------------------------------------- preflight

const PLAN_IDS = [
  'A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10',
  'P-01', 'P-02', 'P-03', 'P-04', 'P-05', 'P-06', 'P-07', 'P-08', 'P-09', 'P-10',
  'P-11', 'P-12', 'P-13', 'P-14', 'P-15',
  'R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06',
  'B-01', 'B-02', 'B-03', 'B-04',
];

async function preflight(): Promise<boolean> {
  const probe = await rest('GET', 'treatments', 'select=id&published=eq.true', { prefer: 'count=exact' });
  if (!probe.ok) {
    console.log('\n  Schema probe failed on public.treatments — demo schema is NOT applied yet.');
    console.log(`  Probe: HTTP ${probe.status} ${JSON.stringify(probe.err)}`);
    console.log('  Apply supabase/schema.sql + rls.sql + introspection.sql, seed from verified site');
    console.log('  content, then re-run. All checks report BLOCKED (never silently skipped).\n');
    for (const id of PLAN_IDS) record(id, 'BLOCKED', 'schema not applied (treatments probe failed)');
    return false;
  }
  const c = probe.count ?? 0;
  console.log(`  treatments present (${c} published rows) — running engines`);
  return true;
}

// ---------------------------------------------------------------- Engine A

async function engineA(): Promise<void> {
  console.log('\nEngine A — catalogue & seed contract');

  const featured = await rows('treatments', 'id,price_from_pence,pricing_model', 'is_featured=eq.true');
  if (featured && featured.length === CONTRACT.counts.featured &&
      featured.every(t => Number.isInteger(t.price_from_pence) && t.price_from_pence >= 3500 &&
        t.price_from_pence <= 12000 && t.pricing_model === 'FROM_PRICE')) {
    record('A-01', 'PASS', `8 core priced, pence integers 3500–12000, FROM_PRICE`);
  } else {
    record('A-01', 'FAIL', `featured=${featured?.length ?? 'read-fail'} ${JSON.stringify(featured?.map(t => [t.price_from_pence, t.pricing_model]))}`);
  }

  for (const [id, flag, want, advisory] of [
    ['A-02', 'has_detail_page', CONTRACT.counts.detailPages, false],
    ['A-03', 'show_in_directory', CONTRACT.counts.directory, false],
  ] as [string, string, number, boolean][]) {
    const c = await countRows('treatments', `${flag}=eq.true`);
    record(id, c === want ? 'PASS' : 'FAIL', `${flag}=${c} (expected ${want})`);
  }

  const dd = await countRows('treatments', 'show_in_booking_dropdown=eq.true');
  const ddWant = CONTRACT.counts.dropdownAdvisoryExpected;
  record('A-04', dd === ddWant ? 'PASS' : 'WARN',
    `dropdown=${dd} vs ${ddWant} advisory — /book/ form is JS-rendered, composition unverified (DA-14; seeded ${CONTRACT.counts.dropdownSeeded})`);

  const cats = await countRows('treatment_categories', 'published=eq.true');
  const cons = await countRows('treatment_concerns', 'id=not.is.null');
  record('A-05', cats === CONTRACT.counts.categories && cons === CONTRACT.counts.concerns ? 'PASS' : 'FAIL',
    `categories=${cats} concerns=${cons}`);

  const hours = await rows('opening_hours', 'weekday,opens,closes,is_open,valid_from', 'is_open=eq.true&order=valid_from.desc,weekday.asc');
  const latest = new Map<number, any>();
  (hours ?? []).forEach(h => { if (!latest.has(h.weekday)) latest.set(h.weekday, h); });
  const hoursOk = latest.size === 7 && [...latest.values()].every(h => h.opens === '10:00:00' && h.closes === '18:00:00');
  record('A-06', hoursOk ? 'PASS' : 'FAIL', `10:00–18:00 on ${latest.size}/7 weekdays (W01 verified truth)`);

  const bad = await rest('POST', 'treatments', 'select=id', {
    body: { clinic_id: await firstClinicId(), category_id: await firstCategoryId(), slug: 'zz-verify-' + RUN_ID, name: 'ZZ probe', pricing_model: 'PER_SESSION', price_from_pence: null, published: false },
  });
  if (bad.ok && bad.data?.[0]?.id) await rest('DELETE', 'treatments', `id=eq.${bad.data[0].id}`);
  record('A-07', !bad.ok ? 'PASS' : 'FAIL',
    bad.ok ? 'NULL price + PER_SESSION was accepted — CHECK missing' : `rejected (${bad.err?.code})`);

  const packs = await rows('course_packages', 'name,sessions_count,discount_percent', 'id=not.is.null&limit=20');
  if (!packs || packs.length === 0) record('A-08', 'BLOCKED', 'no course_packages seeded yet');
  else record('A-08', packs.every(p => p.sessions_count === 6 && (p.discount_percent === null || p.discount_percent === 20)) ? 'PASS' : 'FAIL',
    `${packs.length} packages, each 6×20% (verified /faqs/) or discount NULL`);

  // R06 tripwire: BEFORE trigger fires before FK, so a fake user still proves the guard.
  const some = await rows('treatments', 'name', 'is_featured=eq.true&limit=1');
  const tname = some?.[0]?.name ?? 'Laser Hair Removal';
  const poison = await rest('POST', 'notifications', '', {
    body: { user_id: '00000000-0000-0000-0000-000000000000', kind: 'BOOKING_UPDATE', title: 'update', body: `Your ${tname} session is confirmed`, route: '/home' },
  });
  const control = await rest('POST', 'notifications', '', {
    body: { user_id: '00000000-0000-0000-0000-000000000000', kind: 'BOOKING_UPDATE', title: 'An update from Unique Laser Clinics', body: 'An update from Unique Laser Clinics — open the app to view.', route: '/home' },
  });
  const tripOk = !poison.ok && /R06|P0001/.test(JSON.stringify(poison.err ?? ''));
  const controlOk = !control.ok && ['23503', '400'].includes(String(control.err?.code)) || control.ok;
  record('A-09', tripOk && controlOk ? 'PASS' : 'FAIL', `treatment-name body rejected=${tripOk}; generic body passed trigger=${!poison.ok && control.err?.code !== 'P0001'}`);

  const anyT = await rows('treatments', 'id', 'limit=1');
  const lower = anyT?.[0]?.id
    ? await rest('PATCH', 'treatments', `id=eq.${anyT[0].id}`, { body: { pricing_model: 'per_session' } })
    : { ok: false, status: 0, data: null, err: { code: 'n/a' } } as ApiRes;
  record('A-10', !lower.ok && String(lower.err?.code).startsWith('22') ? 'PASS' : lower.ok ? 'FAIL' : 'WARN',
    `lowercase enum label rejected as ${lower.err?.code ?? 'n/a'} (contract: labels UPPERCASE, 01 §2e)`);
}

async function firstClinicId(): Promise<string> {
  const r = await rows('clinics', 'id', 'limit=1');
  return r?.[0]?.id ?? '00000000-0000-0000-0000-000000000000';
}
async function firstCategoryId(): Promise<string> {
  const r = await rows('treatment_categories', 'id', 'limit=1');
  return r?.[0]?.id ?? '00000000-0000-0000-0000-000000000000';
}

// ---------------------------------------------------------------- personas (Engine A2/R)

interface Persona { id: string; token: string; email: string; }
const P = {} as Record<'owner' | 'staff1' | 'staff2' | 'staff3' | 'clientA' | 'clientB', Persona>;
const PW = 'Vr' + RUN_ID.replace(/\W/g, '') + '!aA';

async function makePersona(name: string): Promise<Persona> {
  const email = `verify+${RUN_ID}-${name}@example.invalid`;
  const created = await call('POST', '/auth/v1/admin/users', { body: { email, password: PW, email_confirm: true } });
  if (!created.ok) throw new Error(`persona ${name}: ${JSON.stringify(created.err)}`);
  const tok = await call('POST', '/auth/v1/token?grant_type=password', { key: ANON_KEY, body: { email, password: PW } });
  if (!tok.ok) throw new Error(`signin ${name}: ${JSON.stringify(tok.err)}`);
  return { id: created.data.id, token: tok.data.access_token, email };
}

let treatmentHair: any = null;
let treatmentTattoo: any = null;

async function engineA2(): Promise<void> {
  console.log('\nEngine A2 — persona & lifecycle');
  try {
    await Promise.all(['owner', 'staff1', 'staff2', 'staff3', 'clientA', 'clientB'].map(async n => { P[n as keyof typeof P] = await makePersona(n); }));
  } catch (e: any) {
    ['P-01','P-02','P-03','P-04','P-05','P-06','P-07','P-08','P-09','P-10','P-11','P-12','P-13','P-14','P-15']
      .forEach(id => record(id, 'BLOCKED', 'personas unavailable: ' + e.message));
    return;
  }
  const clinic = await firstClinicId();
  // Bootstrap the owner seat (stands in for the one-off deploy step; only service role can, since
  // owner-gating means a brand-new owner has no grants yet).
  await rest('POST', 'user_roles', 'select=id', { body: { clinic_id: clinic, user_id: P.owner.id, role: 'owner', granted_by: P.owner.id } });
  [treatmentHair, treatmentTattoo] = [
    (await rows('treatments', 'id,name,price_from_pence,min_gap_days', "name=eq.Laser Hair Removal&limit=1"))?.[0],
    (await rows('treatments', 'id,name,price_from_pence,min_gap_days', "name=eq.Laser Tattoo Removal&limit=1"))?.[0],
  ];

  // P-11 seats: owner grants staff1/staff2, third staff seat must hit the cap trigger.
  const grant = (u: string, role: string) => rest('POST', 'user_roles', 'select=id', { token: P.owner.token, body: { clinic_id: clinic, user_id: u, role, granted_by: P.owner.id } });
  const g1 = await grant(P.staff1.id, 'staff');
  const g2 = await grant(P.staff2.id, 'staff');
  const g3 = await grant(P.staff3.id, 'staff');
  record('P-11', g1.ok && g2.ok && !g3.ok ? 'PASS' : 'FAIL', `2 grants ok; 3rd rejected=${!g3.ok} (${g3.err?.code ?? 'ACCEPTED — seat cap missing'})`);
  const staffDenied = await grant(P.clientA.id, 'staff');
  if (staffDenied.ok) record('P-11', 'FAIL', 'staff could grant roles');

  // P-01 sign-up + consent (client-side inserts via own token).
  const prof = await rest('POST', 'client_profiles', 'select=id,phone_e164', { token: P.clientA.token, body: { clinic_id: clinic, user_id: P.clientA.id, first_name: 'Verify', last_name: 'ClientA', phone_e164: '+4479' + Math.floor(10000000 + Math.random() * 89999999) } });
  const consent = await rest('POST', 'consent_records', '', { token: P.clientA.token, body: { clinic_id: clinic, user_id: P.clientA.id, kind: 'DATA_PROCESSING', policy_version: 'verify-1', policy_text_hash: 'x'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: new Date().toISOString() } });
  record('P-01', prof.ok && consent.ok ? 'PASS' : 'FAIL', `profile=${prof.ok} consent=${consent.ok} (${JSON.stringify([prof.err?.code, consent.err?.code])})`);

  // P-02 verified-phone uniqueness (DA-12).
  const aPhone = prof.data?.[0]?.phone_e164;
  if (aPhone) {
    await rest('PATCH', 'client_profiles', `user_id=eq.${P.clientA.id}`, { body: { phone_verified_at: new Date().toISOString() } }); // service marks A verified (stands in for OTP)
    const b1 = await rest('POST', 'client_profiles', 'select=id', { token: P.clientB.token, body: { clinic_id: clinic, user_id: P.clientB.id, first_name: 'Verify', last_name: 'ClientB', phone_e164: '+4479' + Math.floor(10000000 + Math.random() * 89999999) } });
    const b2 = await rest('PATCH', 'client_profiles', `user_id=eq.${P.clientB.id}`, { body: { phone_e164: aPhone, phone_verified_at: new Date().toISOString() } }); // B claims A's verified number -> unique violation
    record('P-02', b1.ok && !b2.ok && String(b2.err?.code) === '23505' ? 'PASS' : 'FAIL', `unverified distinct ok=${b1.ok}; duplicate-verified rejected=${!b2.ok} (${b2.err?.code})`);
  } else record('P-02', 'BLOCKED', 'profile insert failed upstream');

  // P-03 booking request: server-computed snapshot + idempotency.
  const idem = randomUuid();
  const reqBody = { clinic_id: clinic, client_user_id: P.clientA.id, request_kind: 'TREATMENT', treatment_id: treatmentHair?.id ?? null, preferred_date: isoDay(7), preferred_time_band: 'MORNING', notes_client: 'Prefer mornings please.' };
  const req1 = treatmentHair ? await rest('POST', 'booking_requests', 'select=*', { token: P.clientA.token, body: { ...reqBody, idempotency_key: idem } }) : { ok: false, status: 0, data: null, err: { code: 'BLOCKED' }, count: 0 } as ApiRes;
  const req2 = await rest('POST', 'booking_requests', 'select=id', { token: P.clientA.token, body: { ...reqBody, idempotency_key: idem } });
  const snapOk = req1.ok && req1.data?.[0]?.price_from_pence_snapshot === treatmentHair?.price_from_pence && req1.data?.[0]?.status === 'PENDING';
  record('P-03', snapOk && !req2.ok && String(req2.err?.code) === '23505' ? 'PASS' : 'FAIL',
    `snapshot server-computed=${!!snapOk} status-forced=${req1.data?.[0]?.status}; replay rejected=${!req2.ok} (${JSON.stringify(req1.err ?? req2.err ?? '')})`);
  const requestId = req1.data?.[0]?.id;

  // P-04 + P-05 confirm chain; session-before-patch warning must be audited.
  if (requestId) {
    const conf = await rest('PATCH', 'booking_requests', `id=eq.${requestId}`, { token: P.staff1.token, body: { status: 'CONFIRMED', decided_by: P.staff1.id } });
    const mkAppt = (type: string, startISO: string) => rest('POST', 'appointments', 'select=id,status', { token: P.staff1.token, body: { clinic_id: clinic, client_user_id: P.clientA.id, client_name_snapshot: 'Verify ClientA', request_id: requestId, treatment_id: treatmentHair?.id, type, status: 'SCHEDULED', scheduled_start: startISO, duration_minutes: 30 } });
    const c1 = await mkAppt('CONSULTATION', isoTs(1));
    const c2 = await mkAppt('PATCH_TEST', isoTs(1));
    const c3 = await mkAppt('SESSION', isoTs(4)); // patch not completed yet -> soft warn (P-05)
    const ev = await countRows('booking_request_events', `request_id=eq.${requestId}&action=eq.CONFIRMED`);
    record('P-04', conf.ok && [c1, c2, c3].every(c => c.ok) && (ev ?? 0) >= 1 ? 'PASS' : 'FAIL',
      `confirm=${conf.ok} chain=${[c1, c2, c3].map(c => c.ok)} events=${ev} (${JSON.stringify([conf.err, c1.err, c2.err, c3.err].filter(Boolean).map(e => e?.code))})`);
    const warn = await countRows('audit_log', `action=eq.patch_test_warning&meta->>request_id=eq.${requestId}`);
    record('P-05', c3.ok && (warn ?? 0) >= 1 ? 'PASS' : 'FAIL', `session inserted (soft) with audit warn rows=${warn}`);

    // P-06 gap warn: complete a tattoo session in the past, book next +14d (< 42).
    if (treatmentTattoo?.min_gap_days) {
      const old = await mkApptGap(treatmentTattoo, 'SESSION', isoTs(-10));
      if (old.data?.[0]?.id) await rest('PATCH', 'appointments', `id=eq.${old.data[0].id}`, { token: P.staff1.token, body: { status: 'COMPLETED' } });
      const soon = await mkApptGap(treatmentTattoo, 'SESSION', isoTs(14));
      const gapWarn = await countRows('audit_log', `action=eq.session_gap_warning&target_id=eq.${soon.data?.[0]?.id}`);
      record('P-06', soon.ok && (gapWarn ?? 0) >= 1 ? 'PASS' : 'FAIL', `tattoo +14d after completed: warned=${gapWarn}`);
    } else record('P-06', 'BLOCKED', 'treatment min_gap_days not seeded (Q13)');

    // P-07 reminder idempotency.
    const apptId = c3.data?.[0]?.id;
    if (apptId) {
      const rem = { appointment_id: apptId, user_id: P.clientA.id, channel: 'PUSH', scheduled_for: isoTs(3), status: 'SCHEDULED' };
      const r1 = await rest('POST', 'reminders', '', { token: P.staff1.token, body: { ...rem, clinic_id: clinic } });
      const r2 = await rest('POST', 'reminders', '', { token: P.staff1.token, body: { ...rem, clinic_id: clinic } });
      record('P-07', r1.ok && !r2.ok && String(r2.err?.code) === '23505' ? 'PASS' : 'FAIL', `first=${r1.ok} duplicate rejected=${!r2.ok} (${r2.err?.code})`);

      // P-10 cancel/reschedule via RPC.
      const cx = await rpc('request_appointment_change', { p_appointment_id: apptId, p_kind: 'CANCEL_REQUESTED' }, P.clientA.token);
      if (isMissing(cx)) record('P-10', 'BLOCKED', 'RPC request_appointment_change missing (schema prereq, 05 §Prereqs)');
      else {
        const st = await rows('appointments', 'status', `id=eq.${apptId}`, P.clientA.token);
        const ev2 = await countRows('appointment_events', `appointment_id=eq.${apptId}&action=eq.CANCEL_REQUESTED`);
        record('P-10', st?.[0]?.status === 'CANCEL_REQUESTED' && (ev2 ?? 0) >= 1 ? 'PASS' : 'FAIL', `status=${st?.[0]?.status} events=${ev2}`);
      }
    } else record('P-07', 'BLOCKED', 'no appointment id');
  } else {
    ['P-04', 'P-05', 'P-06', 'P-07', 'P-10'].forEach(id => record(id, 'BLOCKED', 'no booking_request (P-03 failed or hair treatment missing)'));
  }

  // P-08 updates lifecycle.
  const upd = await rest('POST', 'updates', 'select=id,status', { token: P.staff1.token, body: { clinic_id: clinic, title: 'Verify draft ' + RUN_ID, body: 'Draft body.', status: 'DRAFT', created_by: P.staff1.id } });
  if (upd.ok) {
    const upId = upd.data[0].id;
    const clientSeesDraft = await rows('updates', 'id', `id=eq.${upId}`, P.clientA.token);
    const anonSeesDraft = (await rest('GET', 'updates', `id=eq.${upId}`, { key: ANON_KEY, token: ANON_KEY })).data;
    const pub = await rest('PATCH', 'updates', `id=eq.${upId}`, { token: P.staff1.token, body: { status: 'PUBLISHED', published_at: new Date().toISOString() } });
    const read = await rest('POST', 'update_reads', '', { token: P.clientA.token, body: { update_id: upId, user_id: P.clientA.id, read_at: new Date().toISOString() } });
    const edit = await rest('PATCH', 'updates', `id=eq.${upId}`, { token: P.staff1.token, body: { body: 'Edited body — still published.' } });
    const revs = await countRows('update_revisions', `update_id=eq.${upId}`);
    record('P-08', (clientSeesDraft?.length ?? 1) === 0 && (anonSeesDraft?.length ?? 1) === 0 && pub.ok && read.ok && edit.ok && (revs ?? 0) >= 1 ? 'PASS' : 'FAIL',
      `draft hidden(client,anon)=${clientSeesDraft?.length === 0},${anonSeesDraft?.length === 0}; published=${pub.ok}; read=${read.ok}; revisions=${revs}`);
  } else record('P-08', 'FAIL', 'draft update insert rejected: ' + JSON.stringify(upd.err));

  // P-09 enquiry answer flip.
  const enq = await rest('POST', 'enquiries', 'select=id,status', { token: P.clientA.token, body: { clinic_id: clinic, client_user_id: P.clientA.id, client_name_snapshot: 'Verify ClientA', status: 'OPEN' } });
  if (enq.ok) {
    const enqId = enq.data[0].id;
    const ask = await rest('POST', 'enquiry_messages', '', { token: P.clientA.token, body: { enquiry_id: enqId, author_user_id: P.clientA.id, author_role: 'CLIENT', body: 'How many sessions will I need?', sent_at: new Date().toISOString() } });
    const reply = await rest('POST', 'enquiry_messages', '', { token: P.staff2.token, body: { enquiry_id: enqId, author_user_id: P.staff2.id, author_role: 'STAFF', body: 'Six to eight for hair removal — confirmed at consultation.', sent_at: new Date().toISOString() } });
    const st = await rows('enquiries', 'status', `id=eq.${enqId}`, P.clientA.token);
    record('P-09', ask.ok && reply.ok && st?.[0]?.status === 'ANSWERED' ? 'PASS' : 'FAIL', `ask=${ask.ok} reply=${reply.ok} status=${st?.[0]?.status}`);
    // R suite data: B thread + request rows exist below in engineR via quick inserts.
  } else record('P-09', 'FAIL', 'enquiry insert rejected ' + JSON.stringify(enq.err));

  // P-12 price edit -> history row (S17/R05).
  const t0 = (await rows('treatments', 'id,price_from_pence', 'is_featured=eq.true&limit=1'))?.[0];
  if (t0) {
    const np = t0.price_from_pence + 100;
    const p = await rest('PATCH', 'treatments', `id=eq.${t0.id}`, { token: P.staff1.token, body: { price_from_pence: np } });
    const hist = await countRows('treatment_price_history', `treatment_id=eq.${t0.id}&new_price_pence=eq.${np}`);
    await rest('PATCH', 'treatments', `id=eq.${t0.id}`, { token: P.staff1.token, body: { price_from_pence: t0.price_from_pence } });
    record('P-12', p.ok && (hist ?? 0) >= 1 ? 'PASS' : 'FAIL', `edit=${p.ok} history rows=${hist}`);
  } else record('P-12', 'BLOCKED', 'no seeded treatment');

  // P-13 directory RPC audited.
  const search = await rpc('search_clients', { p_query: 'Verify' }, P.staff1.token);
  if (isMissing(search)) record('P-13', 'BLOCKED', 'RPC app.search_clients missing');
  else {
    const audit = await countRows('audit_log', `action=eq.directory_view&actor_user_id=eq.${P.staff1.id}`);
    record('P-13', search.ok && (audit ?? 0) >= 1 ? 'PASS' : 'FAIL', `rows=${Array.isArray(search.data) ? search.data.length : 'n/a'} audit=${audit}`);
  }

  // P-14 deletion pipeline.
  const del = await rest('POST', 'deletion_requests', 'select=id,status', { token: P.clientA.token, body: { clinic_id: clinic, user_id: P.clientA.id, status: 'REQUESTED' } });
  if (!del.ok) record('P-14', 'FAIL', 'deletion request rejected ' + JSON.stringify(del.err));
  else {
    const own = await rpc('apply_deletion', { p_request_id: del.data[0].id }, P.owner.token);
    if (isMissing(own)) record('P-14', 'BLOCKED', 'deletion pipeline RPC/Edge missing (apply_deletion) — designed in 03-sec §6');
    else {
      const shell = await rows('appointments', 'id,client_name_snapshot', `client_user_id=eq.${P.clientA.id}`, undefined);
      const prof2 = await rows('client_profiles', 'first_name,pseudonymised_at', `user_id=eq.${P.clientA.id}`, undefined);
      const consentKept = await countRows('consent_records', `user_id=eq.${P.clientA.id}`);
      record('P-14', shell && shell.length >= 1 && prof2?.[0]?.pseudonymised_at && (consentKept ?? 0) >= 1 ? 'PASS' : 'FAIL',
        `appointments kept=${shell?.length} pseudonymised=${!!prof2?.[0]?.pseudonymised_at} consents kept=${consentKept}`);
    }
  }

  // P-15 hours versioning.
  const tomorrow = isoDay(1);
  await rest('DELETE', 'opening_hours', `clinic_id=eq.${clinic}&weekday=eq.1&valid_from=eq.${tomorrow}`);
  const newRow = await rest('POST', 'opening_hours', 'select=valid_from', { token: P.owner.token, body: { clinic_id: clinic, weekday: 1, is_open: true, opens: '10:00', closes: '18:00', valid_from: tomorrow } });
  const curToday = await rows('opening_hours', 'opens', 'weekday=eq.1&valid_from=lte.' + isoDay(0) + '&order=valid_from.desc&limit=1');
  record('P-15', newRow.ok && curToday?.[0]?.opens === '10:00:00' ? 'PASS' : 'FAIL', `tomorrow-row=${newRow.ok} current still 10:00=${curToday?.[0]?.opens}`);
  await rest('DELETE', 'opening_hours', `clinic_id=eq.${clinic}&weekday=eq.1&valid_from=eq.${tomorrow}`);
}

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = Math.floor(Math.random() * 16);
    return (ch === 'x' ? r : (r % 4) + 8).toString(16);
  });
}
function isoDay(offset: number): string {
  const d = new Date(Date.now() + offset * 864e5);
  return d.toISOString().slice(0, 10);
}
function isoTs(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 11) + '09:00:00+00';
}
async function mkApptGap(t: any, type: string, start: string) {
  return rest('POST', 'appointments', 'select=id', { token: P.staff1.token, body: { clinic_id: await firstClinicId(), client_user_id: P.clientA.id, client_name_snapshot: 'Verify ClientA', treatment_id: t.id, type, status: 'SCHEDULED', scheduled_start: start, duration_minutes: 30 } });
}

// ---------------------------------------------------------------- Engine R

const APPEND_ONLY_TABLES = ['booking_request_events', 'appointment_events', 'treatment_price_history', 'update_revisions', 'enquiry_messages', 'consent_records', 'audit_log'];

async function engineR(): Promise<void> {
  console.log('\nEngine R — two-user RLS isolation (R07)');
  if (!P.clientA || !P.clientB) {
    // verify:rls standalone — bootstrap personas and minimal rows so isolation is provable.
    try {
      await Promise.all(['owner', 'staff1', 'staff2', 'clientA', 'clientB'].map(async n => { P[n as keyof typeof P] = await makePersona(n); }));
      const cl = await firstClinicId();
      await rest('POST', 'user_roles', '', { body: { clinic_id: cl, user_id: P.owner.id, role: 'owner', granted_by: P.owner.id } });
      await rest('POST', 'user_roles', '', { body: { clinic_id: cl, user_id: P.staff1.id, role: 'staff', granted_by: P.owner.id } });
      for (const who of [P.clientA, P.clientB]) {
        await rest('POST', 'client_profiles', '', { body: { clinic_id: cl, user_id: who.id, first_name: 'Verify', last_name: who.email.split('-')[1] ?? who.id.slice(0, 4), phone_e164: '+4479' + Math.floor(10000000 + Math.random() * 89999999) } });
        await rest('POST', 'consent_records', '', { body: { user_id: who.id, kind: 'DATA_PROCESSING', policy_version: 'verify-1', policy_text_hash: 'z'.repeat(64), decision: 'GRANTED', source: 'APP' } });
        await rest('POST', 'booking_requests', '', { body: { clinic_id: cl, client_user_id: who.id, request_kind: 'ADVISE_ME', preferred_date: isoDay(2), preferred_time_band: 'MORNING', notes_client: 'isolation probe ' + RUN_ID } });
      }
    } catch (e: any) {
      ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06'].forEach(id => record(id, 'BLOCKED', 'persona bootstrap failed: ' + e.message));
      return;
    }
  }
  // ensure B has data of every kind (service-key bootstrap so isolation failures are unambiguous)
  const clinic = await firstClinicId();
  await rest('POST', 'client_profiles', '', { body: { clinic_id: clinic, user_id: P.clientB.id, first_name: 'Verify', last_name: 'ClientB2', phone_e164: '+447911' + Math.floor(1000000 + Math.random() * 8999999) } });
  await rest('POST', 'consent_records', '', { body: { clinic_id: clinic, user_id: P.clientB.id, kind: 'DATA_PROCESSING', policy_version: 'verify-1', policy_text_hash: 'y'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: new Date().toISOString() } });
  const bReq = await rest('POST', 'booking_requests', 'select=id', { body: { clinic_id: clinic, client_user_id: P.clientB.id, request_kind: 'ADVISE_ME', preferred_date: isoDay(3), preferred_time_band: 'EVENING' } });
  const bEnq = await rest('POST', 'enquiries', 'select=id', { body: { clinic_id: clinic, client_user_id: P.clientB.id, client_name_snapshot: 'B', status: 'OPEN' } });
  await rest('POST', 'notifications', '', { body: { user_id: P.clientB.id, kind: 'BOOKING_UPDATE', title: 'An update from Unique Laser Clinics', body: 'An update from Unique Laser Clinics — open the app to view.', route: '/home' } });

  const ownerColumn: Record<string, string> = {
    client_profiles: 'user_id', consent_records: 'user_id', notifications: 'user_id',
    booking_requests: 'client_user_id', appointments: 'client_user_id', enquiries: 'client_user_id',
  };
  const leakTables = Object.keys(ownerColumn);
  const leaks: string[] = [];
  for (const t of leakTables) {
    const seen = await rest('GET', t, `select=id,${ownerColumn[t]}`, { token: P.clientA.token });
    if (!seen.ok) { leaks.push(`${t}:unreadable(${seen.err?.code})`); continue; }
    const foreign = (seen.data ?? []).filter((r: any) => r[ownerColumn[t]] === P.clientB.id);
    if (foreign.length) leaks.push(`${t}:${foreign.length}`);
  }
  record('R-01', leaks.length === 0 ? 'PASS' : 'FAIL', `client A saw B-rows in: ${leaks.join(', ') || 'nothing'}`);

  const byId = bReq.ok ? await rows('booking_requests', 'id', `id=eq.${bReq.data[0].id}`, P.clientA.token) : null;
  record('R-02', byId?.length === 0 ? 'PASS' : 'FAIL', `B request by id readable by A: ${byId?.length ?? 'n/a'}`);

  const anonContent = await rest('GET', 'treatments', 'select=id&limit=1', { key: ANON_KEY, token: ANON_KEY });
  const anonFaqs = await rest('GET', 'faq_items', 'select=id&limit=1', { key: ANON_KEY, token: ANON_KEY });
  const anonHours = await rest('GET', 'opening_hours', 'select=id&limit=1', { key: ANON_KEY, token: ANON_KEY });
  const anonPub = await rest('GET', 'updates', 'select=id&status=eq.PUBLISHED', { key: ANON_KEY, token: ANON_KEY });
  const anonDraft = await rest('GET', 'updates', 'select=id&status=eq.DRAFT', { key: ANON_KEY, token: ANON_KEY });
  const anonPersonal = await rest('GET', 'booking_requests', 'select=id', { key: ANON_KEY, token: ANON_KEY });
  const ok3 = (anonContent.data?.length ?? 0) > 0 && anonFaqs.ok && anonHours.ok && anonPub.ok &&
    (anonDraft.data?.length ?? 1) === 0 && ((anonPersonal.data?.length ?? 1) === 0 || !anonPersonal.ok);
  record('R-03', ok3 ? 'PASS' : 'FAIL', `content=${[anonContent, anonFaqs, anonHours].map(r => r.ok)} drafts=${anonDraft.data?.length} personal=${anonPersonal.ok ? anonPersonal.data?.length : '403'}`);

  let aOwnReqId: string | undefined;
  {
    const mine = await rows('booking_requests', 'id,status', `client_user_id=eq.${P.clientA.id}&status=eq.PENDING`, P.clientA.token);
    aOwnReqId = mine?.[0]?.id;
  }
  const stat = aOwnReqId ? await rest('PATCH', 'booking_requests', `id=eq.${aOwnReqId}`, { token: P.clientA.token, body: { status: 'CONFIRMED' } }) : null;
  const roleWrite = await rest('POST', 'user_roles', '', { token: P.clientA.token, body: { clinic_id: clinic, user_id: P.clientA.id, role: 'staff', granted_by: P.clientA.id } });
  const rejected = (stat === null || !stat.ok || (await rows('booking_requests', 'status', `id=eq.${aOwnReqId}`, P.clientA.token))?.[0]?.status === 'PENDING');
  record('R-04', rejected && !roleWrite.ok ? 'PASS' : 'FAIL', `client status-update rejected=${rejected} role-insert rejected=${!roleWrite.ok}`);

  const tamperFails: string[] = [];
  for (const t of APPEND_ONLY_TABLES) {
    const sample = await rest('GET', t, 'select=id&limit=1');
    const id = sample.data?.[0]?.id;
    if (!id) continue;
    const body = t === 'consent_records' ? { policy_version: 'tamper' }
      : t === 'enquiry_messages' ? { body: 'tamper' }
      : t === 'audit_log' ? { action: 'tamper' }
      : t === 'treatment_price_history' ? { reason: 'tamper' }
      : { detail: { tamper: true } };
    for (const who of [P.clientA.token, P.staff1.token, undefined]) {
      const u = await rest('PATCH', t, `id=eq.${id}`, { token: who, body, prefer: 'return=representation' });
      const d = await rest('DELETE', t, `id=eq.${id}`, { token: who, prefer: 'return=representation' });
      const uTouched = u.ok && Array.isArray(u.data) && u.data.length > 0;
      const dTouched = d.ok && Array.isArray(d.data) && d.data.length > 0;
      if (uTouched || dTouched) tamperFails.push(`${t}:${who ? 'auth' : 'service'}-${uTouched ? 'U' : 'D'}`);
    }
  }
  record('R-05', tamperFails.length === 0 ? 'PASS' : 'FAIL', `append-only tamper accepted: ${tamperFails.join(', ') || 'none (incl. service — guard trigger leash)'}`);

  const staffGrant = await rest('POST', 'user_roles', '', { token: P.staff1.token, body: { clinic_id: clinic, user_id: P.clientB.id, role: 'owner', granted_by: P.staff1.id } });
  record('R-06', !staffGrant.ok ? 'PASS' : 'FAIL', `staff self-escalation rejected=${!staffGrant.ok}`);
}

// ---------------------------------------------------------------- Engine B

async function engineB(): Promise<void> {
  console.log('\nEngine B — introspection RPC (supabase/introspection.sql)');
  const r = await rpc('get_schema_introspection', {});
  if (isMissing(r)) {
    ['B-01','B-02','B-03','B-04'].forEach(id => record(id, 'BLOCKED', 'get_schema_introspection() missing — apply supabase/introspection.sql'));
    return;
  }
  const j = r.data;
  record('B-01', (j.rls_missing?.length ?? 1) === 0 ? 'PASS' : 'FAIL', `RLS missing: ${JSON.stringify(j.rls_missing)}`);
  const clinicalOk = j.clinical?.exists === false || (j.clinical?.schema_level_grants?.length === 0 && j.clinical?.table_grants?.length === 0);
  record('B-02', (j.public_health_columns?.length ?? 1) === 0 && clinicalOk ? 'PASS' : 'FAIL',
    `public health cols=${JSON.stringify(j.public_health_columns)} clinical grants=${JSON.stringify(j.clinical)}`);
  record('B-03', (j.money_violations?.length ?? 1) === 0 && (j.mutable_timestamp_gaps?.length ?? 1) === 0 && (j.append_only_gaps?.length ?? 1) === 0 ? 'PASS' : 'FAIL',
    `money=${JSON.stringify(j.money_violations)} ts=${JSON.stringify(j.mutable_timestamp_gaps)} append=${JSON.stringify(j.append_only_gaps)}`);
  record('B-04', (j.enum_label_violations?.length ?? 1) === 0 && (j.required_triggers_missing?.length ?? 1) === 0 ? 'PASS' : 'FAIL',
    `enum=${JSON.stringify(j.enum_label_violations)} triggers=${JSON.stringify(j.required_triggers_missing)}`);
}

// ---------------------------------------------------------------- cleanup

async function cleanup(): Promise<void> {
  const purge = await rpc('purge_verification_data', { run_id: RUN_ID });
  if (isMissing(purge)) {
    record('CLEANUP', 'WARN', `purge_verification_data missing — run ${RUN_ID} rows (tagged) remain; persona auth users kept for manual cleanup`);
    return;
  }
  record('CLEANUP', purge.ok ? 'PASS' : 'FAIL', `purged run ${RUN_ID}` + (purge.ok ? ' (auth users may still need removal if RESTRICT rows remain)' : ' ' + JSON.stringify(purge.err)));
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const rlsOnly = process.argv.includes('--rls-only');
  console.log(`\n=== Unique Laser Clinics — schema verification (run ${RUN_ID}) ===`);
  const live = await preflight();
  if (live) {
    if (!rlsOnly) {
      await engineA();
      await engineA2();
    }
    await engineR();
    if (!rlsOnly) await engineB();
    await cleanup();
  }
  const tally = results.reduce((a: Record<string, number>, r2) => { a[r2.status] = (a[r2.status] ?? 0) + 1; return a; }, {} as Record<string, number>);
  console.log(`\n=== ${rlsOnly ? 'verify:rls' : 'verify'}: ${tally.PASS ?? 0} PASS · ${tally.FAIL ?? 0} FAIL · ${tally.WARN ?? 0} WARN · ${tally.BLOCKED ?? 0} BLOCKED ===`);
  const fails = results.filter(r2 => r2.status === 'FAIL');
  if (fails.length) console.log('Failures:\n' + fails.map(f => `  ${f.id}: ${f.detail}`).join('\n'));
  const blocked = results.filter(r2 => r2.status === 'BLOCKED');
  if (blocked.length) console.log(`Blocked checks need: applied schema (schema.sql/rls.sql/introspection.sql) + seed + prereq triggers/RPCs — see docs/schema/05-verification-plan.md and docs/schema-coaching/03-schema-status.md SUITE row.`);
  process.exitCode = fails.length || blocked.length ? 1 : 0;
}

if ((process.exitCode ?? 0) !== 2) main().catch(e => { console.error('verify crashed:', e); process.exitCode = 3; });
