// lib/format.ts — display formatters. Money from INTEGER PENCE only (R05); UK copy (R09).

export function penceToLabel(pence: number | null | undefined, model: string | null | undefined): string {
  if (model === 'FREE') return 'Free';
  if (model === 'PRICE_ON_CONSULTATION' || pence == null) return 'Price on consultation';
  const pounds = pence / 100;
  const amount = Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
  return model === 'PER_SESSION' ? `£${amount} per session` : `From £${amount} per session`;
}

export function penceToPoundsInput(pence: number | null): string {
  if (pence == null) return '';
  return pence % 100 === 0 ? String(pence / 100) : (pence / 100).toFixed(2);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]}`;
}

export function fmtDateTime(d: Date | string, opts: { ampm?: boolean } = {}): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const day = fmtDate(x);
  const { ampm = true } = opts;
  if (!ampm) return `${day} · ${pad(x.getHours())}:${pad(x.getMinutes())}`;
  const h24 = x.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${day} · ${h}:${pad(x.getMinutes())} ${h24 < 12 ? 'am' : 'pm'}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function fmtTimeBand(band: string | null | undefined): string {
  if (band === 'MORNING') return 'Morning';
  if (band === 'AFTERNOON') return 'Afternoon';
  if (band === 'EVENING') return 'Evening';
  return 'Any time';
}

export function relativeDayLabel(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return fmtDate(d);
}

export function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? '?')[0] ?? '?'}${(last ?? '')[0] ?? ''}`.toUpperCase();
}

export function maskPhone(e164?: string | null): string {
  if (!e164) return 'No number on file';
  return `•••• ••• ${e164.slice(-4)}`;
}
