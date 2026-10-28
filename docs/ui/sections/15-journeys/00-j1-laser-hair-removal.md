# 15-journeys / 00 — J1: "Laser Hair Removal, from £35" (full 5-stage, all tiers)

The primary demo slice (`08-scope-and-demo-slice.md` §In scope), locked priority at sign-off.
Persona: new client "Priya" + staff "Sam". Every panel cites its section file — nothing here adds
behaviour the sections don't already define. Money/prices/hours/copy all from the verified bank
(`04-screen-craft` §10).

## Stage ① — ANON: browse → detail → intent → gate

```text
💆 Treatments tab            Treatment detail (03/01 L1)      ✦ Consult (04/00 intro)
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│ [🔍 laser        ]     │   │ ← Laser Hair Removal   │   │ Free consultation &    │
│ (All)●(Hair)(Ageing)…  │   │ LASER · UNWANTED HAIR  │   │   patch test           │
│ 4 treatments for “laser”│   │ From £35 per session   │   │ “Every new treatment    │
│ ┌ Laser Hair Removal ★┐│   │ Usually 6–8 sessions    │   │  starts with a free    │
│ │ From £35 · 6–8 sess ││──▶│ ✦ Start with a free     │──▶│  consultation and      │
│ └ [View] ─────────────┘│   │   consultation + patch  │   │  patch test.” (W02)    │
│ (cards cached offline; │   │   test · 24–48 h before │   │ [ Create account ]     │
│  banner §4 if offline) │   │ ⚠ Individual suitability│   │ [ Sign in ]            │
└────────────────────────┘   │   and results vary.     │   │ …just looking →        │
   tap = intent to start ───▶├────────────────────────┤   └────────────────────────┘
                             │ [Call 07301…] [Free ✦ ]│  Free ✦ → AuthGateSheet (§3):
                             └────────────────────────┘  “One account lets you request
                                                          bookings, see reminders…”
                                                          → (auth) sign-up S01 (01/00):
                                                          name/email/mobile + DA-11 fields,
                                                          DATA_PROCESSING consent row,
                                                          verify email; duplicate verified
                                                          phone → DA-12 friendly recovery.
```

**Stage-① failure states:** offline catalogue (§4 banner, browse continues); 0 matches → "Ask us
for advice" (S09, also gated); sign-up dup → inline DA-12; verify-email interstitial.

## Stage ② — CLIENT: the one-minute request (C2)

```text
✦ Request step 1               step 3 day+band                 step 4 review
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│ ──●──②──③──④            │   │ ──●──●──●──④            │   │ ✓ Laser Hair Removal   │
│ What do you want to     │   │ When suits you?          │   │ Sat 22 Nov · Afternoon │
│  start?                 │   │ [Sat 22] in calendar     │   │ Note: “evenings suit   │
│ ◉ A specific treatment  │──▶│ (Morning)(●Afternoon)    │──▶│   me better”           │
│   → picked: Laser Hair… │   │ (Evening)                │   │ ☑ Remind me (24 h)     │
│ [ Next ]  (ADVISE_ME    │   │ Note [optional]          │   │ [ Confirm ✦ ]          │
│   would skip step 2)    │   │ ⓘ no medical details     │   │  a REQUEST, not booked │
└────────────────────────┘   │   here — DA-10 steering   │   └────────────────────────┘
                              └────────────────────────┘    submit → createBookingRequest
                                                             (PENDING forced by trigger;
   Offline mid-flow: draft kept; on reconnect §6 dialog       name+price snapshots server-
   “won’t be sent twice” (idempotency_key).                   side; zero client-set status)
```

## Stage ③ — CLIENT: receipt & Home becomes live

