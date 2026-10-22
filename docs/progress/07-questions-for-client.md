# 07 — Questions for Client (Batch 1 — answer before Gate 1 closes)

Each question: what we need to know, why it matters, recommended default if they don't care.

## Workflow & scheduling (highest priority — shapes the whole schema)

- **Q01 — Who signs off, and is the staff message (M01) the owner's position?** M01 came from an
  employee; admin seats = owner + 2 must be confirmed by the owner. *Default: treat M01 as binding
  until the owner amends it.*
- **Q04 — How is the diary actually run today?** Paper, Outlook/Google calendar, phone + email
  callback, or a booking platform (Fresha, Mindbody, Square…)? Does the website form's submission
  land somewhere specific? This decides whether we build request→confirm (as verified on the site)
  or integrate with a live availability system. *Default: keep request→confirm; staff confirm in-app.*
- **Q05 — Cancellation / reschedule policy?** Notice period, fees, deposit on courses? Needed
  before S10/S15 can carry acceptance criteria. *Default: no policy enforced in-app; requests only.*
- **Q06 — What are "updates"?** Clinic news, new treatments, offers, or opening-hour changes?
  Who publishes them and how often? *Default: staff-published announcements feed.*

## Account & data model

- **Q02 — "Full info" at sign-up — which fields exactly?** Date of birth (relevant for age limits
  on laser!), address, contact preferences? Each field needs a reason (kickoff R04 metrics rule).
  *Default: name, email, phone, contact preferences; DOB added with age-check rule if treatments
  are age-restricted — owner confirms.*
- **Q03 — Health screening in the app?** The website form collects medical conditions, medications
  and pregnancy status. Should the app (a) never collect it, (b) collect it pre-consultation with
  explicit Art. 9 consent, or (c) let staff record notes post-consultation? Requires the clinic's
  data-protection position. *Default: (a) — not in v1.*

## Notifications & comms

- **Q07 — Reminder timing and channel:** push only, or push + SMS? 24h before, 48h, or clinic-set?
  *Default: push, 24h before, opt-in per appointment.*
- **Q08 — Do enquiry replies need to mirror to email (hello@…)?** If staff answer in-app, clients
  may still expect email. *Default: in-app thread + push; email remains separate channel.*

## Catalogue & content

- **Q09 — Treatment catalogue source of truth:** site shows 22 menu links; V1 report counted 31/32.
  Please supply the master list (or confirm menu = catalogue). Also: can prices/hours be edited in
  a simple admin screen, or should we edit them? *Default: menu list = catalogue; staff edit prices
  in-app v2; v1 edits by us via seed.*

## Commercial & release

- **Q10 — Any in-app payment/deposit for courses or no-show protection in mind?** Not mentioned in
  M01; do not assume. *Default: none — v1 payments out.*
- **Q11 — Demo date and what "done" means:** kickoff default "one full journey on both phones,
  real data, no placeholder screens". Confirm or set your own.
- **Q12 — Stores & assets:** whose Apple Developer and Google Play accounts? Logo files (SVG),
  font licences, brand guidelines? *Default: client-owned accounts; we supply build access.*

---
*Answered items convert to D## entries in `docs/schema-coaching/05-decision-log.md` with source.
Unanswered stay open; anything depending on them is BLOCKED, not guessed.*
