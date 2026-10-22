# 01 — User Stories (requirements contract, DRAFT)

Status legend: `[BRIEFED]` = client has discussed and agreed. `[NOT YET BRIEFED]` = drafted from the
website (W##) or the staff message (M01); must be presented for sign-off at Gate 3.
**No story below is `[BRIEFED]` yet** — M01 is a staff statement, not owner sign-off.

Audiences (per M01, pending confirmation): **Client** (customer), **Staff** (owner + 2 staff),
**Owner** (a Staff role with extra rights).

## Cross-cutting rules

| ID | Rule | Source |
|---|---|---|
| R01 | Exactly one clinic tenant. Roles: `owner`, `staff` (max 2), `client`. Admin rights are granted by an owner; no self-promotion. | M01 |
| R02 | Booking is **request → staff confirmation**. The app never shows fictitious real-time availability unless the clinic confirms a scheduling system to integrate with. | W03 |
| R03 | Every treatment begins with a free consultation and a patch test 24–48h before the first full session; the booking domain must represent these as distinct appointment types. | W02 |
| R04 | Health/sensitive data (medical conditions, medications, pregnancy) is **not collected in-app by default**. Web-form fields stay on the website pending UK GDPR review. Revisit only if the owner explicitly asks. | V2 §8, Q03 |
| R05 | Money is stored as integer pence, never floats. Published prices are snapshots with an effective date; catalogue edits are append-only history. | Kickoff Stage 4 |
| R06 | Push notification previews must not contain treatment names or health content. Generic copy only: "An update from Unique Laser Clinics — open the app to view." | V2 §8 |
| R07 | Clients see only their own data; staff see all. Enforced by row-level security, verified with two real users, not by UI hiding. | Kickoff traps |
| R08 | Consents (data processing, marketing opt-in, notification opt-in) are recorded as rows with timestamps, versioned by policy text. Withdrawal must be possible in-app. | W-privacy, UK GDPR |
| R09 | UK spelling throughout product copy and docs (colour, centre, prioritise, organiser). | Kickoff P09 |
| R10 | One codebase ships to both platforms; any native capability (push) is built via EAS dev builds from M1, not left to feature time. | M01 "both android and ios", kickoff traps |

## Client (customer) stories

### S01 — Create account with email and phone [NOT YET BRIEFED]

As a new client, I want to sign up with my email and phone number and give my full details, so that
the clinic knows who I am and I can manage my bookings.

Acceptance criteria:
- Email + password sign-up, with email verification required before booking.
- Phone number captured and verified by OTP (UK and common international formats; store E.164 + raw).
- Profile form asks: first name, last name, mobile number. Any further field (date of birth,
  address, contact preferences) is blocked pending Q02 answer — do not invent.
- Duplicate email or duplicate phone returns a clear, friendly error with a recovery path.
- Privacy notice shown at sign-up; consent recorded (R08).

Data implications: `auth.users` (Supabase), `client_profiles`, `consent_records`, unique index on
verified phone per tenant.
Evidence: M01 ("sign up with their email and number and full info so we know who it is").

### S02 — Sign in and stay signed in [NOT YET BRIEFED]

As a client, I want to sign in securely and have sessions persist, so that I can open the app
quickly when I need it.

Acceptance criteria:
- Sign in via verified email (password) or phone OTP; refresh handled transparently.
- Session tokens stored in secure storage (not async storage).
- Signed-out state never blocks public browsing (see S03 requires no login; booking does).

Data implications: Supabase Auth; `lib/auth.ts` seam.
Evidence: M01.

### S03 — Browse and search treatments [NOT YET BRIEFED]

As a client, I want to browse treatments by category or concern and search by name, so that I can
find what suits me without the desktop mega-menu.

Acceptance criteria:
- Categories: Laser, Skin, Anti-Ageing, Body, Wellness (W04); concern filters: Unwanted hair,
  Ageing and texture, Pigment and veins, Acne, Tattoos (W04).
- Each card shows name, short summary, session guidance, and price label ("From £35 per session" /
  "Price on consultation" / "Free").
- Empty state when no match, suggesting "Ask us for advice" (links to S09).
- No login required to browse.

Data implications: `treatments` (category enum, `price_from_pence` nullable, `pricing_model` enum),
`treatment_price_history`.
Evidence: W04, homepage filter pills.

### S04 — View treatment details [NOT YET BRIEFED]

As a client, I want a treatment page with price, sessions, duration, and the consultation + patch
test requirement, so that I know exactly what to expect before booking.

Acceptance criteria:
- Shows only verified published content per treatment, with the disclaimer "Individual suitability
  and results vary." where the site carries it.
- Prominent "Book a free consultation" action.
- Patch-test requirement and typical session count shown where published; missing data renders as
  "Discussed at consultation", never invented (V2 §11).

Data implications: fields on `treatments`; content sourced per-URL in seed.
Evidence: W02, W04.

### S05 — Request a consultation or treatment appointment [NOT YET BRIEFED]

As a client, I want to pick a treatment (or "advise me") and a preferred day and time and submit a
booking request, so that the clinic confirms my appointment within one working day.

Acceptance criteria:
- Flow: treatment (incl. `ADVISE_ME` and `FREE_CONSULTATION`) → preferred date (calendar) →
  preferred time slot range (morning/afternoon/evening — exact granularity pending Q04) → review →
  submit.
- Confirmation screen explains what happens next, verbatim in spirit with the site: "we'll be in
  touch within one working day to confirm a time".
- No payment, no deposit, no claimed real-time availability (R02).
- Submission creates a request visible to Staff instantly (S12).

Data implications: `booking_requests` (status enum `PENDING | CONFIRMED | DECLINED | RESCHEDULED |
CANCELLED`, snapshot of treatment + price at request time), append-only `booking_request_events`.
Evidence: W03, M01 ("book appointments").

### S06 — See my appointments and their status [NOT YET BRIEFED]

As a client, I want a list of upcoming and past appointments with clear status, so that I always
know what is confirmed.

Acceptance criteria:
- Upcoming shows status ("Awaiting confirmation", "Confirmed", "Patch test due before your first
  session" where applicable per R03) with date/time/treatment.
- Past appointments list retained; details visible.
- Signed-out empty state prompts sign-in; zero-appointment state has a "Book a consultation" CTA.

Data implications: `appointments` (type enum: `CONSULTATION | PATCH_TEST | SESSION`), scoped select
(R07).
Evidence: M01 ("check reminders and stuff like that"), V2 §5E.

### S07 — Receive appointment reminders [NOT YET BRIEFED]

As a client, I want a push notification before an appointment, so that I don't miss it.

Acceptance criteria:
- Notification opt-in asked at booking time, never forced; denied permission falls back to in-app
  reminder list.
- Reminder for confirmed appointments only, default 24h before (value pending Q07).
- Notification content obeys R06 (no treatment name in preview).
- Tapping the notification deep-links to the appointment detail screen.

Data implications: `notification_tokens`, `reminders` (scheduled), server-side dispatch (Supabase
Edge Function + Expo Push API).
Evidence: M01 ("check reminders"), R06.

### S08 — See clinic updates [NOT YET BRIEFED]

As a client, I want to see clinic news/updates, so that I hear about new treatments or changes
(such as opening hours) without checking Instagram.

Acceptance criteria:
- Feed of staff-published updates (title, body, timestamp); newest first.
- Unread indicator per client; content is published-only (draft state invisible).
- What "updates" should include is confirmed pending Q06 — this story is drafted narrowly as
  announcements.

Data implications: `updates` (status `DRAFT | PUBLISHED`), `update_reads`.
Evidence: M01 ("check updates").

### S09 — Ask an enquiry and get an answer [NOT YET BRIEFED]

As a client, I want to send the clinic a question and see the reply in the app, so that I don't
need to ring during work hours.

Acceptance criteria:
- Enquiry text submitted from anywhere (treatment detail, profile, contact).
- Threaded replies visible to that client only; status `OPEN | ANSWERED | CLOSED`.
- Client notified when answered (obeying R06 wording).
- Whether replies also mirror to email (hello@…) is pending Q08.

Data implications: `enquiries`, `enquiry_messages` (append-only thread).
Evidence: M01 ("ask for enquiries").

### S10 — Request cancellation or reschedule [NOT YET BRIEFED]

As a client, I want to cancel or ask to move an upcoming appointment, so that the clinic knows
before my slot.

Acceptance criteria:
- Action available on any upcoming appointment; sends a request to Staff, sets appointment to
  `CANCEL_REQUESTED` / `RESCHEDULE_REQUESTED`.
- Clinic's notice-period/cancellation policy shown if the owner provides it (Q05); otherwise the
  app states no policy and does not block.

Data implications: `booking_request_events` / `appointment_events` (reason text verbatim).
Evidence: V2 §5E; policy unknown → question batch.

### S11 — Manage my profile and privacy [NOT YET BRIEFED]

As a client, I want to edit my details, control notifications, and exercise data rights, so that I
stay in control of my information.

Acceptance criteria:
- Edit name/phone; re-verification on phone change.
- Notification opt-in/out; marketing opt-in/out — each recorded (R08).
- "Request data deletion" submits a task visible to Owner (human workflow; no silent delete).
- Privacy policy and terms readable in-app (link to site until client supplies text).

Data implications: `client_profiles`, `consent_records`, `deletion_requests`.
Evidence: UK GDPR, V2 §8.

## Staff / Owner stories

### S12 — Confirm, decline, or reschedule a booking request [NOT YET BRIEFED]

As staff, I want to see new requests and set them confirmed with a real date/time, so that the
booking workflow matches how the clinic already works (callback within one working day).

Acceptance criteria:
- Queue ordered newest-first; badge for unseen requests.
- Actions: Confirm (pick actual date/time + appointment type chain per R03), Decline (reason),
  Propose alternative (sends client a reschedule offer).
- Client notified on every transition (R06 copy).
- Every action recorded in `booking_request_events` with actor id + timestamp.

Data implications: writes to `booking_requests`, `appointments`; RLS staff-only.
Evidence: W03, M01 ("Admin should be the owner, and 2 people to control it").

### S13 — Answer enquiries [NOT YET BRIEFED]

As staff, I want to answer client enquiries from the app, so that replies happen without email
shuffle. Acceptance: thread view, send reply → status `ANSWERED`, client notified.
Data implications: writes to `enquiry_messages`. Evidence: M01.

### S14 — Publish and unpublish updates [NOT YET BRIEFED]

As staff, I want to publish clinic updates, so that clients see news. Acceptance: create/edit
draft, publish, unpublish; history preserved. Owner rights per S16.
Data implications: `updates`. Evidence: M01.

### S15 — Answer or route client-initiated reschedule/cancel requests [NOT YET BRIEFED]

As staff, I want to accept a cancellation/reschedule request and set the appointment state, so the
client sees an outcome. Evidence: S10 counterpart.

### S16 — Owner: manage staff access [NOT YET BRIEFED]

As the owner, I want to grant or revoke the two staff seats, so that control stays with named
people. Acceptance: invite by email to a pre-created auth user; role change audited; hard cap of 2
active `staff` configurable up to owner-set max (M01 says two — Q01 confirms).
Data implications: `user_roles`, audit rows; RLS: role grants owner-only.
Evidence: M01.

### S17 — Owner/Staff: maintain treatment catalogue and opening hours [NOT YET BRIEFED]

As staff, I want to edit prices, descriptions, and published opening hours, so that the app never
shows stale data. Acceptance: edits snapshot old values (R05); hours drive the open/closed widget.
Whether editing happens in-app or in a web dashboard is Q09.
Data implications: `treatments`, `price_history`, `clinic_settings`.
Evidence: V2 §7.

### S18 — Client directory (staff view) [NOT YET BRIEFED]

As staff, I want to look up a client by name/phone, so that I can help them on the phone.
Acceptance: search returns profile + booking history; access audited; health-adjacent data is not
shown (R04). Data implications: staff-scoped select on `client_profiles`. Evidence: M01 ("so we
know who it is").

## Deliberately NOT stories (parked until asked)

- In-app payments / course package purchase (no source; Q10).
- Before/after photo tracking (consent + secure storage design needed; phase 2 candidate).
- Real-time slot calendar (blocked on Q04).
- Loyalty points, referrals, AI skin advice. None mentioned on site or in M01 — do not invent.
