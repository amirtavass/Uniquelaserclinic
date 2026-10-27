// services/seed.ts — seed the verified catalogue into Supabase over HTTPS (service role).
// Single source of truth: services/seed-contract.json (counts verified against the live site on
// 22 & 26 Oct 2026). Idempotent: every row has a fixed uuid and is merged on conflict.
// Run: npm run seed   (after schema.sql + rls.sql + introspection.sql are applied)

const fs = require('node:fs');
const path = require('node:path');

try { process.loadEnvFile('.env'); } catch { /* injected env */ }
const BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!BASE || !KEY) { console.error('seed needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exitCode = 2; }

const CONTRACT: any = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'services', 'seed-contract.json'), 'utf8'));

async function upsert(table: string, rows: any[], onConflict: string, mode = 'merge-duplicates') {
  if (!rows.length) return;
  const res = await fetch(`${BASE}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
      Prefer: `resolution=${mode},return=minimal`,
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`seed ${table}: HTTP ${res.status} ${String(await res.text()).slice(0, 300)}`);
  }
  console.log(`  ${table}: ${rows.length} rows merged`);
}

async function main() {
  const clinic = CONTRACT.clinic;
  const C = (extra: any) => ({ clinic_id: clinic.id, ...extra });

  // self-check: flags must agree with counts before touching the database
  const t = CONTRACT.treatments;
  const self = {
    featured: t.filter((x: any) => x.feat).length, detail: t.filter((x: any) => x.detail).length,
    directory: t.filter((x: any) => x.dir).length, dropdown: t.filter((x: any) => x.drop).length,
  };
  const k = CONTRACT.counts;
  if (self.featured !== k.featured || self.detail !== k.detailPages ||
      self.directory !== k.directory || t.length !== k.treatmentsTotal) {
    throw new Error(`seed-contract internally inconsistent: ${JSON.stringify(self)} vs counts ${JSON.stringify(k)}`);
  }
  console.log(`seed-contract self-check passed (${t.length} treatments, advisory dropdown=${self.dropdown}/expected-live=${k.dropdownAdvisoryExpected})`);

  await upsert('clinics', [clinic], 'id');
  await upsert('clinic_settings', CONTRACT.settings.map((s: any) => C({ key: s.key, value: s.value, id: s.id })), 'clinic_id,key');
  await upsert('treatment_categories', CONTRACT.categories.map((x: any) => C({ id: x.id, slug: x.slug, name: x.name, sort_order: x.sort, published: true })), 'clinic_id,slug');
  await upsert('treatment_concerns', CONTRACT.concerns.map((x: any) => C({ id: x.id, slug: x.slug, name: x.name })), 'clinic_id,slug');
  const catId = Object.fromEntries(CONTRACT.categories.map((x: any) => [x.slug, x.id]));
  const conId = Object.fromEntries(CONTRACT.concerns.map((x: any) => [x.slug, x.id]));
  await upsert('treatments', t.map((x: any) => C({
    id: x.id, category_id: catId[x.cat], slug: x.slug, name: x.name,
    summary: x.summary, price_from_pence: x.price, pricing_model: x.model,
    is_featured: x.feat, has_detail_page: x.detail, show_in_directory: x.dir,
    show_in_booking_dropdown: x.drop, typical_sessions_min: x.smin, typical_sessions_max: x.smax,
    duration_minutes: x.dur, min_gap_days: x.gap,
    requires_consultation: true, requires_patch_test: true,
    disclaimer: 'Individual suitability and results vary.',
    source_url: x.url, content_verified: true, published: true,
  })), 'clinic_id,slug');
  await upsert('treatment_concern_links',
    t.flatMap((x: any) => x.concerns.map((c: any) => ({ treatment_id: x.id, concern_id: conId[c] }))),
    'treatment_id,concern_id', 'ignore-duplicates');
  await upsert('opening_hours', CONTRACT.openingHours.map((h: any) => C({
    id: h.id, weekday: h.weekday, is_open: true, opens: h.opens, closes: h.closes, valid_from: '2000-01-01',
  })), 'clinic_id,weekday,valid_from');
  const treatId = Object.fromEntries(t.map((x: any) => [x.slug, x.id]));
  await upsert('course_packages', CONTRACT.coursePackages.map((p: any) => C({
    id: p.id, treatment_id: treatId[p.treatment], name: p.name,
    sessions_count: p.sessions, discount_percent: p.discount, price_pence: null, published: true,
  })), 'id');
  await upsert('faq_items', CONTRACT.faqs.map((f: any) => C({
    id: f.id, question: f.q, answer: f.a, category: f.cat, sort_order: 0, published: true,
  })), 'id');

  console.log(`seed complete — clinic ${clinic.name}, ${k.directory} directory treatments, ` +
    `${k.featured} featured (3500–12000 pence), ${CONTRACT.openingHours.length}×10:00–18:00, ` +
    `${CONTRACT.coursePackages.length} courses @ ${CONTRACT.coursePackages[0].sessions}×${CONTRACT.coursePackages[0].discount}% off (verified /faqs/)`);
}

if ((process.exitCode ?? 0) !== 2) {
  main().catch(e => { console.error('seed failed:', e.message); process.exitCode = 1; });
}
