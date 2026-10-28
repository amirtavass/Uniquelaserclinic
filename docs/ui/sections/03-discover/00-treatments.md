# 03-discover / 00 — Treatments Directory & Concern Filter (U1 · S03 · W04)

**Job:** "I have a concern — what treats it, and from how much?" 31 directory cards, 5 categories
(Laser/Skin/Anti-Ageing/Body/Wellness), 5 concerns (Unwanted hair/Ageing and texture/Pigment and
veins/Acne/Tattoos), live search. **Seams:** `getTreatments({search,categoryId,concernSlug})`,
`getCategories` (EXISTS) · `getConcerns()` **ADD(M1)**. No login (S03 AC). Results cached for
offline (§states).

## Three layout variations (Gate 6 choice)

### L1 — Pills-on-top directory (RECOMMENDED, locked default)
Fuses the homepage concern tabs and the `/treatments/` search+category tabs into one screen.

```text
┌──────────────────────────────┐
│ 💆 Treatments                │
│ [ 🔍 Search treatments…   ]  │  C3 (250 ms debounce)
│ ──────────────────────────── │
│ CONCERN ▸ (All)(Hair)(Ageing)(Pigment)(Acne)(Ink)│ C2 row 1 = concern
│ CATEGORY ▸ (All)(Laser)(Skin)(Anti-Ageing)(Body)(Wellness)│ row 2 = category
│ 31 treatments                │  count line = result length
│ ┌──────────────────────────┐ │
│ │ Laser Hair Removal    ★  │ │ C1 TreatmentCard ×n
│ │ Permanent hair reduction…│ │   (summary 2-line clamp)
│ │ Usually 6–8 sessions     │ │   sessions line (min–max)
│ │ From £35 per session     │ │   P9
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Laser Tattoo Removal     │ │
│ │ …                        │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ 🏠 💆 Treatments ✦ 👤        │
└──────────────────────────────┘
```

- **UX rationale:** two filter axes are *both* verified site patterns — keep them visible and
  combinable (concern ∩ category), in site language. **Pros:** zero new IA; search+filter share
  one scroll; deep-linkable (`?concern=acne`); count line answers "is the list alive".
  **Cons:** 2 pill rows cost 88 pt; on small phones rows scroll horizontally with cut-off hints.
  **Answers Part 1 U1:** the bucket's own sentence is the filter order (concern first, price on
  cards).

### L2 — Category-sectioned directory
Site mega-menu as IA: one long list grouped under category headers; concern chips float as a
filter overlay row.

```text
│ [🔍]  (Unwanted hair ✕)       │  search + active-concern token
│ ▾ LASER (5)                   │  group header w/ count
│   · Laser Hair Removal …      │
│   · Laser Tattoo Removal …    │
│ ▾ SKIN (10)                   │
│   · Carbon Laser Peel …       │
```

- **Rationale:** mirrors the mega-menu (same product feel), shows the true catalogue scale.
  **Pros:** browsing without a filter goal works; counts per category are honest. **Cons:** the
  U1 bucket asks *concern-first*; long scroll buries results; concern-filtering over groups makes
  awkward half-empty headers. **Verdict:** keep as the concernless browse mode inside L1's
  `(All)(All)` state? Yes — L1 default state renders grouped when no filter is active
  (hybrid noted for M1).

### L3 — Concern-led finder
Two-step: "What brings you in?" tile grid (5 concerns + "Not sure — advise me") → filtered list.

```text
│ WHAT TROUBLES YOU?            │
│ ┌────────┐┌────────┐          │
│ │Unwanted││Ageing  │          │
│ │ hair   ││texture │          │
│ └────────┘└────────┘          │
│ ┌────────┐┌────────┐┌───────┐ │
│ │Pigment ││ Acne   ││ Not   │ │
│ │& veins ││        ││ sure→ │ │
│ └────────┘└────────┘└───────┘ │
```

- **Rationale:** best first-visit mapping of the bucket question; the `Not sure →` tile seeds
  `ADVISE_ME` (J2 entry). **Pros:** zero jargon; great guest-home pill target; empathetic.
  **Cons:** extra step for name-searchers (the majority per site search box prominence); two
  screens to keep in sync. **Verdict:** folded into guest home (pills, `02-home/00`), not the
  tab itself.

**Decision: L1** (with L2 grouping for unfiltered state; L3 entry lives on Home + as the empty-
search "advise me" affordance).

## States

**Signed-out:** full function (S03 AC) — no gate anywhere on this tab.
**Loading:** `SearchField` live, list = `ListSkeleton(4)`; filters disabled until first paint.
**Null — 0 search matches (S09):**

```text
│ ✕ "bio repeel" — no matches   │
│ ┌──────────────────────────┐  │
│ │ 🤔 Nothing exactly like   │  │ EmptyState C12 — the ONE
│ │    that. We’ll point you  │  │ verified fallback, never
│ │    in the right direction.│  │ invented alternatives
│ │ [ Ask us for advice ]     │──┼─→ AuthGateSheet → enquiry (S09)
│ │ Browse all instead        │  │
│ └──────────────────────────┘  │
```

**Null — filter combo yields nothing:** same EmptyState, + quiet "clear filters" chip.
**Offline:** cached catalogue + banner (cross-cutting §4); search runs locally over cache
(matches name/summary as the seam does) — "results may be out of date".
**Error:** no cache + fetch fail → §5 card + call link.
**Edge — long names** ("Uneven Skin Tone & Texture Correction") → 2-line card title, never ellipsis
mid-word. **Edge — many results (31):** infinite scroll not needed; virtualise, count line stays.
**Edge — keyboard open:** list scrolls under search field; pills hidden while typing (focus mode:
search + live results only) to keep thumbs free.
