# 00 — Cross-cutting Screens & States (patterns every section reuses)

One definition per pattern; section files draw these, they never re-invent them.

## 1. Loading skeletons (`C13`)

Rule: skeleton shape ≈ final shape; 250 ms min-display to avoid flash; > 8 s → inline
`ErrorRetry`. Personal-data screens never cache-render (offline = §5 error, not stale queue).

```text
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ ▓▓▓▓▓▓  Dashboard loading    │  │ ○ Home  ○ Treatments  ○ …    │
│ ┌──────────────────────────┐ │  │ ╔══════════════════════════╗ │ ← DashboardSkeleton
│ ┊ ▓▓▓▓▓▓▓▓▓  ▓▓▓▓          │ │  │ ║ ▓▓▓▓▓▓▓▓▓▓▓  (next appt) ║ │   (hero card + 2 rows
│ ┊ ┌──┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │  │ ║ ▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓▓▓▓ ║ │    + updates strip)
│ ┊ │▓▓│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      │ │  │ ╚══════════════════════════╝ │
│ ┊ └──┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │  │ ┌────┐┌────┐┌────┐ ┌────┐   │
│ ┊ …                       │ │  │ │▓▓▓▓││▓▓▓▓││▓▓▓▓│ │▓▓▓▓│   │ ← CardSkeleton rail
└──────────────────────────────┘  └──────────────────────────────┘  shimmer = opacity pulse
```

## 2. Signed-out posture (never a dead end)

Any client-only route reached while signed out (stale session, deep link, back-navigating after
sign-out) renders the **gate card** over the real surface — content stays reachable via tabs.

```text
┌──────────────────────────────┐
│ 🏠 Home          [🔔]        │
│ ═══════════════════════════  │
│ ┌──────────────────────────┐ │
│ │ 🔒  This is your area    │ │
│ │ Sign in to see upcoming  │ │
│ │ appointments, reminders  │ │
│ │ and answers to your      │ │
│ │ questions.               │ │
│ │                          │ │
│ │  [   Sign in   ]       ← primary (gold)
│ │  [ Create account ]    ← secondary (plum)
│ │  Browse treatments     ← quiet, keeps app open
│ └──────────────────────────┘ │
│ Browsing works fine without  │  (S02: "Signed-out state never blocks
│ an account — nothing here    │   public browsing")
│ was lost.                    │
└──────────────────────────────┘
```

## 3. `AuthGateSheet` (`C14`) — the one modal that speaks for all gated actions

Trigger: guest taps `✦ Consult` CTA, "Ask about this treatment", or any gated route's CTA.

```text
│  (scrim over current screen) │
│ ╔══════════════════════════╗ │
│ ║  Start with your details ║ │   title = value ("what you get"), not
│ ║  ─────────────────────── ║ │   "AUTH REQUIRED"
│ ║  One account lets you:   ║ │
│ ║  • request bookings      ║ │
│ ║  • see reminders         ║ │
│ ║  • ask questions privately│ │  (M01 jobs, no invented perks)
│ ║  ─────────────────────── ║ │
│ ║  [   Create account   ]  ║ │   → (auth)/sign-up
│ ║  [      Sign in       ]  ║ │   → (auth)/sign-in
│ ║  Just looking →          ║ │   dismiss (never punished)
│ ║  🔒 We only ask what the │ │
│ ║    clinic needs: name,   │ │   DA-11 field promise
│ ║    email, mobile.        │ │
│ ╚══════════════════════════╝ │
```

## 4. Offline — cached-catalogue banner (consumer browse surfaces)

```text
┌──────────────────────────────┐
│ ⚠  You're offline — showing   │  C10 offline tint; text R09;
│    the saved treatment list.  │  "times may have changed" suffix
│    Prices and hours may have  │  on the Open/Closed chip when stale
│    changed.  [Retry]          │
│ ───────────────────────────── │
│ [cached TreatmentCards…]      │  banner scrolls with content (04 §1);
└──────────────────────────────┘  personal-data screens use §5 instead
```

