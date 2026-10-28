# 15-journeys / 01 — J2: "I'm not sure yet — advise me" (full 5-stage, all tiers)

The ADVISE_ME vertical (`request_kind='ADVISE_ME'`, DA-02/14 — the site widget's own first option,
W03). Persona: "Tom". The demo's empathy journey: the app must never pretend to know which
treatment fits (no quiz invented, no AI skin advice — parked story list, `01-user-stories` §NOT).

## Stage ① — ANON: concern without a name

```text
💆 Treatments (03/00)            ✦ Consult (04/00) → AuthGateSheet → S01
┌────────────────────────┐     ┌────────────────────────┐
│ [🔍 ] (All)(Hair)…      │     │ Free consultation &     │
│ — nothing fits:         │     │   patch test explainer  │
│ ✕ “sore after shaving”  │     │ [ Create account ]      │
│   → 0 matches →         │ ──▶ │ [ Sign in ]             │
│   [ Ask us for advice ] │     │ …or the booking route:  │
│   (S09 — but Tom wants  │     │ 👤 Sign In tab → (auth)  │
│    a person, not a form)│     │  sign-up completes the  │
└────────────────────────┘     │  same DA-11 fields.     │
  (home variant: the "Not     └────────────────────────┘
   sure — advise me" tile,     Guest path chosen: verify email
   03/02 L3, seeds this)       → client Tom.
```

**Stage-① states shown:** 0-search-match EmptyState → advice bridge (S09 copy bank); signed-out
draft survival; DA-12 dup path untriggered (Tom's number is new).

## Stage ② — CLIENT: request step 1 = ADVISE_ME (C2)

```text
✦ Request (04/00 L1)                    step 3 (treatment step SKIPPED)
┌────────────────────────────┐        ┌────────────────────────────┐
│ ──●──②──③──④                │        │ When suits you?              │
│ What do you want to start?  │        │ Mon 10 Nov · ●(Morning)      │
│ ◉ I’m not sure yet,         │  ────▶ │ Note: “after shaving gets    │
│   advise me  ★ (first row,  │        │   sore — not sure what       │
│   site’s own words, W03)    │        │   helps” ← verbatim, raw     │
│ ○ Free consultation         │        │ ⓘ no medical details (DA-10) │
│ ○ A specific treatment      │        │ [ Next ] → review            │
│ (step 2 treatment picker    │        │ ✓ “Advise me · Mon 10 ·      │
│  never opens — the DB check  │        │   Morning” [ Confirm ✦ ]     │
│  booking_requests_treatment_ │        └────────────────────────────┘
│  required allows NULL        │         snapshot: treatment_name =
│  treatment for ADVISE_ME)    │         (none) — receipt shows kind
└────────────────────────────┘          only (04/01 honest chrome).
```

## Stage ③ — CLIENT: same receipt, different meaning

04/01 verbatim R02 line unchanged — the one-working-day promise covers advice too. Home strip:
"▸ 1 request awaiting confirmation". Enquiry? Tom also taps "Ask us for advice" from
`04/02`? — allowed, two open items by design (request + enquiry are separate rows; nothing merged
or deduped inventively).

## Stage ④ — STAFF: ADVISE_ME in the queue

```text
📥 Queue card                        queue/[id] detail (09/00)
┌────────────────────────────┐     ┌────────────────────────────────┐
│ ● Tom H. · 073xx…      [☎] │     │ Request · Tom Hayes            │
│   ADVISE ME ✦              │ ──▶ │ kind: Advise me (no treatment) │
│   Mon 10 · Morning         │     │ note: “after shaving gets sore │
│   note: “after shaving…”   │     │   — not sure what helps”       │
│   [View ▸]        09:15    │     │ ☎ call first — the advice IS   │
└────────────────────────────┘     │   the consultation (W02):      │
  ✦ chip = kind badge P7 words     │   [✓ Confirm & schedule]       │
  (queue never shows invented      │   [↺ Propose a day] [✕ Decline]│
   guess-treatment labels)         └────────────────────────────────┘
                                   09/01 Confirm for ADVISE_ME:
                                   ① Consultation Mon 10 09:30 ✓
                                   ②/③ grey “after the consultation —
                                   the clinic decides together” (R03
                                   chain starts here, not before;
                                   no PATCH_TEST/SESSION invented —
                                   treatment chosen in the room)
```

**Branches:** Decline example (all morning slots full that week): reason → "Morning slots are full
— shall I hold Tue?" verbatim to Tom (`04/02`). Propose → Mon→Wed alternative, client awaits the
call (no self-accept button — R02).

## Stage ⑤ — CLIENT: outcome & the chain that may follow

```text
🏠 Home                             05/00 list                       post-consult
┌────────────────────────────┐   ┌────────────────────────────┐  ┌────────────────────────┐
│ ║ Consultation              │   │ ✓ Consultation Mon 10      │  │ (staff booked 2nd       │
│ ║ Mon 10 Nov · 9:30         │──▶│   Confirmed → attended     │  │  consult/chain rows for  │
│ ║ ● Confirmed               │   │ ▸ request closed-out       │  │  Laser Hair Removal      │
│ ║ (no treatment name —      │   │ (history retained, S06 AC) │  │  from J1 onwards —       │
│ ║  there wasn’t one)         │   └────────────────────────────┘  │  J1 stages ③–⑤ apply     │
└────────────────────────────┘                                    │  verbatim) ▸ the        │
  reminder arrives (R06 generic) — same DA-08 24 h rule.           │  two journeys hand off. │
                                                                   └────────────────────────┘
```

**J2 invariants proven:** `ADVISE_ME` is a first-class kind everywhere (picker, DB constraint, queue
chip, receipt) · zero invented triage logic in-app (health advice stays at the consultation, R04/
DA-10) · the chain begins at CONSULTATION and *grows* the moment a treatment is chosen (J1's
chrome takes over — no second UI dialect) · empty-but-honest moments (grey ②/③) use "the clinic
decides together" — the only promise the site actually makes.
