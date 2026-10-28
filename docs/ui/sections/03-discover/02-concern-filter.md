# 03-discover / 02 — Concern Filter (U1 deep-state · S03 · W04 pills)

The concern axis of `00-treatments` — specified separately because guest-home pills and the
empty-search "advise me" tile both **deep-link into it**. State lives in the URL
(`/treatments?concern=acne`), so back/swipe behaves and links survive cold start.

```text
┌──────────────────────────────┐
│ 💆 Treatments                │
│ [ 🔍 ]                       │
│ CONCERN ▸ (All)●(Hair)(Ageing)│  active pill = plum fill,
│           (Pigment)(Acne)(Ink)│  pearl label (L1 row 1)
│ CATEGORY ▸ (All)(Laser)…      │  second axis still combinable
│ 4 treatments for “Acne”       │  count line = filtered length
│ ┌──────────────────────────┐ │
│ │ Laser Acne Treatment     │ │  From £80 per session, 4–6
│ │ …                        │ │  sessions (W04 verified text)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Not sure this is the one?│ │  rail-end card (always last):
│ │ Ask us — advice is free. │ │  [ Ask for advice ] → S09 gate
│ └──────────────────────────┘ │  (mirrors "I'm not sure yet,
├──────────────────────────────┤   advise me" W03 — the clinic's
│ 🏠 💆 ✦ 👤                   │   own fallback, not invented)
└──────────────────────────────┘
```

**States** (inherits L1 table in `00`; deltas only):

- **Loading:** pill rows render instantly (cached meta), result area `ListSkeleton(3)`; changing a
  pill never re-skeletons the pills.
- **Null — concern maps to 0 treatments:** EmptyState (cross-cutting §… "0 matches" art in `00`) +
  "Ask us for advice" (S09). Concerns are seeded `treatment_concern_links` — a real 0 is possible
  until link data lands; copy stays honest, no fallback list shown silently.
- **Offline:** local filter over cached catalogue; banner §4; "advice" card action still opens the
  gate sheet (it only needs a tap now, submit later — drafts hold).
- **Error:** §5 card (cache-miss case).
- **Edge — two concerns active conceptually:** one pill per axis at a time (single-select);
  multi-select is a named phase-2 question (not invented here). **Edge — signed-out vs client:**
  identical; the client's "advise me" card goes straight into `✦ Request` step 1 pre-set
  `ADVISE_ME` (C2), no gate.
