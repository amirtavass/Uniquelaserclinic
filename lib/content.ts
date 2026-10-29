// lib/content.ts — the VERIFIED copy bank (docs/ui/04-screen-craft.md §10) + enum→word maps.
// Only strings on this list may ship verbatim; anything else is a copy question, not a sentence.

export const COPY = {
  tagline: 'Reveal your unique.',
  clinicName: 'Unique Laser Clinics',
  oneWorkingDay: 'We’ll be in touch within one working day to confirm a time.',
  freeConsultAndPatch: 'Every new treatment starts with a free consultation and patch test.',
  patchWindow: 'A small test patch is performed 24 to 48 hours before your first full session.',
  openEveryDay: 'OPEN EVERY DAY, 10AM–6PM',
  openSeven: 'Open seven days a week, 10am to 6pm',
  individualResults: 'Individual suitability and results vary.',
  discussedAtConsultation: 'Discussed at consultation',
  adviseMe: 'I’m not sure yet, advise me',
  askAdvice: 'Ask us for advice',
  bookFreeConsult: 'Book a free consultation',
  exploreTreatments: 'Explore treatments',
  r06Push: 'An update from Unique Laser Clinics — open the app to view.',
  notYetBooked: 'Requested — not yet booked',
  privacyPromise: 'We only ask what the clinic needs: name, email and mobile.',
} as const;

export const CLINIC = {
  address: '327 Deane Road, Bolton BL3 5HN',
  postcode: 'BL3 5HN',
  phoneDisplay: '07301 166333',
  phoneTel: '+447301166333',
  email: 'hello@uniquelaserclinics.co.uk',
  site: 'https://uniquelaserclinics.co.uk',
  mapUrl: 'https://maps.google.com/?q=327+Deane+Road+Bolton+BL3+5HN',
} as const;

export const HOW_IT_WORKS = [
  { n: '1', title: 'Free Consultation', body: 'Meet your therapist and get a personalised plan, no obligation.' },
  { n: '2', title: 'Patch Test', body: 'A small test patch 24 to 48 hours before your first full session.' },
  { n: '3', title: 'Treatment Sessions', body: 'Comfortable, precise treatments with advanced cooling.' },
  { n: '4', title: 'Aftercare & Results', body: 'Follow your aftercare plan and enjoy the results.' },
] as const;

// Enum → human words (never render raw enums on a screen; UPPERCASE labels are DB-side only).
export function requestKindWord(kind: string): string {
  if (kind === 'CONSULTATION') return 'Free consultation';
  if (kind === 'ADVISE_ME') return 'Advise me';
  return 'Treatment';
}
export function bookingStatusWord(status: string): string {
  switch (status) {
    case 'PENDING': return 'Awaiting confirmation';
    case 'CONFIRMED': return 'Confirmed';
    case 'DECLINED': return 'Not available';
    case 'RESCHEDULED': return 'Alternative proposed';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
}
export function appointmentTypeWord(type: string): string {
  if (type === 'CONSULTATION') return 'Consultation';
  if (type === 'PATCH_TEST') return 'Patch test';
  return 'Session';
}
export function appointmentStatusWord(status: string): string {
  switch (status) {
    case 'SCHEDULED': return 'Confirmed';
    case 'COMPLETED': return 'Done';
    case 'CANCELLED': return 'Cancelled';
    case 'CANCEL_REQUESTED': return 'Cancel requested';
    case 'RESCHEDULE_REQUESTED': return 'Reschedule requested';
    case 'NO_SHOW': return 'Did not attend';
    default: return status;
  }
}
