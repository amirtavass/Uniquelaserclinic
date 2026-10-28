# 03 — Routing Map (route → file → data call) — the M1 build checklist

**Rule (kickoff Stage 7):** screens never import `supabase`; every arrow below is a `lib/db.ts`
seam or `lib/auth.ts` call. **EXISTS** = already in `lib/db.ts`/`lib/auth.ts` today. **ADD(M1)** =
new seam to create in the same style (name proposed here so screens and tests agree; query shape
follows `docs/schema-coaching/02-query-pack.md`; RLS enforces regardless).
**Tier:** `consumer` (anon/client) · `admin` (staff) · `OWNER-SECONDARY` (built after the core M1
demo slice per `08-scope-and-demo-slice.md`; wireframes exist in `sections/14-owner-access/`).

## A. Consumer shell — `(consumer)` group

| # | Route | File | Data call | Tier | States spec |
|---|---|---|---|---|---|
| 1 | `(consumer)/` 🏠 guest | `index.tsx` | `getOpeningStatus` EXISTS · `getTreatments({})` (featured slice `is_featured`) EXISTS · `getFaqItems` EXISTS · `getCategories` EXISTS | anon | `02-home/00` |
| 2 | `(consumer)/dashboard` 🏠 client | `dashboard.tsx` | `myDashboard()` → `client_dashboard()` EXISTS · `getPublishedUpdates` EXISTS (preview strip) | client | `02-home/01` |
| 3 | `(consumer)/treatments` 💆 | `treatments/index.tsx` | `getTreatments({search,categoryId,concernSlug})` EXISTS · `getCategories` EXISTS · **`getConcerns()` ADD(M1)** | anon+client | `03-discover/00`, `02` |
| 4 | `(consumer)/treatments/[slug]` | `treatments/[slug].tsx` | `getTreatmentBySlug(slug)` EXISTS (joins category + course_packages) | anon+client | `03-discover/01` |
| 5 | `(consumer)/treatments/faq` | `treatments/faq.tsx` | `getFaqItems` EXISTS · `getOpeningStatus` EXISTS | anon+client | `03-discover/03` |
| 6 | `(consumer)/consult` ✦(anon) | `consult.tsx` | static verified copy + `getOpeningStatus` EXISTS; CTA → `AuthGateSheet` | anon | `04-book/00` §intro |
| 7 | `(consumer)/request` ✦(client) steps 1–4 | `request/index.tsx`, `[step].tsx` | `getTreatments` (dropdown source = `show_in_booking_dropdown`, DA-14) EXISTS · **`getOpeningStatus` EXISTS for date floor** · submit: `createBookingRequest()` (with `idempotencyKey`) EXISTS | client | `04-book/00` |
| 8 | `(consumer)/request/acknowledgement` | `request/acknowledgement.tsx` | reads last-created request from flow state (no refetch) · R02 verbatim copy | client | `04-book/01` |
| 8b | `(consumer)/request/status` | from Home row / Profile hub | **`myRequests()` ADD(M1)** (`booking_requests` own rows, newest-first) | client | `04-book/02` |
| 9 | `(consumer)/profile` 👤 hub | `profile/index.tsx` | **`getMyProfile()` ADD(M1)** (`client_profiles` own row via auth uid) · dashboard counts EXISTS | client | `08-profile-privacy/*` |
| 10 | `(consumer)/profile/edit` | `profile/edit.tsx` | `saveClientProfile()` EXISTS | client | `08/00` |
| 11 | `(consumer)/profile/phone-verify` | `profile/phone-verify.tsx` | **`requestPhoneOtp()` / `confirmPhoneOtp()` ADD(M1)** — simulated locally in demo (DA-19); writes `phone_verified_at` via **`verifyPhone()` ADD(M1)** | client | `08/00` (DA-12) |
| 12 | `(consumer)/profile/consents` | `profile/consents.tsx` | `recordConsent()` EXISTS · **`getMyConsents()` ADD(M1)** | client | `08/01` (R08) |
| 13 | `(consumer)/profile/deletion` | `profile/deletion.tsx` | **`requestDeletion()` ADD(M1)** (insert `deletion_requests`, client-insert policy) | client | `08/02` (DA-17) |
| 14 | `(consumer)/profile/privacy-links` | `profile/privacy-links.tsx` | static URLs (site privacy page; text link-out until client copy) | client | `08/02` |
| 15 | `(consumer)/profile/staff-entry` | `profile/staff-entry.tsx` | **`getMyRoles()` ADD(M1)** (`user_roles` own read; hides itself for pure clients) | client→admin pivot | `02-navigation-and-ia` §3 |
| 16 | `appointments/` | `index.tsx` | `myAppointments()` EXISTS | client | `05-appointments/00` |
| 17 | `appointments/[id]` | `[id].tsx` | **`getAppointment(id)` ADD(M1)** (own row + `appointment_events` timeline) | client | `05/00`, `01` (R03 chain) |
| 18 | `appointments/[id]/change` | `[id]/change.tsx` | `requestAppointmentChange()` EXISTS (RPC) | client | `05/02` (S10/DA-07) |
| 19 | `enquiries/` | `index.tsx`, `new.tsx` | **`myEnquiries()` ADD(M1)** · `createEnquiry()` EXISTS | client | `06-enquiries/00` (S09) |
| 20 | `enquiries/[id]` | `[id].tsx` | **`enquiryThread(id)` ADD(M1)** (`enquiry_messages` own thread) · **`replyEnquiry(id,body)` ADD(M1)** (append; trigger flips status) | client | `06/00` |
| 21 | `updates/` | `index.tsx`, `[id].tsx` | `getPublishedUpdates()` EXISTS · `markUpdateRead(id)` EXISTS (detail renders from the same fetch — no extra seam) | client (anon: list only) | `07-updates/00` |
| 22 | `(auth)/sign-up` | `sign-up.tsx` | `signUpWithPassword()` EXISTS (auth) · `saveClientProfile` EXISTS · `recordConsent(DATA_PROCESSING)` EXISTS | anon | `01-auth/00` (DA-11/DA-12) |
| 23 | `(auth)/sign-in` | `sign-in.tsx` | `signInWithPassword()` EXISTS | anon | `01-auth/01` (S02) |
| 24 | `(auth)/verify-email` · `forgot` | — | **`resendVerification()` / `sendPasswordReset()` ADD(M1)** in `lib/auth.ts` | anon | `01-auth/01` §errors |
| 25 | notification deep-links | root router in `_layout.tsx` | **`getAppNotifications()` / `markAppNotificationRead()` ADD(M1)** (in-app inbox, `notifications` own rows) — routes carry `?to=` (`appointments/[id]`, `enquiries/[id]`, `updates/[id]`); copy obeys R06 | client | `00-cross-cutting` §7 |

