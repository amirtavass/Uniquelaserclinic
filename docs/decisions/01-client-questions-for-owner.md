# 01 — Questions for the Clinic Owner

Plain-English list, ready to take to the owner. Nothing here stops the demo — sensible defaults are
already in place (developer reference: `02-demo-assumptions.md`). Each answer just confirms or
changes a default.

## Staff & Admin Access

1. **Is it you plus two staff members who control the app?** The demo allows exactly two staff
   accounts besides the owner. Can the number change later, and who is allowed to add or remove
   staff logins?
2. **What should staff be able to see about a client?** Staff can currently see names, phone
   numbers and booking history — never medical information. Is that the right line, or do you want
   reception staff to see less than you?

## Booking & Scheduling Rules

3. **How is your appointment diary really run today** — paper, Outlook/Google calendar, phone and
   email, or a system like Fresha or Square? The app mirrors your current process (client requests,
   you call back within one working day). If you already use software, the app could connect to it
   instead.
4. **Cancellation and no-show policy:** do you require notice (24 hours? 48?) and is there a fee or
   forfeited session? The demo records cancellations but never fines anyone.
5. **How far apart must repeat laser sessions be booked?** Only "tattoos: six weeks apart" is
   published. What are the minimum gaps for hair removal by area (face, underarms, legs…), and any
   other treatment? Today the app gently warns staff when a session looks too soon — it never
   blocks.
6. **Reminder timing:** is a push reminder 24 hours before the appointment right, and should some
   clients also get a text message? (Texts cost the clinic a small per-message fee.)

## Clinical & Privacy Preferences

7. **Should the app ever ask health questions?** Your website's booking form asks, but marks the
   questions optional and says everything is discussed at the free consultation. The app follows
   exactly that approach: no health questions; the team covers medical history and the patch test
   face-to-face. If you'd rather collect some answers in the app (for example before the
   consultation), we need your written data-protection position first — and a signed consent
   photo library, if you want that, comes with it.
8. **What should clients see after a patch test?** If a patch test reaction means a course must be
   postponed, how should the app say it without storing medical details — a neutral "we'll be in
   touch about your next steps", or something else?
9. **Notes box guidance:** clients sometimes type medical details into free-text boxes ("I'm on
   antibiotics…"). We plan to display a reminder not to, and staff to steer such questions to the
   consultation. Happy with that, or would you prefer the box removed entirely?
10. **Your published age rules (no under-16; under-18 restricted for some treatments)** currently
    live as wording on treatment pages. Do you want to collect date of birth at sign-up so the app
    can check age properly? That's the only new personal detail we'd suggest adding.

## Packages & Accounts

11. **Course packages:** your FAQs promise six sessions at 20 per cent off. Do courses expire (how
    many months?), can unused sessions roll over or be transferred to a family member, and what
    happens on refunds? The demo records courses without expiry dates.
12. **Payments in the app:** buying a course or paying a deposit in-app is not in the current plan
    (your £500+ three-instalment plans are arranged face-to-face). Correct to keep it that way for
    the first release?
13. **One phone number, one account?** Currently two accounts can't *verify* the same mobile number.
    If partners or family members share a phone, should we allow it with a note instead?
14. **Sign-up "full info":** which extra details do you actually need — address? date of birth?
    how they'd prefer to be contacted? We only ask what has a use.

---
*Answered items become dated decisions in `docs/schema-coaching/05-decision-log.md`; anything still
open stays a question — the demo defaults never present themselves as confirmed policy.*
