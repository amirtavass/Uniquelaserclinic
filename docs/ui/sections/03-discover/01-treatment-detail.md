# 03-discover / 01 — Treatment Detail (U2 · S04 · W02 W04 · R03 DA-15)

**Job:** "What exactly happens before my first session?" Shows ONLY published, seeded fields;
every missing value renders as "Discussed at consultation" (never blank, never invented, V2 §11).
**Seam:** `getTreatmentBySlug(slug)` (EXISTS — returns treatment + category + `course_packages`).

## Three layout variations (Gate 6 choice)

### L1 — Article with sticky dual bar (RECOMMENDED, locked default)
Mirrors the site detail pages + the verified persistent mobile action bar ("Call the clinic |
Free consultation").

```text
┌──────────────────────────────┐
│ ←                            │
│ ▓▓ photography (arch-top) ▓▓ │  client asset slot; until supplied,
│ ▓▓                         ▓▓│  category tint block (no stock)
│ ──────────────────────────── │
│ Laser Hair Removal           │  h2 display
│ LASER · UNWANTED HAIR        │  eyebrow caption (goldText)
│ From £35 per session         │  P9 large
│ ┌ fact strip ──────────────┐ │
│ │ Usually  6–8 sessions    │ │  typical_sessions_min/max
│ │ Session  ~30–60 minutes  │ │  duration (else "Discussed at
│ └──────────────────────────┘ │   consultation")
│ How it works                 │  description prose (ulc-prose
│ “Permanent hair reduction for…”│  role; 2–3 paragraphs max)
│ ┌──────────────────────────┐ │
│ │ ✦ Start with a free      │ │  W02 copy bank card (rose tint)
│ │   consultation + patch   │ │  "24 to 48 hours before your
│ │   test                   │ │   first full session" (R03)
│ │   6-session course · 20% │ │  course_packages row, verified
│ │   off (price on consult) │ │  counts only (DA-15: no package
│ └──────────────────────────┘ │  price — none published)
│ Good to know                 │
│ ● Safe for most skin types…  │  Fitzpatrick line W06 IF seeded
│ ⚠ Individual suitability and │  disclaimer, verbatim (S04 AC)
│   results vary.              │
│ Questions about this?        │  → enquiry w/ treatment_context_id
│ [ Ask about this treatment ]   quiet link (S09, gate if anon)
├──────────────────────────────┤
│ [Call 07301…] [Free consult ✦]│  STICKY bar — site-verified dual
├──────────────────────────────┤  pattern (primary = gate → ✦ flow)
│ 🏠 💆 ✦ 👤                   │
└──────────────────────────────┘
```

- **UX rationale:** reading order = the site's own argument (what → how → safe → start); the sticky
  bar converts the exact moment of intent. **Pros:** content-truthful, one CTA that must never be
  wrong, works offline from cache. **Cons:** long scroll to reach CTA on small phones (mitigated:
  CTA is always on screen — that's the point). **Answers U2:** "what happens before my first
  session" = the rose card is mid-scroll, not footnote.

### L2 — Journey-first cards
Chain stepper above the prose: "Your 4 steps with this treatment".

```text
│ Your journey: ① Free consult → ② Patch test (24–48 h) →
│ ③ Sessions (usually 6–8) → ④ Aftercare          [start ①] │
│ — then prices/prose below                                  │
```

- **Rationale:** R03/W02 is the clinic's differentiator; lead with it. **Pros:** expectation-setting
  maximal for first-timers; reuses `ChainStepper` chrome. **Cons:** repeats the same 4 steps on all
  31 treatments (boring catalogue chrome); buries price, which U1 said people hunt for; looks
  like process, not result. **Answers U2:** directly, at the cost of U1's price glance.

### L3 — Split tabs (Overview | What to expect)
Two-segment control under the title; tab 2 hosts consultation/patch-test/course/disclaimer.

- **Rationale:** shortens scroll; separates marketing from clinical expectation. **Pros:** skimmable
  return visits; clear R06-style chrome separation (no health advice mixed into sales copy).
  **Cons:** hidden content = lower trust on first visit; tabs mis-set screen-reader context;
  invents a *structure* the site doesn't use. **Answers U2:** yes for tab 2 — but only after the
  user knows the tabs exist.

**Decision: L1**, with L2's one-line stepper *inside* the rose card when `requires_patch_test`
(a nod, not a takeover). Missing-field matrix locked: sessions NULL → "Discussed at consultation";
duration NULL → same; `pricing_model=PRICE_ON_CONSULTATION` → "Price on consultation" label, no
`price_from` row; package `price_pence` NULL → show count/discount only, never a computed total
(R05 — no invented arithmetic on client's behalf).

## States

**Signed-out:** full view (no login gate on browse); sticky `[Free consult ✦]` → `AuthGateSheet`.
**Loading:** title slot + arch-image skeleton + `ListSkeleton(2)` fact rows (cross-cutting §1).
**Null:** all 31 directory cards open this route, but only the 22 `has_detail_page` seeds (DA-14)
carry prose — the rest render name + summary + the rose card + "Discussed at consultation" fills.
Unknown slug (typo/unpublished) →

```text
│ ⚠ We can’t show that page    │  getTreatmentBySlug → data null
│    right now — it may have   │  (RLS/404-safe copy, not a
│    changed.                  │   fake treatment)
│ [ Browse all treatments ]    │
```

**Offline:** cached detail renders fully + banner §4; sticky call button always live (tel: works
without data — brand promise survives).
**Error:** fetch fail w/o cache → same card as null, + retry (cross-cutting §5).
**Edge — min_gap content (tattoo, 42 d):** client-facing copy stays "Sessions are spaced about six
weeks apart" **only where seeded from site text** (W04 line) — never restated as policy; the
DA-05 warning belongs to staff (`09/01`). **Edge — long description:** wraps fully, no clamp on
detail. **Edge — keyboard:** n/a (no inputs); enquiry link navigates away.
