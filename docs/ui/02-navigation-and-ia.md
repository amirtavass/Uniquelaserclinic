# 02 — Navigation & Information Architecture (LOCKED shell)

**Status:** LOCKED at client sign-off 2026-10-28 (Stage 6 Phase 1 §3 answers) — recorded here for
Gate 6 review. **Decision:** Option C *Journey-Driven Hybrid* **with the 4th `💆 Treatments`
consumer tab** (so Home can switch to `client_dashboard()` without losing direct catalogue
access). Option B remains rejected (gated dead tabs); plain Option C is superseded by this variant.

## 1. The three shells (tab names are canonical)

| Tier | Trigger | Tabs (4) | Notes |
|---|---|---|---|
| **ANON — Guest** | no session | `🏠 Home` · `💆 Treatments` · `✦ Consult` · `👤 Sign In` | 0 dead ends: every tab renders real content or an explainer; auth is *offered*, never forced. `👤 Sign In` swaps to `👤 Profile` the moment a session exists. |
| **CLIENT** | session, role `client` | `🏠 Home` (= `app.client_dashboard()`, single round trip) · `💆 Treatments` · `✦ Request` · `👤 Profile` | Home chrome identical slot-for-slot to guest (no layout jump on sign-in). |
| **STAFF / OWNER** | session, role `staff`/`owner` — **separate admin workspace** | `📥 Queue` · `☎ Dial` · `💆 Care` · `⋯ More` + Top Identity Strip (`▣ Staff · {First name} · clinic name`, `[Switch to Client View]`) | Entered via Profile → *Staff workspace* (only if `user_roles` active row) or on launch when the signed-in role is staff. Consumer tabs structurally absent inside the workspace (R07 posture). |

Glyph mapping for production: 🏠 house · 💆 sparkles-body (Material `dermata`) · ✦ starburst
(site halo motif) · 👤 person · 📥 tray-and-arrow-down · ☎ phone-in-talk · ⋯ ellipsis. Icons are
decoration; visible labels always accompany (accessibility).

### Tab → bucket map (Part 1 of the Phase 1 doc)