```text
04/01 Acknowledgement              🏠 Home after (02/01 L1)
┌────────────────────────┐        ┌────────────────────────┐
│ ✦ ✓  Your request is in │        │ ▸ 1 request awaiting    │ ← PENDING
│ “We’ll be in touch within│  ────▶ │   confirmation          │   count from
│  one working day to     │        │ ✓ nothing else unread   │   client_dashboard()
│  confirm a time.” (R02) │        │ [ ✦ Request another ]   │   (one round trip)
│ Requested — not booked  │        └────────────────────────┘
└────────────────────────┘   Home strip + 04/02 list are the same truth;
                              no push yet (nothing to promise — S07 fires only
                              on confirmed; R06 keeps any preview generic).
```

## Stage ④ — STAFF: queue → call → confirm into the chain (F1/F3)

```text
📥 Queue (09/00 L1)                 queue/[id] (09/00 detail)        09/01 Confirm chain
┌────────────────────────┐        ┌────────────────────────┐      ┌────────────────────────┐
│ ▣ Staff · Sam ●1        │        │ Request · Priya Sharma │      │ ① Consult Fri 7 10:30  │
│ TODAY · 1 NEW           │  ────▶ │ ☎ 07911 555012 ✓ verif │───▶  │ ② Patch   Fri 7 11:00  │
│ ● Priya S. · TREATMENT  │        │ TREATMENT — Laser Hair…│      │ ③ Session Tue 25 15:00 │
│   Laser Hair Removal    │        │ prefers Sat 22 · Aftn  │      │ [ Schedule & confirm ] │
│   prefers Sat 22 · Aftn │        │ note “evenings suit me”│      │  (DA-05/06 banners can │
│   [View ▸]  [☎]         │        │ [✓Confirm][↺Propose]   │      │   appear — warn, never │
└────────────────────────┘        │ [✕Decline…]            │      │   block)              │
   unseen dot = S12 badge;          └────────────────────────┘      └────────────────────────┘
   ☎ taps tel: (callback R02).    Branches: Decline → reason verbatim    Branch: Propose →
   Optional ☎ pre-check via        to client (09/02); 04/02 row flips     09/02 — client sees
   Dial search (10/00, audited).   “Not available”.                       “Alternative proposed”.
```

After confirm: `appointments` chain rows exist; events auto-append; client's Home/updates reflect it
(Stage ⑤). Push fired (demo: local simulated, DA-19) with the DA-09 generic preview only.

## Stage ⑤ — CLIENT: the chain lands (C3/S06/S07)

```text
🏠 Home (transformed)                05/01 Patch-test tracker          reminder moment
┌────────────────────────┐        ┌────────────────────────┐    ┌──────────────────────┐
│ ╔ YOUR NEXT VISIT ═══╗  │        │ ①✓────②●────③○          │    │ Thu 6 10:30           │
│ ║ Consultation        ║ │        │ Free     Patch   First  │    │ 🔔 An update from     │
│ ║ Fri 7 Nov · 10:30   ║ │  ────▶ │ consult  test    session│◀── │  Unique Laser Clinics │
│ ║ ● Confirmed    [>]  ║ │        │ “24 to 48 hours before  │    │  — open the app to    │
│ ╚════════════════════╝  │        │  your first full        │    │  view.  (R06 generic; │
│ Patch test due before…  │        │  session.” (W02 bank)   │    │  deep-links 05/00→[id])│
│ (R03 one-line, 02/01)   │        │ Questions? [Ask advice] │    └──────────────────────┘
└────────────────────────┘        └────────────────────────┘
   Post-visit: staff marks COMPLETED on day board (11/01); tracker ① turns ✓, then the
   Session row; if Priya asks to move Fri 7 → 05/02 request-only flow → staff 11/02.
```

**End-to-end invariants proven by this journey:** one RPC feeds Home · request never claims booked
(R02) · chain is three distinct appointment types (R03) · no health field touched anywhere (R04) ·
prices integer pence end-to-end (R05) · previews generic by DB tripwire (R06) · staff↔client data
split by RLS not chrome (R07) · consent rows at signup + reminder toggle (R08) · UK copy (R09).
