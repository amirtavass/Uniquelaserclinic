# 08-profile-privacy / 00 — Profile, Edit & Phone Re-verify (C7 · S01/S11 · DA-11 DA-12)

**Seams:** `getMyProfile()` ADD(M1) · `saveClientProfile()` EXISTS · phone re-verification =
`requestPhoneOtp()/confirmPhoneOtp()/verifyPhone()` ADD(M1) (DA-19 simulated in demo; DA-11
fields ONLY — name/email/mobile, no DOB/address until Q02 lands).

```text
┌──────────────────────────────┐
│ 👤 Priya Sharma              │  hub: name, verified check
│ ✓ Mobile verified · 079xx x…  │  (last 4 only on hub —
│ ──────────────────────────── │   minimise shoulder-surf)
│ MY BOOKINGS                   │
│ ▸ My appointments      (2)   │ → 05/00
│ ▸ My requests          (1)   │ → 04/02
│ ▸ My questions         (1)   │ → 06/00
│ ▸ Clinic updates       (2 ●) │ → 07/00
│ ──────────────────────────── │
│ ME & MY DATA                  │
│ ▸ Edit details               │ → edit.tsx (below)
│ ▸ Notifications & marketing  │ → 01/consents (R08)
│ ▸ Request data deletion      │ → 02/deletion (DA-17)
│ ▸ Privacy notice · Terms     │ → site links (S11 AC)
│ ▸ [Staff workspace]          │  ONLY if getMyRoles staff/owner
│ ▸ Sign out                   │ → guest tabs (cross-cutting §10)
└──────────────────────────────┘
┌── edit.tsx ──────────────────┐
│ First [Priya ] Last [Sharma ]│
│ Mobile  07911 555012  [✎]    │
│  ✎ change → re-verification   │  saveClientProfile keeps
│    REQUIRED (phone becomes     │  phone_verified_at NULL on
│    unverified until OTP lands) │  number change (DA-12 rule)
│ Email sam@… [locked — email    │
│  change is an owner-side action│  change path = open Q; UI
│  until the clinic offers one]  │  states limits, invents none
│ [          Save            ]   │
└──────────────────────────────┘
┌── phone-verify sheet ────────┐
│ Confirm your new number      │  6-digit row (demo: code shown
│ 07911 555012  [__ __ __ __]   │  on-screen, DA-19 — labelled
│ [ Resend code ] [ Confirm ]   │  “DEMO: real SMS in M1”)
└──────────────────────────────┘
```

**States**
- **Signed-out:** gate card; hub unreachable (tab 4 = Sign In instead — shell handles).
- **Null:** fresh account pre-profile (edge: auth user without `client_profiles` row) → forced
  complete-profile card (S01 fields), booking CTAs locked until done (email-verified gate S01 AC).
- **Loading / offline / error:** hub = cached? NO — personal data, §5; edit fields persist draft
  locally; save offline → §6 pattern reuses `saveClientProfile` (safe: upsert same row, retry ok).
- **Error / validation (DA-12):** new number already verified by another account → inline
  `danger`: "That mobile is registered with us already — sign in, or we’ll call you." (mirrors
  auth seam copy; no silent merge, no invented "claim this number" flow).
- **Edge — unverified duplicates:** allowed by index (DA-12) → hub shows "Verification pending"
  chip; staff sees flag on their side (`10/01`).
- **Edge — long names / keyboard / rotation:** standard (§9 cross-cutting).
