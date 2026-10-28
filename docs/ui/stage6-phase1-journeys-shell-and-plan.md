# Stage 6 — Phase 1: Journey Verticals, Shell Options & Execution Plan

**Doc status:** PHASE 1 APPROVED 2026-10-28 — sign-off answers recorded in Appendix A below;
Phase 2 (`docs/ui/` full tree) generated same day and now **awaits Gate 6 review**. Treat this
file as the historical plan (dated 2026-10-27); `00`–`05` + `sections/` are the current spec.
**Predecessors:** Gate 4 + Gate 5 signed; Schema v1 LOCKED
(`npm run verify` 35 PASS · 0 FAIL · 1 WARN (A-04) · 0 BLOCKED; `verify:rls` 7 PASS; typecheck clean).
**Hard rule:** `app/` product screens remain locked until Gate 6 clears.
**Sources:** `docs/schema-coaching/01-user-stories.md` (S01–S18, R01–R10, validated for Demo Stage),
`docs/decisions/02-demo-assumptions.md` (DA-01–DA-20 open defaults), `docs/schema/01–05`,
`docs/schema-coaching/08-scope-and-demo-slice.md`, `lib/db.ts` + `lib/auth.ts` seams,
`app.client_dashboard()` / `app.search_clients()` / `app.purge_verification_data()` RPCs.
No requirements invented; owner questions (Q1, Q3–Q9) stay as demo defaults and are never shown as clinic policy.

---

## PART 1 — Journey Verticals (`anon` → `client` → `staff`/`owner`)

### ANON — Unlogged Guest

| # | Bucket (one line) | Core tasks / questions | IDs |
|---|---|---|---|
| U1 | "I have a concern — what treats it, and from how much?" | browse 31 directory cards; filter 5 concerns + 5 categories; search name/summary; read price labels (from £35–£120, "Price on consultation", "Free") | S03, S04, R05 |
| U2 | "What exactly happens before my first session?" | sessions min/max, duration, disclaimer, course package (6 @ 20%), patch-test + 24–48 h note, "discussed at consultation" (never invented) | S04, S03, R03 |
| U3 | "Is it legit — open now, address, can I reach them?" | live open/closed banner (Mon–Sun 10:00–18:00, DA-13), clinic card 327 Deane Road BL3 5HN, tel: / mailto:, FAQs | S03, S04, R09 |
| U4 | "I'm ready — what does signing up need, or can I just ask?" | free-consultation CTA; sign-up explainer (email + mobile, DA-11); inline enquiry teaser (requires sign-in) | S05, S01, S02, S09 |

### CLIENT — Logged-in

| # | Bucket | Core tasks / questions | IDs |
|---|---|---|---|
| C1 | "Catch-up: what happened while I was away?" | one-round-trip `client_dashboard()` (upcoming ≤ 5, pending requests, unread updates, open enquiries); newest updates; unread badges; reminder list | S06, S07, S08, R06 |
| C2 | "Book it — known treatment or 'advise me', in under a minute" | kind picker (`TREATMENT` / `CONSULTATION` / `ADVISE_ME`, DA-02/14); treatment picker (8 dropdown + all detail slugs); date; time band (`MORNING/AFTERNOON/EVENING`, DA-03); steering-copy note (DA-10); review; verbatim 1-working-day copy; `idempotency_key` retry; PENDING receipt | S05, R02, R05 |
| C3 | "Where am I in the chain?" | upcoming list "Awaiting confirmation" / "Confirmed" / "Patch test due before your first session" (R03); past retained; 24 h reminder visible (DA-08); deep link from push | S06, S07, R03 |
| C4 | "Something came up — cancel or move my slot" | request-only flow → `CANCEL_REQUESTED` / `RESCHEDULE_REQUESTED`; policy never invented (DA-07); staff outcome visible | S10, S06 |
| C5 | "Ask the clinic privately and get an answer" | thread (append-only), `OPEN/ANSWERED/CLOSED`; reply triggers generic push (R06) | S09 |
| C6 | "Announcements and clinic news" | published-only feed; mark read (`update_reads` upsert); draft invisible (RLS) | S08 |
| C7 | "My details, my data, my rights" | edit name/phone + re-verify (DA-12); notification & marketing consents withdrawable (R08); deletion request → owner queue (DA-17); privacy links | S11, S01, R08 |

### STAFF / OWNER — Admin

