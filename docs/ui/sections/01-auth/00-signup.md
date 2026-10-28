# 01-auth / 00 — Sign-up (S01 · DA-11 · DA-19 · R08)

**Answers bucket U4** ("I'm ready — what does signing up need?"). Reached from `👤 Sign In` tab,
`AuthGateSheet`, and `✦ Consult` CTA. **Seams:** `signUpWithPassword` (auth) → `saveClientProfile`
→ `recordConsent(DATA_PROCESSING)`; phone OTP seam is demo-simulated (DA-19).

## Layout (locked, 1 screen + inline steps — matches the M01 "email + number + full info" promise
exactly, and nothing more: no DOB/address, they are blocked pending Q02)

```text
┌──────────────────────────────┐
│ ←        Create account      │
│ ──────────────────────────── │
│ First name      [            ]│
│ Last name       [            ]│
│ Email           [            ]│
│ Mobile          [+44 ___  ]   │  E.164 + raw stored (DA-11)
│ Password        [  •••••••  ] │  ≥ 8, meter caption only
│ ──────────────────────────── │
│ 🔒 Your details are held     │
│    privately for your        │
│    appointments with us.     │  privacy notice, 4 lines max,
│    Read the privacy notice > │  link → (auth)/privacy-notice
│ ┌──────────────────────────┐ │
│ │ ☑ I agree to my details  │ │  recordConsent GRANTED
│ │   being stored        ✓  │ │  (policy v + hash, R08)
│ │ ☐ Email me about offers  │ │  MARKETING — optional,
│ │ ☐ Push reminders         │ │  NOTIFICATIONS — optional
│ └──────────────────────────┘ │
│ [     Create account      ]  │  primary, docked above keyboard
│  Already with us? Sign in    │
└──────────────────────────────┘
```

## States

**Loading** — button shows spinner, form stays; on success: verify-email interstitial
(`(auth)/verify-email`): "We've sent a link to **you@example.com** — confirm it, then sign in.
[Resend]" (email verification required before booking, S01 AC).

**Validation / errors (inline, `Field` error slot):**

```text
│ Email           [sam@bolton ]│
│                 ⚠ Enter a complete   danger caption under field
│                   email address.     (form-level never toast-only)
│ Mobile          [+44 7301 16]│
│                 ⚠ That mobile is already registered with us —   DA-12 duplicate
│                   try signing in, or tap “Forgot details” and   verified-phone
│                   we’ll call you.                               recovery copy
│ (server dup email → same tone via lib/auth.ts translateAuthError)
```

Offline submit: form values kept, `ErrorRetry` banner (cross-cutting §5), no partial account.
**Null/empty:** n/a (input screen); the "half account" case (auth user without verified email /
profile row) is owned by `01-signin` + profile-forced card in `08/00`.

**Signed-out edge (this IS the signed-out screen)** — n/a; but deep link `?next=/request` after
success returns the user to the flow they attempted (auth listener, `02-navigation` §4).

**Edge — staff email signs up here:** still creates a client account only; role granting is
owner-only (R01) — no "admin request" hint invented.
**Edge — long names:** fields wrap; profile lists use 2-line rule (cross-cutting §9).
**Edge — keyboard open:** sticky CTA docks above keyboard (cross-cutting §9).