| Consumer tab | Answers buckets | Admin tab | Answers buckets |
|---|---|---|---|
| 🏠 Home (guest) | U1 U2 U3 | 📥 Queue | F1 + client cancel/reschedule intake (S10→S15) |
| 🏠 Home (client) | C1 C3 C6 | ☎ Dial | F3 (`search_clients`) + F2 (today's diary, COMPLETED/NO_SHOW) |
| 💆 Treatments | U1 U2 (+U3 contact strip) | 💆 Care | F4 (enquiries, updates) + F5 (prices, hours) |
| ✦ Consult (guest) | U4 + W02 consultation/patch-test explainer | ⋯ More | F6 seats · F7 GDPR queue (**owner-gated**) · switch-to-client |
| ✦ Request (client) | C2 (+C4 entry) | — | — |
| 👤 Profile (client) | C5 C7 | — | — |

## 2. Route tree (Expo Router — design only; `app/` stays locked until Gate 6)

```text
app/
  _layout.tsx                        # root stack: theme, fonts (exists), auth listener,
                                     #   offline banner, notification deep-link router
  (consumer)/                        # role-adaptive consumer shell (tabs)
    _layout.tsx                      #   TabNav; 4 slots; 4th slot label/href by auth state
    index.tsx                        # 🏠  guest home        → sections/02-home/00
    dashboard.tsx                    # 🏠  client home      → sections/02-home/01  [same slot]
    treatments/
      index.tsx                      # 💆  directory+filters → sections/03-discover/00 (+02 concern deep-state)
      [slug].tsx                     #     treatment detail  → sections/03-discover/01
      faq.tsx                        #     FAQs / hours / contact → sections/03-discover/03
    consult.tsx                      # ✦(anon) consultation explainer + auth sheet → 04-book/00 intro
    request/                         # ✦(client) booking-request wizard  → 04-book/*
      index.tsx                      #   step 1 kind → 2 treatment → 3 day+band → 4 review
      [step].tsx                     #   (single dynamic step route keeps URLs shareable/deep-linkable)
      acknowledgement.tsx            #   receipt (verbatim 1-working-day copy, R02)
    profile/                         # 👤 hub + sub-routes → 08-profile-privacy/*
      index.tsx
      edit.tsx · phone-verify.tsx · consents.tsx · deletion.tsx · privacy-links.tsx
      staff-entry.tsx                #   visible only when role staff/owner (see §4)
  appointments/                      # pushed stack (not a tab) → 05-appointments/*
    index.tsx · [id].tsx · [id]/change.tsx
  enquiries/                         # pushed stack → 06-enquiries/00
    index.tsx · new.tsx · [id].tsx
  updates/                           # pushed stack → 07-updates/00
    index.tsx · [id].tsx
  (auth)/                            # modal-ish stack → 01-auth/*
    sign-in.tsx · sign-up.tsx · verify-email.tsx · forgot.tsx · privacy-notice.tsx
  admin/                             # STAFF/OWNER workspace — separate tree
    _layout.tsx                      #   identity strip + guard (role check, see §4)
    (tabs)/
      _layout.tsx                    #   TabNav admin 4 slots
      index.tsx                      # 📥 queue list        → 09-staff-queue/00
      dial.tsx                       # ☎ directory search   → 10-staff-dialler/00
      care.tsx                       # 💆 care hub          → 12-staff-comms/* + 13-staff-catalogue/* entry
      more.tsx                       # ⋯ more (owner sections, sign-out, switch view)
    queue/[requestId].tsx            #   triage detail      → 09-staff-queue/00
    queue/[requestId]/confirm.tsx    #   chain scheduler    → 09-staff-queue/01
    queue/[requestId]/decline.tsx    #   decline w/ reason  → 09-staff-queue/02
    queue/[requestId]/propose.tsx    #   propose alternative→ 09-staff-queue/02
    dial/client/[userId].tsx         #   client detail      → 10-staff-dialler/01
    dial/diary.tsx                   #   today's board      → 11-staff-diary/00
    dial/diary/[appointmentId].tsx   #   outcome recording  → 11-staff-diary/01
    care/enquiries.tsx + [id].tsx    #   thread inbox       → 12-staff-comms/00
    care/updates.tsx + [id].tsx      #   drafts/publish     → 12-staff-comms/01
    care/prices/[treatmentId].tsx    #   price edit         → 13-staff-catalogue/00
    care/hours.tsx                   #   hours + overrides  → 13-staff-catalogue/01
    more/seats.tsx                   #   OWNER seats        → 14-owner-access/00  (secondary)
    more/gdpr.tsx + gdpr/[requestId].tsx  # OWNER deletion  → 14-owner-access/01 (secondary)
```

## 3. Role-adaptive rules (how one tab slot serves two roles)

- Slot 1 renders `index.tsx` (guest) or `dashboard.tsx` (client) — chosen by the auth listener,
  never by two tab bars; same position, size, header height → no jump on sign-in.
- Slot 3 hrefs to `consult.tsx` when signed out (static explainer + `<AuthGateSheet>`), to
  `request/` when signed in. The ✦ glyph is constant (intent = "start something with the clinic").
- Slot 4 hrefs to `(auth)/sign-in` when signed out; `profile/` when signed in.
- Staff signing in **does not** auto-enter the workspace; launch lands on their **client** shell
  (staff can also be clients), with a `Staff workspace` entry on Profile (`staff-entry.tsx`).
  Deep-links into `admin/*` render the workspace regardless of launch tab.
- `[Switch to Client View]` (`more.tsx`) pops back to `(consumer)`; `[Open staff workspace]`
  re-pushes `admin` — one session, one role check per navigation (no re-login).

## 4. Guards (UI-side; RLS is the real gate — R07)

| Guard | Mechanism | Failure UX |
|---|---|---|
| Consumer-only routes | `(auth)` listener state; `request/*`, `appointments/*` redirect to `(auth)/sign-in` with `?next=` | signed-out preview card + sheet, never a blank white screen |
| Admin tree | `admin/_layout.tsx` checks active `user_roles` (cached from profile fetch); non-staff see "You don't have access" + back | no tab flash — guard sits above the TabNav |
| Owner-only `more/seats` · `more/gdpr` | `app.is_owner()` (DB) — UI hides entry but RLS rejects the write anyway; friendly `P0001` seat-cap / 42501 copy in `00-cross-cutting.md` §6 | "Only the owner can manage seats." |
| Stale session mid-flow | auth listener → keep draft (request wizard), re-auth sheet, resume | `idempotency_key` guarantees no duplicate on retry (C2) |

## 5. Primary actions & help paths

- **Consumer primary action:** `✦` (Consult/Request). Secondary: Treatments search; phone one-tap
  (`tel:+447301166333`, W05) always in the guest-home header area and Contact sheet — the clinic's
  live path when closed. Address card (327 Deane Road, Bolton BL3 5HN, W01) static.
- **Crisis/medical help path:** none invented — this is cosmetic/laser aftercare advice; FAQ copy
  links to NHS 111 **only if owner supplies that text** (open asset request; not shipped as-is).
- **Admin primary action:** confirm a queued request; every transition auto-logs to
  `booking_request_events` (S12) with R06 notifications.

## 6. Deltas vs Phase 1 (what changed at sign-off)

1. Consumer tabs 3 → **4** (Treatments kept as its own tab — Option A's strength folded in).
2. Guest keeps `✦ Consult` + `👤 Sign In`; client keeps `✦ Request` + `👤 Profile` (locked naming).
3. Admin `☎ Dial` now also hosts the **diary board + outcomes** (F2 folded into Dial, not its own
   tab); `💆 Care` hosts enquiries/updates/price/hours edits (F4+F5); `⋯ More` hosts owner items
   (F6/F7) + view switch. `14-owner-access` screens are built but **secondary to the M1 demo
   slice** (see `03-routing-map.md` flags).
4. J1 + J2 journeys specified in full (locked priority) → `sections/15-journeys/`.
