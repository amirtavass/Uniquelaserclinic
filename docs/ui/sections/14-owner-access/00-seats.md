# 14-owner-access / 00 — Staff Seats (F6 · S16 · R01 · DA-01)

**TIER: OWNER-SECONDARY** — reached only via `admin/more` ⋯ when `app.is_owner()`; sits BEHIND the
core M1 demo slice per `08-scope-and-demo-slice.md` (the seats *guard* still appears in demo as
D-F7's "third invite refused" stub). Wireframe complete here so the Stage 6 spec has no holes.
**Seams:** `staffSeats()` + `grantStaffSeat(userId)` + `revokeStaffSeat(roleId)` ADD(M1) — all
owner-only via `user_roles` RLS (R07: the DB rejects staff writes; hiding the tab is courtesy, not
security).

```text
┌──────────────────────────────┐
│ ←  Staff seats               │  identity strip still shows
│ Owner seats — M01 agreed:    │  “▣ Owner · Ayesha”
│ you + 2 staff (max)          │
│ ┌──────────────────────────┐ │
│ │ 👑 Ayesha K. · OWNER     │ │  clinics@… · since Apr
│ │   Owner can’t be revoked  │ │  (self-lockout guard, R01
│ │   from here — seat 1 of a │ │  — one owner minimum:
│ │   different kind          │ │  stated, not scripted)
│ ├──────────────────────────┤ │
│ │ ● Sam O. · staff          │ │  active grant
│ │   sam@… · granted 22 Oct  │ │  granted_by shown
│ │   [Revoke…]               │ │  (C19 sheet: “Sam loses
│ ├──────────────────────────┤ │   admin access instantly.”)
│ │ ● Lena T. · staff         │ │
│ │   lena@… · granted 23 Oct │ │
│ │   [Revoke…]               │ │
│ └──────────────────────────┘ │
│ [ + Invite a staff member ]  │  primary when seat < cap; at
│   2 of 2 staff seats used     │  cap: DISABLED + honest caption
├──────────────────────────────┤  (never a mystery grey-out)
│ 📥 ☎ 💆 ⋯ More               │
└──────────────────────────────┘
```

Invite sheet (pre-created auth user model, S16 AC):

```text
│ ┌ Invite staff ────────────┐  │  email = the auth user Supabase
│ │ Email [lena2@…        ]  │  │  admin already created (walk-
│ │ Name  [Lena T         ]  │  │  through with owner in M1 setup;
│ │ [ Send invite & grant ]  │  │  app-side user creation is NOT
│ └──────────────────────────┘  │  invented — logged dependency)
```

**States**
- **Seat cap — the refused third grant (demo moment D-F7):** DB raises
  `staff_seat_max (2) reached — ask the owner to raise clinic_settings.staff_seat_max`
  (SQLSTATE **P0001**, `assert_staff_seat_cap` trigger) →

```text
│ ⚠ Both staff seats are full. │  friendly paraphrase of the
│   “Both staff seats are in  │  trigger line kept visible in
│   use — free one first, or   │  small type under it (DB truth
│   change the cap in clinic   │  shown, not hidden; cap change
│   settings with the owner.”  │  = Q01/owner, never in-app M1)
│ [ Cancel ]                   │
```
- **Empty-ish:** owner alone shows staff section "No staff yet — seat 1 of 2 open"; never hides the
  cap. **Loading:** rows `ListSkeleton(3)`; grants disabled while seats load (a grant against stale
  cap info would hit P0001 anyway). **Offline/error:** §5 + the refusal card above can also arrive
  offline-first? no — grant is a write, §5 blocks it offline.
- **Edge — revoked staff has the app open:** next admin route lands on "You don’t have access"
  (nav-ia §4) via RLS, not UI memory; toast-free by design (don't taunt). **Edge — a staff member
  is also the owner:** impossible path — `user_roles_active_one_per_user` partial-unique (one active
  role per user); mapped inline: "This person already holds another seat." **Edge — two owners?**
  schema allows owner grants; M01 says one — UI shows the current owner set faithfully; adding an
  owner = open Q (not invented, not blocked silently).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