## 5. Offline / network error on live data (no stale render)

```text
┌──────────────────────────────┐
│ ☎ Dial                       │
│ ┌──────────────────────────┐ │
│ │ ⚠  Couldn't reach the    │ │   danger text + hairline;
│ │    clinic's records.     │ │   never shows partial/frozen
│ │                          │ │   admin data as if current
│ │ [      Try again       ] │ │
│ │ Call 07301 166333        │ │   the clinic's real fallback (W05)
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 6. Submit failure & the `idempotency_key` retry dialog (C2 flow)

The dialog is the *only* place retry mechanics are ever explained to a client.

```text
│ ╔════════════════════════════╗ │
│ ║  ⚠  Your request may not   ║ │
│ ║     have reached the       ║ │
│ ║     clinic.                ║ │
│ ║  ───────────────────────── ║ │
│ ║  Tap “Try again” — your    ║ │   unique key per draft
│ ║  request won't be sent     ║ │   (booking_requests unique
│ ║  twice.                    ║ │   (clinic,user,idempotency_key))
│ ║                            ║ │
│ ║ [   Try again          ]   ║ │   resend SAME key; server
│ ║                            ║ │   unique index = no dup
│ ║ [ Save for later & close ]   │   draft kept on device
│ ╚════════════════════════════╝ │
```

Validation errors are inline (`Field` error slot) — e.g. DA-12 duplicate verified phone on
sign-up/profile: `danger` caption *"That mobile is already registered with us — try signing in,
or tap ‘Forgot details’ and we will call you."* (mirrors `translateAuthError` tone, `lib/auth.ts`).
Seat-cap style *server-rejected* errors (S16) show the DB message verbatim in admin surfaces
(§8).

## 7. R06 notification rule (rendered discipline)

- Push preview is **always**: "An update from Unique Laser Clinics — open the app to view."
  (DA-09). The DB tripwire `assert_r06_generic_copy` rejects anything naming a treatment —
  so no screen ever has a "notification text" composer; in-app inbox rows may show the clinic's
  own title, never client health context.
- In-app bell sheet (`🔔` header action, client + admin shells):

```text
┌──────────────────────────────┐
│ 🔔 Notifications         ✕  │
│ ─────────────────────────── │
│ ● Booking update            │  kind icon only; deep-link
│   Your request has a new    │  row → appointments/[id]
│   status — open to view.    │
│   Tue 4 Nov · 10:12         │
│ ● Reminder                  │
│   Open the app to view.     │
│ ─────────────────────────── │
│ [Mark all read]             │
└──────────────────────────────┘
```

## 8. Server-error surface pattern (admin)

Admin write failures show what the DB said (mapped in `lib/db.ts` `fail()`), styled `danger`,
plus the fallback action. Known mappings to test in M1:
seat-cap trigger message · `42501` permission paths (client status edit, non-staff
`search_clients`, non-owner `apply_deletion`) · `R06` rejection wording if a publish path ever
composes titles — flagged, no UI constructs it.

## 9. Long content / keyboard-open checks (every form & list section)

- Long name "Christopher Athanasopoulos-O'Rourke" → row wraps to 2 lines then ellipsis in lists;
  full text in detail. Long FAQ answers/notes → never truncated in detail (`04` §1).
- Keyboard open: sticky CTA docks above keyboard; field scroll-into-view + 12 pt gap; page
  scrolls; tab bar hidden while keyboard up (both shells).

## 10. Role transition moments

- Sign-in success: sheet dismisses → destination screen renders *with* data (no skeleton replay
  if < 250 ms). Tabs relabel slot 4 Sign In → Profile in place.
- Staff opening the workspace: Profile → *Staff workspace*; identity strip appears; leaving via
  `[Switch to Client View]` returns to the same client tab they were on.
- Sign-out (Profile → More): stays on public browse, guest tabs; cached catalogue cleared of
  personal surfaces (appointments/enquiries/dashboard wiped, S02).
