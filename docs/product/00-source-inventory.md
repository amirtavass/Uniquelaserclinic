# 00 — Source Inventory (Stage 0 evidence)

Client: Unique Laser Clinics — laser, skin & body clinic, 327 Deane Road, Bolton BL3 5HN.
Existing website: https://uniquelaserclinics.co.uk/

Sources of truth, in order: live website + supplied documents > written decisions in this repo >
interview answers > chat messages > memory.

## Evidence table

| ID | Source (URL/section) | Claim or content (quoted / verified) | What it implies for the app | Confidence |
|---|---|---|---|---|
| W01 | Site-wide (announcement bar, hero, "Visit us", footer) — fetched 22 Oct 2026 | "OPEN EVERY DAY, 10AM–6PM"; "Monday to Sunday 10:00am to 6:00pm" | Opening hours entity; live open/closed status widget. V1's reported 9am conflict does **not** appear on the current pages — still confirm with owner | VERIFIED |
| W02 | Homepage hero + FAQ | "Every new treatment starts with a free consultation and patch test"; patch test "24 to 48 hours before your first full session" | Booking domain must model consultation → patch test → session sequence, not just one-off appointments | VERIFIED |
| W03 | "Book in a minute" widget + CTA copy | Choose treatment (incl. "I'm not sure yet, advise me") → choose preferred day (7-day strip + calendar) → "we'll be in touch within one working day to confirm a time" | Booking is **request → manual confirmation**, not real-time slot booking. The app must not fake live availability unless the clinic says it will | VERIFIED |
| W04 | Mega-menu /treatments/ | 5 categories (Laser 5, Skin 5, Anti-Ageing 5, Body 4, Wellness 3 = 22 links); 8 core priced treatments from £35–£120 per session | Treatment catalogue entity: category, price-from (integer pence), sessions guidance, duration | VERIFIED (counts); 31 vs 32 total from V1 still unreconciled — needs client export |
| W05 | Contact channels | 07301 166333, hello@uniquelaserclinics.co.uk, Instagram, TikTok, walk-ins during quiet times | Call links, enquiry channels; no online chat or API known | VERIFIED |
| W06 | FAQ + trust strip | "safe for most skin types… Fitzpatrick", insured therapists, before/after photography tracked per course | Content/FAQ entity; potential phase-2 progress-photos feature (sensitive: consent + secure storage) | VERIFIED |
| W07 | Testimonials section | Three named reviews (Sarah M. Bolton, Leanne T. Bury, James D. Farnworth) | Real review content exists on-site; do not invent more | VERIFIED |
| W08 | Areas We Serve | Bolton, Farnworth, Westhoughton, Horwich, Little Lever, Bury | Local SEO content; low app value — likely Omit/Adapt | VERIFIED |
| M01 | **Staff message (employee, forwarded by us — exact text preserved below)** | See quote block | Primary audience, roles, auth model, core jobs-to-be-done | STATED by staff; NOT signed off by owner |

### M01 — Client staff message (verbatim, received 22 Oct 2026)

> "An app where people can book appointments check reminders and stuff like that, check updates and ask for enquiries
> Admin should be the owner, and 2 people to control it
> For others like costumers for them to just like sign up with their email and number and full info so we know who it is
>
> both android and ios"

**Reading of the message (INFERRED, to confirm at Gate 1):**

- Customer jobs: book appointments, view/check reminders, see clinic updates, submit enquiries.
- Roles: exactly 3 privileged users (owner + 2 staff). All others are customers.
- Auth: customer sign-up with email + phone number + "full info" (field list unclear — Q02).
- Platforms: Android + iOS.
- The message is a staff statement, not owner sign-off. Status: STATED, awaiting confirmation.

## Website-to-app map

| Website area | Decision | Notes |
|---|---|---|
| Home / hero / trust strip | Adapt | Mobile home: status, primary CTAs, featured treatments |
| Treatments mega-menu + directory | Adapt | Search + category/concern filters (reuse the 5 concerns) |
| Treatment detail pages | Reuse content | Copy, prices, session guidance — with source URLs kept |
| Booking widget | **Adapt + extend** | Same request→confirm flow; app adds status tracking + reminders |
| How It Works (4 steps) | Reuse | Onboarding/educational card |
| FAQs | Reuse | Content entity, admin-editable (Q09) |
| Testimonials | Reuse (cautiously) | Only verifiable existing three unless client supplies more |
| Areas We Serve | Omit in v1 | Marketing/SEO, low mobile job value |
| About / Contact | Adapt | Directions, call, email, opening hours |
| Privacy policy / cookies | Reuse | Link + in-app consent records (UK GDPR) |
| Admin (reception desk workflow today) | New | Staff queue to confirm/decline/reschedule requests |

## What the website tells us / what it does not tell us

| Tells us | Does NOT tell us (open questions) |
|---|---|
| Services, categories, from-prices, durations | Whether an app should allow true slot booking or keep request→confirm |
| Request-based booking with 1-working-day callback | Whether bookings currently land in email/spreadsheet/paper diary or software |
| Opening hours 7 days 10–6 | Who owns the diary; how cancellations/reschedules are handled today |
| Consultation + patch test are mandatory | Whether staff want the admin in this app or a separate web dashboard |
| Contact channels, address, catchment | Whether in-app payments/packages are wanted (not mentioned) |
| Real testimonials | Definition of "full info" for customer sign-up; date of birth? address? |
| GDPR/health consent fields on the web form | Whether the app may store health screening answers (UK GDPR Art. 9 — Q03) |
| Brand words/colors on rendered pages | Logo files, font licences, brand guidelines (asset request list below) |

## Assets needed from client

- Logo (SVG/PNG, light + dark variants), brand guideline or font licences
- Confirmation of who signs off (owner name/role)
- Export of the full treatment catalogue (to reconcile 22 menu links vs 31/32 claimed)
- Current aftercare guidance text (for content reuse)
- Apple App Store + Google Play developer accounts (whose names?)