| # | Bucket | Core tasks / questions | IDs |
|---|---|---|---|
| F1 | "New requests — callback, confirm the chain" | queue newest-first + unseen badge; Confirm with `CONSULTATION`→`PATCH_TEST`→`SESSION` picker (DA-04); Decline w/ reason; Propose reschedule; auto `booking_request_events`; client notified (R06) | S12, R02, R03, R07 |
| F2 | "Today's diary & outcomes" | appointments by date; `COMPLETED` / `NO_SHOW` recording; `CANCEL_REQUESTED`/`RESCHEDULE_REQUESTED` resolve | S15, S06, S10 |
| F3 | "Who is calling? — directory lookup" | `search_clients` (RPC audited `directory_view`); profile + booking history; zero health data (R04/DA-10) | S18, R04 |
| F4 | "Answer enquiries & publish updates" | thread reply → `ANSWERED` + notify; DRAFT→PUBLISH / UNPUBLISH, revision history (R05) | S13, S14 |
| F5 | "Keep prices and hours truthful" | price edit → `treatment_price_history` snapshot (R05); `valid_from` hours versioning + overrides; `clinic_settings` | S17, R05 |
| F6 | **OWNER** "Who holds the seats?" | grant/revoke staff, cap 2 (DA-01); third grant shows friendly seat-cap error | S16, R01 |
| F7 | **OWNER** "GDPR deletion queue" | `REQUESTED`→`IN_REVIEW`→`apply_deletion` pseudonymise pipeline (tokens hard-deleted, consents kept as evidence) | S11, DA-17 |

**Shared vertical (all tiers):** auth & account shell — sign-up (S01), sign-in/persistent session (S02),
role transition anon → client → staff, sign-out never blocks public browsing.

---

## PART 2 — Shell & Tab Architecture Options

### OPTION A — Lean 3–4 consumer tabs + dedicated role-switched admin workspace

Guest sees 3 tabs, Client 4, Staff/Owner a **separate 4-tab admin shell** with an identity strip +
`Exit staff mode`.

```text
 ANON (3)             CLIENT (4)           STAFF/OWNER (4, separate)
┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐
│ Unique Laser     │ │ ● Today   2 ↑    │ │ ▣ Staff · Sam     [Exit]   │
│  [Book]   [⋯]    │ │ [⌕]      [🔔]    │ │ [⌕]              [🔔]      │
│ ⚠ Open now…      │ ├──────────────────┤ ├────────────────────────────┤
│ concern pills    │ │ Awaiting conf.…  │ │ NEW · Priya 079xx  Hair    │
│ treatment cards  │ │ Patch test due   │ │  10:32 "Hair, mornings"    │
│ …                │ │ Upcoming 1 Nov   │ │ NEW · Tom   ADVISE ME      │
├──────────────────┤ ├──────────────────┤ ├────────────────────────────┤
│ 🏠   💆   🔑     │ │ 🏠  💆  📅  👤   │ │ 📥   📅   ☎    ⋯         │
│ Home Treat Sign  │ │ Home Treat Appt  │ │ Queue Diary Dial More      │
│                  │ │      Mine        │ │  ⋯ → Seats · GDPR (owner)  │
└──────────────────┘ └──────────────────┘ └────────────────────────────┘
```

- **Strengths:** smallest cognitive surface per role; strongest R07 posture (client chrome structurally
  absent for staff); cleanest owner-only gating (seats/GDPR in `More`); admin density without polluting
  the consumer UI.
- **Weaknesses:** two nav trees to maintain; context switch when a staff member is also a client;
  sign-up/discovery CTA needs an explicit plan inside the admin shell.
- **UX principles & schema alignment:** `client_dashboard()` → Client Home only;
  `staffQueue()` / `search_clients()` / enquiry writes live strictly in the admin shell;
  `assert_staff_seat_cap` errors surface only under Owner `More`; R03 chain tracker on appointments;
  R06 enforced by the DB tripwire (`assert_r06_generic_copy`), the UI simply never composes the copy.
- **Tab count recommendation:** anon **3**, client **4**, staff/owner **4** (+ identity bar).

### OPTION B — Uniform 5-tab shell (`UrlFetchingV2` §6 baseline) + in-place staff mode

`Home | Treatments | Book | Appointments | Profile` for Guest and Client; staff swaps in a `Queue` tab
(5) or `Staff home` (4) in place.

