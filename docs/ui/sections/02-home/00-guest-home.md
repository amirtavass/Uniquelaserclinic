# 02-home / 00 — Guest Home (U1 U2 U3 · W01 W02 W03 · DA-13)

**Job:** "is this real, are they open, what treats my concern — and how do I start?" The screen
mirrors the verified homepage order (hero → status → concern pills → treatment cards → how-it-works
→ book teaser → FAQs/contact) in mobile rails. **Seams:** `getOpeningStatus`, `getTreatments`
(featured), `getFaqItems`, `getCategories` — all EXISTS; all content cached for offline (§states).

## Layout (locked — hero is the ONE night canvas in the app)

```text
┌──────────────────────────────┐
│ ▓▓▓▓ NIGHT HERO ▓▓▓▓   [⋯]  │  ⌂ eyebrow: LASER CLINIC · BOLTON
│ ▓▓ Reveal your unique.  ▓▓▓ │  h1 (display, pearl): site head-
│ ▓▓ Laser & skin clinic in  ▓▓│  line — copy bank, W-verified
│ ▓▓ Bolton on Deane Road    ▓▓│
│ ▓▓ ● Open now · 10–6 daily ▓▓│  C4 StatusDot + OpenClosedBanner
│ ▓▓ [Book a free consultation]│  primary (gold) → ✦ Consult gate
│ ▓▓ [ Explore treatments  ]  │  ghost → 💆 tab
│ ▓▓ Or call 07301 166333     │  tel: link (W05)
├──────────────────────────────┤
│ WHAT TROUBLES YOU?           │  P3 Eyebrow
│ (Unwanted hair)(Ageing)(Pigment|veins)(Acne)(Tattoos) │ C2 pills
│ → deep-link 💆 with concern filter (U1)               │
├──────────────────────────────┤
│ OUR TREATMENTS               │
│ ┌──────────────────────────┐ │
│ │ Laser Hair Removal    ★  │ │ C1 TreatmentCard (featured)
│ │ Permanent reduction…     │ │   summary 2-line clamp
│ │ 6–8 sessions             │ │
│ │ From £35 per session     │ │ P9 PriceLabel
│ └──────────────────────────┘ │  … 8 featured cards, scrollable
│      [See all 31 treatments] │ → 💆 tab
├──────────────────────────────┤
│ HOW IT WORKS (rose band)     │ 4-step: Free consultation →
│ ① Consult  ② Patch test      │ Patch test (24–48 h) → Sessions →
│ ③ Sessions  ④ Aftercare      │ Aftercare — W02 copy bank
├──────────────────────────────┤
│ QUESTIONS?                   │ top 3 FAQ accordions (getFaqItems)
│ ▶ Is it safe for my skin…    │ [See all FAQs] → 03/03
│ 327 Deane Road, BL3 5HN      │ map-card static + [Directions]
│ OPEN EVERY DAY, 10AM–6PM     │ [hello@…] [Call]
├──────────────────────────────┤
│ 🏠 Home  💆 Treatments  ✦ Consult  👤 Sign In │
└──────────────────────────────┘
```

## States

**Signed-out:** this *is* the signed-out screen — everything browsable; both CTAs open
`AuthGateSheet` (cross-cutting §3), never a dead route.

**Null/empty:** catalogue is seeded content (counts from `seed-contract.json`, never this doc) —
if `getTreatments` returns `[]` (fresh DB / staff unpublished all): `EmptyState`
"Listings are being refreshed — call 07301 166333" + retry. No placeholder cards.

**Loading:** hero renders instantly (static copy) → `CardSkeleton` ×3 in treatments rail →
FAQs last. Skeletons per cross-cutting §1.

**Offline cached-catalogue:** full render from cache + banner (cross-cutting §4); Open/Closed chip
computed from cached hours + "may have changed" suffix (DA-13 keeps this honest).

**Error:** if neither network nor cache: hero + contact block still render (they're static/local) —
rail area shows cross-cutting §5 card with `Call` fallback. U3 "can I reach them" survives every
failure — the one invariant of this screen.

**Edge — closed hours:** dot muted, chip "Closed now · opens 10am tomorrow" + call link (US-04
site pattern; only verified hours). **Edge — override day** (holiday saved via `13/01`): banner
"Today: closed for Christmas Day" (reason text from override row). **Edge — long FAQ answers:**
detail expands in place; list clamps 2 lines. **Edge — Dynamic Type:** hero copy scrolls, no
fixed heights.
