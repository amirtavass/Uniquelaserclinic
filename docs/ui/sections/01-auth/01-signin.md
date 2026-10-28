# 01-auth / 01 — Sign-in & session (S02 · DA-19)

**Answers U4 (returning path) and unlocks C1–C7.** Tab `👤 Sign In` lands here directly.
**Seams:** `signInWithPassword`, `currentSession`, `onAuthChange` (auth only — `lib/auth.ts`).

```text
┌──────────────────────────────┐
│ ←         Sign in            │
│ ──────────────────────────── │
│ Email           [            ]│
│ Password        [  •••••••  ] │
│ [         Sign in         ]  │  primary
│ Forgot details?               │  → (auth)/forgot —
│                               │  "We’ll call you on 07301 166333
│ ──────────────────────────── │   if that’s easier." (W05,
│ New here? [  Create account ] │   no invented self-service reset
│                               │   promise beyond email reset link)
└──────────────────────────────┘
```

## States

**Loading:** `ListSkeleton` not applicable — button spinner; session swap happens in ≤ 1 frame
after success (cross-cutting §10).

**Error / validation:**

```text
│ ⚠  We couldn’t sign you in.   danger banner under CTA;
│    Check your email and       wrong-credentials = ONE generic
│    password and try again.    line (no account-enumeration copy)
│ ⚠  Confirm your email first — we sent a link: [Resend]  (unverified S01 gate)
```

**Signed-in already:** route redirects to destination/`🏠 Home` (no double session chrome).

**Session persistence (S02 AC):** app restart → silent `currentSession()` restore → tab bar
relables (Sign In → Profile), home slot swaps to dashboard; secure-store tokens (`lib/supabase.ts`
adapter) — never shown to user.

**Offline sign-in:** cached session (if any) keeps working for browse; fresh sign-in attempt →
cross-cutting §5 error (no "guess").

**Staff signing in here:** lands on their client shell; `Profile → Staff workspace` entry appears
(`getMyRoles`, routing-map row 15). No admin chrome leaks into consumer tabs (`02-navigation` §3).

**Edge — phone OTP:** hidden affordance in demo (DA-19 sim); M1 ships real OTP behind the same
sheet with `requestPhoneOtp/confirmPhoneOtp` seams — layout slot reserved:
`[ Use mobile number instead ]` caption row above "Forgot details?".

**Edge — 4+ failed attempts:** keep generic copy + `Call 07301 166333` quiet link (W05).
**Null/empty:** n/a input screen (gate card §2 IS its null on gated routes). **Long:** email input
scrolls internally; error copy wraps. **Keyboard open:** Sign-in button docks above it (cross-cutting
§9); fields keep focus ring visible.