```text
 ANON                  CLIENT                 STAFF/OWNER
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ [🔔]      [⋯]    │ │ ● Today  [🔔]    │ │ ▣ Staff   [⋯]    │
│ browse only      │ ├──────────────────┤ ├──────────────────┤
│ concern pills    │ │ Awaiting conf.   │ │ NEW Priya …      │
│ 📅 Open today    │ │                  │ │ NEW Tom …        │
│ 🔑 gates:        │ │ + Book strip     │ ├──────────────────┤
│  Book · Appt ·   │ ├──────────────────┤ │ [Diary]  [Dial]  │
│  Mine → "Sign in"│ │                  │ │ [Catalogue] …    │
│                  │ │                  │ │                  │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ 🏠 💆 ➕ 📅 👤  │ │ 🏠 💆 ➕ 📅 👤  │ │ 🏠 ➕ 📥 💆 👤  │
│ Home Trt Book    │ │ Home Trt Book    │ │ Home Book Queue  │
│ Appt    Mine     │ │ Appt    Mine     │ │ Diary    Mine    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

- **Strengths:** matches the discovery brief §6 baseline (continuity with `UrlFetchingV2`); Book is
  always one thumb-tap; `➕` tab is the request CTA; staff toggles in place with no route-tree fork.
- **Weaknesses:** 5 tabs dilute each label; 3 of them render gate screens for anon (dead taps);
  staff/admin density is crammed into the consumer bar and owner-only actions sink under
  `Profile > Staff`; role-dependent tab identity is the most error-prone pattern in React Navigation.
- **UX principles & schema alignment:** `client_dashboard()` drives Home; gates rely on RLS returning
  empty/401 rather than hidden tabs (already proven by `verify:rls` — R07); R03 tracker as in A;
  seat-cap and deletion paths are buried, which weakens the F6/F7 owner workflows.
- **Tab count recommendation:** anon **5 (3 gated)**, client **5**, staff **5** (6 if Queue and Diary
  split) — crowded.

### OPTION C — Journey-driven hybrid (RECOMMENDED): 3-tab consumer shell + role-switched admin workspace

*Home* is a role-adaptive surface fed by the single `client_dashboard()` call; the centre action tab is
the booking intent itself, not a generic "Book" label.

```text
 ANON (3)             CLIENT (3)           STAFF/OWNER (4)
┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐
│ Unique Laser     │ │ ● Today  2 ↑     │ │ ▣ Staff: Sam  ● 3 new  │
│   [⋯] help       │ │ [⌕]      [🔔]    │ │ [⌕]           [🔔]     │
│ ⚠ Open now…      │ ├──────────────────┤ ├────────────────────────┤
│ concern pills    │ │ Awaiting conf.   │ │ NEW · Priya Hair 10:32 │
│ treatment cards  │ │ ▸ Patch test     │ │ NEW · Tom  ADVISE ME   │
│ 📅 Open · ☎      │ │   24–48 h        │ │ ▸ CONFIRM + chain      │
├──────────────────┤ │ 📰 Update        │ ├────────────────────────┤
│ ┌──────────────┐ │ ├──────────────────┤ │ NEW · Lena cancel req  │
│ │ ✦ Free consul│ │ │                  │ │ ⚠ gap 14 < 42 d (DA-05)│
│ │ tation  ──→  │ │ │                  │ │   warn, never blocks   │
│ └──────────────┘ │ │                  │ ├────────────────────────┤
│ sticky CTA;      │ │                  │ │                        │
│ one tap → S01    │ │                  │ │                        │
├──────────────────┤ ├──────────────────┤ ├────────────────────────┤
│ 🏠   ✦   👤      │ │ 🏠   ✦   👤      │ │ 📥   ☎   💆   ⋯       │
│ Home Consult Mine│ │ Home Request     │ │ Queue Dial Care  More  │
│                  │ │      Profile     │ │  ⋯ owner-only: Seats,  │
│                  │ │ ✦ = Request      │ │    GDPR queue          │
└──────────────────┘ └──────────────────┘ └────────────────────────┘
```

- **Layouts.** Client Home = one `client_dashboard()` round trip + updates preview + enquiry shortcut +
  `✦ Request` action centre. Staff shell: `📥` Queue = new requests **plus** client-initiated
  change events (F1/F2 resolve); `☎` Dial = audited directory search + booking history + outcome
  recording (F2/F3); `💆` Care = enquiries, updates, catalogue prices, opening hours (F4/F5);
  `⋯` More = owner-only seats + GDPR queue, gated by `app.is_owner()` (F6/F7) and RLS-proven (R07).
- **Strengths:** best one-handed ergonomics (3 consumer tabs + sticky intent); guest funnel maximised
  (no dead gated tabs — the auth gate lives *inside* `✦`); admin density without consumer crowding;
  every screen maps to exactly one `lib/db.ts` seam; Home = a single RPC per the kickoff design.
- **Weaknesses:** `✦` carries a double meaning (browse intent vs request intent) — mitigated by
  relabelling `✦ Consult` for anon and `✦ Request` for client; staff crossing back to consumer
  features is a deliberate extra step.
- **UX principles & schema alignment:** `client_dashboard()` *is* the Home tab; R02 drives the
  queue-first admin posture and the verbatim 1-working-day copy; R03 chain tracker surfaces on Home
  and appointment detail; `idempotency_key` retry appears only on submit failure; R06 previews are
  generic by DB tripwire, and no screen ever composes treatment names into notification copy;
  DA-05/06 soft warnings render as banners that never block.
- **Tab count recommendation:** anon **3**, client **3**, staff **4**, owner = staff 4 with an
  owner section in `⋯`.

### Recommendation & tab counts (for sign-off)

1. **Option C.** The single-RPC Home mirrors the locked `app.client_dashboard()` design; `verify:rls`
   proved isolation without UI hiding (R07), so a role-switched admin workspace is safe; zero dead
   taps for guests; the booking intent (`✦`) is the product's core action (M01: "book appointments").
2. Fallback: **Option A** if you want Treatments to keep its own consumer tab (`🏠 💆 ✦ 👤`).
3. Rejected for M1: **Option B** — gated-tab dead ends for guests, and a role-dependent 5th tab risks
   the classic silent-failure UX.

---

## PART 3 — Execution Plan (Phase 2 — generate after sign-off)

### Planned tree (one file per flow; kickoff Stage 6 order)

```text
docs/ui/
  00-design-system-usage-rules.md     # token ownership, conflict rule (/docs wins), anti-patterns
  01-tokens.md                        # brand EXTRACTED from the live website (no invented hex) → theme/tokens.ts map
  02-navigation-and-ia.md             # chosen shell + full route tree + deltas vs the other options
  03-routing-map.md                   # every route → app/ file → lib/db.ts call (the build checklist)
  04-screen-craft.md                  # scaffold, safe areas, type roles, UK-spelling copy rules (R09)
  05-component-library.md             # shared atoms before building anything new
  sections/
    00-cross-cutting.md               # auth gate sheet, skeletons, offline cached-catalogue banner,
                                      # error/retry (idempotency), toast rules, empty-state patterns
    01-auth/          00-signup.md  01-signin.md
    02-home/          00-guest-home.md  01-client-home.md
    03-discover/      00-treatments.md  01-treatment-detail.md
                      02-concern-filter.md  03-faq-hours-contact.md
    04-book/          00-request-flow.md  01-acknowledgement.md  02-my-request-status.md
    05-appointments/  00-my-appointments.md  01-patch-test-tracker.md
                      02-cancel-reschedule.md
    06-enquiries/     00-ask-and-thread.md
    07-updates/       00-feed-and-read-state.md
    08-profile-privacy/ 00-profile-edit-reverify.md  01-consents.md  02-deletion-request.md
    09-staff-queue/   00-queue-and-triage.md  01-confirm-chain.md  02-decline-propose.md
    10-staff-dialler/ 00-directory-search.md  01-client-detail.md
    11-staff-diary/   00-day-board.md  01-outcomes-completion.md  02-change-requests.md
    12-staff-comms/   00-enquiry-threads.md  01-updates-publish.md
    13-staff-catalogue/ 00-price-edit.md  01-hours-edit-overrides.md
    14-owner-access/  00-seats.md  01-gdpr-queue.md
