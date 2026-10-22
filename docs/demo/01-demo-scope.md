# 01 — Demo Scope: what we show, in the client's own priority order

Priority source — M01 verbatim ordering: *"book appointments → check reminders → … check updates
→ ask for enquiries"*, plus *"sign up with their email and number and full info"* and
*"Admin should be the owner, and 2 people to control it"*. UI stories referenced for acceptance
shape only; none are signed.

Legend: **REAL** = genuinely works end-to-end on demo devices · **SIMPLE** = works with
shortcut/seeded data · **VISUAL** = screen exists, looks finished, action is stubbed.

| # | Demo feature | Story | Level in demo | What the owner sees | Fallback if short on time |
|---|---|---|---|---|---|
| D-F1 | Sign up: email + phone + details | S01 | SIMPLE — email/password works for real; phone field captured but **OTP disabled in demo** (costs SMS credit; real OTP in M1) | A client account being created; admin sees who registered | Pre-created demo account already signed in |
| D-F2 | Browse & search treatments | S03, S04 | REAL — 8 core priced treatments + categories from verified catalogue (W04); prices exactly as published | Their own treatments, correct prices, "From £35 per session" | None needed — content only |
| D-F3 | Book: request a consultation | S05, S12 | REAL end-to-end — choose treatment (incl. "advise me") → preferred day → notes → submit; **staff device shows it in a queue → Confirm → client sees "Confirmed"** | The core promise: request in, confirmation out, mirroring their current 1-working-day callback (W03) | Prefilled request already in the queue |
| D-F4 | My appointments + reminder | S06, S07 | SIMPLE — appointment list REAL; reminder via **local scheduled notification** ("Open the app to view" copy obeying R06) instead of server push | A phone physically lighting up with a clinic reminder | Show the appointment's "Reminder on ✓" state and narrate |
| D-F5 | Updates feed | S08 | SIMPLE — 3 seeded, truthful posts: opening hours (W01), free consultation + patch-test policy (W02), a genuine existing testimonial (W07) | Their news in a clean feed; staff device can publish a 4th live | Seeded only, skip publishing |
| D-F6 | Enquiries: ask → answer | S09, S13 | REAL chat thread between client and staff devices | Owner watches an enquiry get answered on the staff phone | Scripted thread pre-loaded |
| D-F7 | Staff seats & roles | S16 | SIMPLE — staff login on second device; owner role flag shown; hard "2 staff seats" UI guard demoed with a 3rd invite attempt refused | "Only me and my two people control this" | Single device, switch accounts |
| D-F8 | Profile & data controls | S11 | VISUAL — details editable; "Request data deletion" shows a confirmation and records nothing | Polished, complete-looking profile | None — one screen |

## Deliberately NOT in the demo (say so, do not fudge)

- Real-time availability calendar — their site doesn't have it (D03); we show request→confirm.
- Payments/deposits — no evidence wanted (Q10).
- Health/medical questions in-app — parked pending GDPR answer (D05).
- Server-side push (needs EAS builds + keys), phone SMS OTP, app-store listings.
- Before/after progress photos.

If the owner asks for any of these on the day: it becomes an answer to a Q## and a scope change,
not a live hack.

## What the demo is FOR (success criteria)

1. Owner recognises their clinic (brand, real treatment names/prices, "we'll be in touch within
   one working day" copy).
2. The **request → staff confirm → client sees confirmed + reminder** loop lands on two phones.
3. Answers to Q01 (who signs off), Q02 ("full info" field list), Q04 (how the diary is really run)
   are captured on the spot — the demo doubles as the Stage 1 interview.