## B. Admin workspace — `admin` group

| # | Route | File | Data call | Tier | States spec |
|---|---|---|---|---|---|
| 26 | `admin/` 📥 queue | `(tabs)/index.tsx` | `staffQueue()` EXISTS (PENDING, newest-first) · unseen badge = **`markQueueSeen(lastSeenAt)` ADD(M1)** (client-side stamp, no schema change) | admin | `09-staff-queue/00` |
| 27 | `admin/queue/[requestId]` | `queue/[requestId].tsx` | **`getRequestDetail(id)` ADD(M1)** (request + snapshot + `booking_request_events` + client card + linked appointments) | admin | `09/00` |
| 28 | `…/confirm` | `confirm.tsx` | `decideBooking(id,'CONFIRMED')` EXISTS · `scheduleAppointments({chain})` EXISTS — chain `CONSULTATION→PATCH_TEST→SESSION` (R03/DA-04); soft DA-05/DA-06 warnings surface from trigger audit (non-blocking) | admin | `09/01` |
| 29 | `…/decline` · `…/propose` | `decline.tsx` · `propose.tsx` | `decideBooking(id,'DECLINED'\|'RESCHEDULED', reason)` EXISTS (reason verbatim, `decision_reason`) | admin | `09/02` |
| 30 | `admin/dial` ☎ | `(tabs)/dial.tsx` | `searchClients(q)` EXISTS → `app.search_clients` RPC (audits `directory_view`, S18) | admin | `10-staff-dialler/00` |
| 31 | `admin/dial/client/[userId]` | `dial/client/[userId].tsx` | **`staffClientDetail(userId)` ADD(M1)** (profile + request/appointment history; zero health fields, R04) | admin | `10/01` |
| 32 | `admin/dial/diary` (today board) | `dial/diary.tsx` | **`staffAppointmentsOn(date)` ADD(M1)** (appointments by `scheduled_start`; change-requests surfaced with filter chip — S15 intake also lists on Queue) | admin | `11-staff-diary/00`, `02` |
| 33 | `admin/dial/diary/[appointmentId]` | outcome sheet | **`recordOutcome(id,'COMPLETED'\|'NO_SHOW')` ADD(M1)** (status update; trigger logs `COMPLETED`/`NO_SHOW_RECORDED`) · **`resolveChangeRequest(id,'ACCEPTED_CANCEL'\|'REBOOKED')` ADD(M1)** (sets `CANCELLED`/`RESCHEDULED`; DA-07 no fees) | admin | `11/01`, `11/02` |
| 34 | `admin/care` hub | `(tabs)/care.tsx` | counts via seams below (badge totals) | admin | `12/00`, `13/00` |
| 35 | `care/enquiries` + `[id]` | `care/enquiries*.tsx` | **`staffEnquiries(status?)` ADD(M1)** · **`staffEnquiryThread(id)` / `staffReplyEnquiry(id,body)` ADD(M1)** (writes staff message; trigger flips `ANSWERED`) | admin | `12/00` (S13) |
| 36 | `care/updates` + `[id]` | `care/updates*.tsx` | **`staffUpdates()` ADD(M1)** (incl. DRAFT) · **`createUpdate()/publishUpdate(id)/unpublishUpdate(id)` ADD(M1)** (status writes; `update_revisions` trigger) | admin | `12/01` (S14) |
| 37 | `care/prices/[treatmentId]` | price sheet | **`getCatalogueForStaff()` ADD(M1)** (all treatments, incl. unpublished) · **`editTreatmentPrice(id, pence, pricingModel)` ADD(M1)** (update → `append_price_history` trigger, R05) | admin | `13/00` (S17) |
| 38 | `care/hours` | `care/hours.tsx` | `getOpeningStatus()` EXISTS (read) · **`saveOpeningHours(rows)` / `saveHoursOverride(day,isOpen,reason)` ADD(M1)** (new `valid_from` version row; never edits history) | admin | `13/01` |
| 39 | `admin/more` ⋯ | `(tabs)/more.tsx` | `getMyRoles()` ADD(M1) (owner check) · `signOut()` EXISTS (auth) · `[Switch to Client View]` | admin | `14` entry states |
| 40 | `admin/more/seats` | `more/seats.tsx` | **`staffSeats()` ADD(M1)** (`user_roles` owner read) · **`grantStaffSeat(userId)` / `revokeStaffSeat(roleId)` ADD(M1)** — 3rd grant must surface the seat-cap error (DA-01); **note:** the seat-cap trigger raises `RAISE exception` without `using errcode` → SQLSTATE
**P0001** (PL/pgSQL default), matching Phase 1 §"seat cap `P0001` on S16"; map P0001 in the seam
and show the trigger's message verbatim in the friendly sheet (other guards that DO set `42501`
map differently — keep one lookup table in M1, verified live) | **OWNER-SECONDARY** | `14-owner-access/00` (S16) |
| 41 | `admin/more/gdpr` + `[requestId]` | `more/gdpr*.tsx` | **`deletionQueue()` ADD(M1)** (`deletion_requests` owner read) · **`startDeletionReview(id)` ADD(M1)** (→`IN_REVIEW`) · `apply_deletion` RPC = **`applyDeletion(id)` ADD(M1)** (pseudonymise pipeline, DA-17; owner-only in DB) | **OWNER-SECONDARY** | `14-owner-access/01` (S11) |

## C. Build-order checklist (mirrors `01-demo-scope.md` D-F1…D-F8)

1. Token delta PR (`01-tokens.md` §5 deltas) → 2. seams batch ADD(M1) (A9/11/12/13/15/19/20/25;
B27/31/32/33/35–38) → 3. `(auth)` 22–24 → 4. consumer browse 1/3/4/5 → 5. request flow 6–8 →
6. appointments 16–18 → 7. enquiries 19–20 → 8. updates 21 → 9. admin queue + confirm chain
26–29 → 10. dial + diary 30–33 → 11. care comms 35–36 → 12. profile hub 9–14 → 13. notifications
25 (simulated push DA-19) → 14. **then** OWNER-SECONDARY 40–41, price/hours editors 37–38 polish.

**Flags:** rows 40–41 are Owner-tier and sit *behind* the core slice per `08-scope-and-demo-slice.md`
(demo role pair is Client + Staff on stage; the seats guard D-F7 may be shown as a stub before the
full screens). No row invents data: prices/hours/FAQ copy flow only from seeded verified content.