```

### Files vs screens / flows

- **3 layout variations per core landing screen**, each tied back to its Part-1 bucket questions:
  Treatments & concern filter (U1), Treatment detail (U2), Client Home / `client_dashboard()` (C1),
  Request flow (C2), Staff Queue & triage (F1).
- **Two full end-to-end multi-screen journeys** (5 stages, all tiers):
  **J1 "Laser Hair Removal, from £35"** and **J2 "I'm not sure yet — advise me"** (`ADVISE_ME`).
  Each runs: ① guest browse → detail (consultation + 24–48 h patch-test notice) → `✦ Free
  consultation` → auth gate (S01/S02) → ② client form (treatment/advise · preferred date · time band
  · steering-copy note + consents · review · submit, S05) → ③ acknowledgement (verbatim
  "we'll be in touch within one working day", R02) and how Home changes to the `PENDING` badge →
  ④ staff triage (queue badge, S12 → directory lookup, S18 → confirm into the linked
  `CONSULTATION` + `PATCH_TEST` chain, R03; branches for Decline and Propose-reschedule) →
  ⑤ client result (Home & My Appointments transform: upcoming Consultation, patch-test tracker,
  then `COMPLETED` states and the 24 h reminder).
- **Every state covered per section:** signed-out · null/zero-data (new client with 0 bookings;
  0 search matches → "Ask us for advice", S09) · loading/skeleton · offline cached-catalogue banner ·
  validation & errors (duplicate verified phone DA-12 · network drop retry via `idempotency_key` ·
  seat cap `P0001` on S16 · R06 copy rejected by the DB tripwire · drafts invisible to client/anon) ·
  edge cases (soft banner when a `SESSION` lands inside `min_gap_days = 42` or has no completed
  `PATCH_TEST` — warn, never block, DA-05/06 · long content · keyboard-open states).
- `03-routing-map.md` maps every route to a `lib/db.ts` seam only (`getCategories`, `getTreatments`,
  `getTreatmentBySlug`, `getPublishedUpdates`, `getFaqItems`, `getOpeningStatus`, `saveClientProfile`,
  `recordConsent`, `createBookingRequest`, `myDashboard`, `myAppointments`, `requestAppointmentChange`,
  `createEnquiry`, `markUpdateRead`, `staffQueue`, `decideBooking`, `scheduleAppointments`,
  `searchClients`) — screens never import Supabase directly (`lib/auth.ts` is the only auth entry).
- **Deliberately out** per `08-scope-and-demo-slice.md`: payments/deposits, in-app health screening
  (R04), real-time slot calendar (Q04), before/after photos. Never invented.

### Confirm before I generate

1. **Lock Option C** (fallback A; B rejected)?
2. **Tab counts** anon 3 / client 3 / staff 4 / owner = staff + `⋯` section — or keep `💆 Treatments`
   as a 4th consumer tab (Option A variant)?
3. **Demo-slice priority:** build J1 + J2 in full, and render the owner surfaces
   (`14-owner-access`) as wireframes but out of the M1 build? Plus: staff shell entry = separate
   workspace (C) vs in-place toggle (B)?

On approval I generate the full `docs/ui/` library (tokens extracted from the live site first).
`app/` stays locked until Gate 6 sign-off.

---

## Appendix A — Phase 1 outcomes (client answers, 2026-10-28; append-only)

1. **Q1 (shell):** LOCKED — **Option C + 4th `💆 Treatments` consumer tab variant**. Shells:
   ANON `🏠 Home · 💆 Treatments · ✦ Consult · 👤 Sign In`; CLIENT `🏠 Home (client_dashboard()) ·
   💆 Treatments · ✦ Request · 👤 Profile`; STAFF/OWNER separate workspace `📥 Queue · ☎ Dial ·
   💆 Care · ⋯ More` + Top Identity Strip (Dial hosts diary+outcomes; Care hosts comms+catalogue
   edits; More hosts owner items + `[Switch to Client View]`). Spec: `02-navigation-and-ia.md`.
2. **Q2 (tab counts):** resolved inside Q1 — 4/4 consumer tabs (Treatments kept), 4 admin tabs.
3. **Q3 (priority + owner surfaces):** J1 + J2 generated in full 5-stage detail
   (`sections/15-journeys/`); `14-owner-access/` wireframes generated complete and marked
   **OWNER-TIER / secondary to the core M1 demo slice** in `03-routing-map.md` (rows 40–41).

Phase 2 executed 2026-10-28: full `docs/ui/` tree written (tokens extracted + verified from the
live `ulc-signature` theme CSS `:root` + homepage SVG, not from the research files — see
`01-tokens.md` provenance); `app/` remains locked pending Gate 6.
