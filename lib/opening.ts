// lib/opening.ts — Open/Closed from cached opening_hours rows (DA-13) + overrides.
// Device is assumed Europe/London for the demo (clinic + testers are Bolton-based);
// server-side true-tz calc lands with reminders (D07), not a UI concern.

export type HoursRow = { weekday: number; is_open: boolean; opens: string | null; closes: string | null };
export type OverrideRow = { day: string; is_open: boolean; reason: string | null };

export type OpenStatus = { open: boolean; label: string; detail: string };

function toMin(hhmm: string | null): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}
function fmt(hhmm: string | null): string {
  const mins = toMin(hhmm);
  const h24 = Math.floor(mins / 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${mins % 60 ? ':' + String(mins % 60).padStart(2, '0') : ''} ${h24 < 12 ? 'am' : 'pm'}`;
}

export function computeOpenStatus(
  rows: HoursRow[], overrides: OverrideRow[] = [], now: Date = new Date(),
): OpenStatus {
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ov = overrides.find(o => o.day === ymd);
  if (ov) {
    if (!ov.is_open) {
      return { open: false, label: 'Closed today', detail: ov.reason ? `Closed — ${ov.reason}` : 'Closed — see opening hours' };
    }
  }
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = (ov?.is_open ? null : rows.find(r => r.weekday === now.getDay())) ?? rows.find(r => r.weekday === now.getDay());
  if (today?.is_open && mins >= toMin(today.opens) && mins < toMin(today.closes)) {
    return { open: true, label: 'Open now', detail: `Until ${fmt(today.closes)} · ${rows.length === 7 ? 'seven days a week' : 'see hours'}` };
  }
  // find next open day
  for (let i = 0; i < 7; i++) {
    const wd = (now.getDay() + i) % 7;
    const r = rows.find(x => x.weekday === wd && x.is_open);
    if (!r) continue;
    if (i > 0 || mins < toMin(r.opens)) {
      const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][wd];
      return { open: false, label: 'Closed now', detail: `Opens ${fmt(r.opens)} ${when}` };
    }
  }
  return { open: false, label: 'Closed', detail: 'See opening hours' };
}
