// services/seed-demo.ts — MOCK demo personas + presentation state (client directive 2026-10-28 §2).
// Emails are *.demo@uniquelaser.test — never real clients; passwords are fixed demo credentials
// printed below, documented, and ONLY for the clinic presentation build. Idempotent: guarded
// append-only tables (consents, enquiry_messages) insert-if-missing; mutable demo surfaces
// (requests, appointments, updates, deletion) merge by fixed id, so re-running RESETS the demo
// world to the wired state (audit rows from resets are accepted noise, documented).
// Run AFTER `npm run seed` (catalogue must exist).

try { process.loadEnvFile('.env'); } catch { /* injected env */ }
const fs = require('node:fs');
const BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!BASE || !KEY) { console.error('seed:demo needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }

const CONTRACT = JSON.parse(fs.readFileSync('services/seed-contract.json', 'utf8'));
const CLINIC = CONTRACT.clinic.id;
const T = Object.fromEntries(CONTRACT.treatments.map((x: any) => [x.slug, x.id]));

// fixed ids — deterministic, reset-safe
const U: Record<string, string> = {
  priya: '00000000-0000-4000-9000-0000000000d1',
  tom: '00000000-0000-4000-9000-0000000000d2',
  grace: '00000000-0000-4000-9000-0000000000d3',
  sam: '00000000-0000-4000-9000-0000000000d4',
  lena: '00000000-0000-4000-9000-0000000000d5',
  ayesha: '00000000-0000-4000-9000-0000000000d6',
};
const PERSONAS = [
  { key: 'priya', email: 'priya.demo@uniquelaser.test', pw: 'DemoClient2026!', first: 'Priya', last: 'Sharma', phone: '+447911555012', raw: '07911 555012', verified: true },
  { key: 'tom', email: 'tom.demo@uniquelaser.test', pw: 'DemoClient2026!', first: 'Tom', last: 'Hayes', phone: '+447301988776', raw: '07301 988776', verified: false },
  { key: 'grace', email: 'grace.demo@uniquelaser.test', pw: 'DemoClient2026!', first: 'Grace', last: 'Mistry', phone: '+447700900123', raw: '07700 900123', verified: true },
  { key: 'sam', email: 'sam.demo@uniquelaser.test', pw: 'DemoStaff2026!', first: 'Sam', last: 'O’Neil', phone: '+447700900456', raw: '07700 900456', verified: true },
  { key: 'lena', email: 'lena.demo@uniquelaser.test', pw: 'DemoStaff2026!', first: 'Lena', last: 'Taylor', phone: '+447700900789', raw: '07700 900789', verified: true },
  { key: 'ayesha', email: 'ayesha.demo@uniquelaser.test', pw: 'DemoOwner2026!', first: 'Ayesha', last: 'Kaur', phone: '+447700900321', raw: '07700 900321', verified: true },
];

async function call<T = any>(method: string, path: string, body?: unknown, key = KEY, prefer?: string): Promise<{ ok: boolean; status: number; data?: T; err?: any }> {
  try {
    const isUserJwt = typeof key === 'string' && key.startsWith('eyJ');
    const res = await fetch(BASE + path, {
      method, headers: {
        apikey: isUserJwt ? (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '') : key,
        Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    return { ok: res.ok, status: res.status, data, err: res.ok ? undefined : data ?? text };
  } catch (e: any) { return { ok: false, status: 0, err: e?.message }; }
}
function safeJson(t: string): any { try { return JSON.parse(t); } catch { return t; } }

async function main() {
  // ---- 1. auth users (admin API, idempotent by email)
  let existing: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await call('GET', `/auth/v1/admin/users?page=${page}&per_page=200`);
    if (!r.ok) throw new Error('admin users list: ' + JSON.stringify(r.err).slice(0, 200));
    existing = existing.concat(r.data?.users ?? []);
    if ((r.data?.auditors ?? []).length === 0 && (r.data?.users ?? []).length < 200) break;
  }
  const byEmail = new Map<string, string>(existing.map((u: any) => [String(u.email ?? '').toLowerCase(), u.id]));
  const ids: Record<string, string> = {};
  for (const p of PERSONAS) {
    let id = byEmail.get(p.email);
    if (!id) {
      const c = await call('POST', '/auth/v1/admin/users', {
        email: p.email, password: p.pw, email_confirm: true,
        user_metadata: { first_name: p.first, last_name: p.last },
      });
      if (!c.ok && !/already/i.test(JSON.stringify(c.err))) throw new Error(`create ${p.email}: ${JSON.stringify(c.err).slice(0, 200)}`);
      id = c.data?.id ?? byEmail.get(p.email);
      if (!id) { const l = await call('GET', '/auth/v1/admin/users?per_page=500'); id = (l.data?.users ?? []).find((u: any) => u.email === p.email)?.id; }
    }
    if (!id) throw new Error('persona id unresolved for ' + p.email);
    ids[p.key] = id;
  }
  console.log(`personas ok: ${Object.keys(ids).length} auth users (${PERSONAS.map(p => p.key).join(', ')})`);

  // ---- helpers -------------------------------------------------------------
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  async function signIn(email: string, pw: string): Promise<string> {
    const r = await call('POST', '/auth/v1/token?grant_type=password', { email, password: pw }, anonKey);
    if (!r.ok) throw new Error('persona signin failed ' + email + ': ' + JSON.stringify(r.err).slice(0, 160));
    return r.data.access_token;
  }
  const samTok = await signIn('sam.demo@uniquelaser.test', 'DemoStaff2026!');
  const ayeshaTok = await signIn('ayesha.demo@uniquelaser.test', 'DemoOwner2026!');

  const upsert = async (table: string, rows: any[], onConflict = 'id') => {
    if (!rows.length) return;
    const r = await call('POST', `/rest/v1/${table}?on_conflict=${onConflict}`, rows, KEY, 'resolution=merge-duplicates,return=minimal');
    if (!r.ok) throw new Error(`${table}: ${JSON.stringify(r.err).slice(0, 240)}`);
    console.log(`  ${table}: ${rows.length} merged`);
  };
  const insertIfMissing = async (table: string, rows: any[]) => {
    const r = await call('POST', `/rest/v1/${table}?on_conflict=id`, rows, KEY, 'resolution=ignore-duplicates,return=minimal');
    if (!r.ok) throw new Error(`${table}: ${JSON.stringify(r.err).slice(0, 240)}`);
    console.log(`  ${table}: ${rows.length} insert-if-missing`);
  };
  // compare-then-patch: only send fields that differ → no audit/revision spam on re-runs.
  const patchIfChanged = async (table: string, id: string, patch: Record<string, unknown>, token?: string, select = 'id') => {
    const cur = await call('GET', `/rest/v1/${table}?id=eq.${id}&select=*`, undefined, token ?? KEY);
    if (!cur.ok) throw new Error(`read ${table}/${id.slice(0, 8)}: ${JSON.stringify(cur.err).slice(0, 120)}`);
    const row = cur.data?.[0];
    if (!row) return; // missing handled by insert step
    const set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      const a = row[k], b = v;
      const same = a == null ? b == null : typeof a === 'object' || typeof b === 'object'
        ? String(a) === String(b) : a === b;
      if (!same) set[k] = v;
    }
    if (Object.keys(set).length) {
      const r = await call('PATCH', `/rest/v1/${table}?id=eq.${id}`, set, token ?? KEY, 'return=minimal');
      if (!r.ok) throw new Error(`patch ${table}/${id.slice(0, 8)}: ${JSON.stringify(r.err).slice(0, 160)}`);
      console.log(`  ${table}/${id.slice(-6)}: patched ${Object.keys(set).join(',')}`);
    }
  };
  const iso = (dayOffset: number, hour = 10, min = 0) => {
    const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(hour, min, 0, 0); return d.toISOString();
  };
  const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

  // ---- 2. profiles (merge on user_id) --------------------------------------
  await upsert('client_profiles', PERSONAS.map(p => ({
    id: U[p.key].replace('9000', '9100'), clinic_id: CLINIC, user_id: ids[p.key],
    first_name: p.first, last_name: p.last, phone_e164: p.phone, phone_raw: p.raw,
    phone_verified_at: p.verified ? iso(-30) : null, pseudonymised_at: null,
  })), 'user_id');

  // ---- 3. roles: owner + 2 staff seats (cap 2/2 — D-F7 refuses a third) ----
  await upsert('user_roles', [
    { id: U.ayesha.replace('9000', '9200'), clinic_id: CLINIC, user_id: ids.ayesha, role: 'owner', granted_by: ids.ayesha },
    { id: U.sam.replace('9000', '9200'), clinic_id: CLINIC, user_id: ids.sam, role: 'staff', granted_by: ids.ayesha },
    { id: U.lena.replace('9000', '9200'), clinic_id: CLINIC, user_id: ids.lena, role: 'staff', granted_by: ids.ayesha },
  ]);

  // ---- 4. consents (append-only guarded → ignore-duplicates) ----------------
  await insertIfMissing('consent_records', [
    { id: U.priya.replace('9000', '9301'), user_id: ids.priya, kind: 'DATA_PROCESSING', policy_version: 'demo-2026-10', policy_text_hash: '0'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: iso(-30) },
    { id: U.priya.replace('9000', '9302'), user_id: ids.priya, kind: 'NOTIFICATIONS', policy_version: 'demo-2026-10', policy_text_hash: '0'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: iso(-30) },
    { id: U.priya.replace('9000', '9303'), user_id: ids.priya, kind: 'MARKETING', policy_version: 'demo-2026-10', policy_text_hash: '0'.repeat(64), decision: 'WITHDRAWN', source: 'APP', recorded_at: iso(-12) },
    { id: U.tom.replace('9000', '9301'), user_id: ids.tom, kind: 'DATA_PROCESSING', policy_version: 'demo-2026-10', policy_text_hash: '0'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: iso(-9) },
    { id: U.grace.replace('9000', '9301'), user_id: ids.grace, kind: 'DATA_PROCESSING', policy_version: 'demo-2026-10', policy_text_hash: '0'.repeat(64), decision: 'GRANTED', source: 'APP', recorded_at: iso(-200) },
  ]);

  // ---- 5. booking requests ---------------------------------------------------
  // status is insert-if-missing (trigger `block_client_status_edit` refuses status rewrite
  // without a signed-in staff session — reset semantics would fight the demo's own confirms);
  // preferred date/notes refresh so a re-run days later still looks fresh.
  const REQUESTS = [
    // Priya J1: CONFIRMED treatment request (linked chain below)
    { id: U.priya.replace('9000', '9401'), clinic_id: CLINIC, client_user_id: ids.priya, request_kind: 'TREATMENT',
      treatment_id: T['laser-hair-removal'], preferred_date: day(2), preferred_time_band: 'AFTERNOON',
      notes_client: 'evenings suit me better', status: 'CONFIRMED', decided_by: ids.sam,
      decision_reason: null, idempotency_key: U.priya.replace('9000', '9401') },
    // Priya: one PENDING (queue demo)
    { id: U.priya.replace('9000', '9402'), clinic_id: CLINIC, client_user_id: ids.priya, request_kind: 'TREATMENT',
      treatment_id: T['laser-hair-removal'], preferred_date: day(9), preferred_time_band: 'AFTERNOON',
      notes_client: 'if there’s room sooner than next month', status: 'PENDING',
      idempotency_key: U.priya.replace('9000', '9402') },
    // Tom J2: ADVISE_ME pending with the exact note from the directive
    { id: U.tom.replace('9000', '9401'), clinic_id: CLINIC, client_user_id: ids.tom, request_kind: 'ADVISE_ME',
      treatment_id: null, preferred_date: day(5), preferred_time_band: 'MORNING',
      notes_client: 'after shaving gets sore — not sure what helps', status: 'PENDING',
      idempotency_key: U.tom.replace('9000', '9401') },
  ];
  // status insert-if-missing is PENDING-forced by `force_request_pending` (correct posture!) —
  // the CONFIRMED fixture must therefore come from a real staff session, exactly like the demo.
  const REQUEST_ROWS = REQUESTS.map(r => ({
    decided_by: null, decision_reason: null, ...r, status: 'PENDING' as string, // insert-time status
  }));
  await insertIfMissing('booking_requests', REQUEST_ROWS);
  for (const r of REQUESTS) {
    await patchIfChanged('booking_requests', r.id, { preferred_date: r.preferred_date, notes_client: r.notes_client, preferred_time_band: r.preferred_time_band });
    if (r.status !== 'PENDING') {
      // staff-signed PATCH: satisfies block_client_status_edit + writes the genuine CONFIRMED audit event
      await patchIfChanged('booking_requests', r.id, { status: r.status, decided_by: r.decided_by ?? ids.sam }, samTok);
    }
  }
  console.log('  booking_requests: ensured (dates refreshed, confirmations staff-signed)');

  // ---- 6. appointments: Priya R03 chain upcoming + Grace completed today ------
  const APPTS = [
    { id: U.priya.replace('9000', '9501'), clinic_id: CLINIC, client_user_id: ids.priya, client_name_snapshot: 'Priya Sharma',
      request_id: U.priya.replace('9000', '9401'), treatment_id: T['laser-hair-removal'], type: 'CONSULTATION',
      status: 'SCHEDULED', scheduled_start: iso(2, 14, 30), duration_minutes: 20 },
    { id: U.priya.replace('9000', '9502'), clinic_id: CLINIC, client_user_id: ids.priya, client_name_snapshot: 'Priya Sharma',
      request_id: U.priya.replace('9000', '9401'), treatment_id: T['laser-hair-removal'], type: 'PATCH_TEST',
      status: 'SCHEDULED', scheduled_start: iso(3, 11, 0), duration_minutes: 15 },
    { id: U.priya.replace('9000', '9503'), clinic_id: CLINIC, client_user_id: ids.priya, client_name_snapshot: 'Priya Sharma',
      request_id: U.priya.replace('9000', '9401'), treatment_id: T['laser-hair-removal'], type: 'SESSION',
      status: 'SCHEDULED', scheduled_start: iso(24, 15, 0), duration_minutes: null },
    { id: U.grace.replace('9000', '9501'), clinic_id: CLINIC, client_user_id: ids.grace, client_name_snapshot: 'Grace Mistry',
      request_id: null, treatment_id: T['carbon-laser-peel'], type: 'CONSULTATION', status: 'COMPLETED',
      scheduled_start: iso(0, 10, 0), duration_minutes: 20 },
  ];
  await insertIfMissing('appointments', APPTS.map(a => ({ therapist_user_id: null, course_id: null, ...a })));
  for (const a of APPTS) {
    await patchIfChanged('appointments', a.id, {
      scheduled_start: a.scheduled_start, status: a.status, duration_minutes: a.duration_minutes ?? null,
    });
  }
  console.log('  appointments: ensured + chain refreshed (status resets re-audit as staff edits — accepted)');

  // ---- 7. enquiry thread (Priya OPEN — D-F6) ----------------------------------
  await upsert('enquiries', [
    { id: U.priya.replace('9000', '9601'), clinic_id: CLINIC, client_user_id: ids.priya,
      treatment_context_id: T['laser-hair-removal'], status: 'OPEN', client_name_snapshot: 'Priya Sharma' },
  ]);
  await insertIfMissing('enquiry_messages', [
    { id: U.priya.replace('9000', '9611'), enquiry_id: U.priya.replace('9000', '9601'),
      author_user_id: ids.priya, author_role: 'CLIENT', body: 'Do I need to stop shaving before the patch test?', sent_at: iso(-1, 10, 12) },
  ]);

  // ---- 8. updates: 2 published (verified copy) + 1 draft (staff-only proof) ---
  const UPDATES = [
    { id: U.sam.replace('9000', '9701'), clinic_id: CLINIC, title: 'Open every day, 10am–6pm',
      body: 'We’re open seven days a week, 10am to 6pm — walk-ins welcome during quiet times, or book a free consultation in the app.',
      status: 'PUBLISHED', published_at: iso(-3, 9, 0), created_by: ids.ayesha },
    { id: U.sam.replace('9000', '9702'), clinic_id: CLINIC, title: 'Every treatment starts with a free consultation + patch test',
      body: 'A small test patch is performed 24 to 48 hours before your first full session, so you know exactly what to expect. No obligation.',
      status: 'PUBLISHED', published_at: iso(-1, 13, 30), created_by: ids.ayesha },
    { id: U.sam.replace('9000', '9703'), clinic_id: CLINIC, title: 'Summer pigmentation tips (draft)',
      body: 'Staff-only proof: this row is invisible to clients until published (RLS).',
      status: 'DRAFT', published_at: null, created_by: ids.sam },
  ];
  await insertIfMissing('updates', UPDATES);
  for (const u of UPDATES) {
    // only patch on real diffs — a blind merge would append update_revisions every run (trigger)
    await patchIfChanged('updates', u.id, { status: u.status, published_at: u.published_at });
  }

  // ---- 9. GDPR deletion request (owner queue fixture — never Priya/Tom) -------
  await insertIfMissing('deletion_requests', [
    { id: U.grace.replace('9000', '9801'), clinic_id: CLINIC, user_id: ids.grace, status: 'REQUESTED',
      note: 'asked at reception — demo fixture for the owner queue', created_at: iso(-2, 16, 5) },
  ]);
  await patchIfChanged('deletion_requests', U.grace.replace('9000', '9801'),
    { status: 'REQUESTED', completed_at: null }, ayeshaTok); // owner-signed reset after any live execute

  console.log('\nDEMO CREDENTIALS (mock, .test domain — presentation build only)');
  console.table(PERSONAS.map(p => ({ role: p.key === 'ayesha' ? 'owner' : p.key === 'sam' || p.key === 'lena' ? 'staff' : 'client', email: p.email, password: p.pw })));
  console.log('state: Priya — chain(consult +2d, patch +3d, session +24d) + 1 pending request + open enquiry; Tom — ADVISE_ME pending; Grace — completed consult TODAY 10:00 + deletion REQUESTED; seats 2/2 (Sam, Lena) + owner Ayesha; 2 published updates + 1 draft.');
  console.log('demo world reset: re-run any time before the presentation.');
}

main().catch(e => { console.error('seed:demo failed:', e.message); process.exit(1); });
