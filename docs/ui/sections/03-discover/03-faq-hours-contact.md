# 03-discover / 03 — FAQs, Hours & Contact (U3 · W01 W05 · S03/S04 trust job)

**Job:** "Is it legit — open now, where is it, can I reach them?" One screen, three stacked
blocks; reachable from guest home and `✦ Consult` sheet footer.
**Seams:** `getFaqItems`, `getOpeningStatus` (EXISTS).

```text
┌──────────────────────────────┐
│ FAQs & visiting us            │
│ ──────────────────────────── │
│ ● OPEN NOW · 10 am – 6 pm    │  computed from cached rows;
│   Every day, incl. weekends   │  (DA-13 Mon–Sun 10–6 seeded)
│   Closed 25 Dec (override)    │  if override row exists (13/01)
│ ──────────────────────────── │
│ FREQUENT QUESTIONS            │  accordion rows (sort_order):
│ ▾ Does it hurt?               │
│ ▾ Is it safe for dark skin?   │  answers verbatim from
│ ▾ What happens at a patch     │  faq_items — never edited
│   test?  ▾ How much…  (12)    │  in-app copy
│ [ ✍ Ask a question ]          │  → S09 (gate if anon)
│ ──────────────────────────── │
│ VISIT US                      │
│ 327 Deane Road, Bolton BL3 5HN│  W01 verbatim
│ [ Directions ]  [ Call ]      │  maps launch intent + tel:
│ [ hello@uniquelaserclinics.co.uk ]│  mailto: (W05)
│ Instagram · TikTok            │  external links (W05 names
│                               │  only — no handles invented)
└──────────────────────────────┘
```

**States**
- **Signed-out:** fully browsable (public trust surface — S02 AC); "Ask a question" routes through
  `AuthGateSheet` first (S09 needs sign-in).
- **Loading:** hours chip renders after `getOpeningStatus` (≈ instant w/ cache); FAQ
  `ListSkeleton(4)`.
- **Null:** 0 FAQ rows → contact block still renders + "No questions listed yet — just ask us."
  (S09). Never a blank accordion.
- **Offline:** hours computed from cache + "may have changed" suffix; directions/call/mailto work
  natively — the trust job survives offline *by design*.
- **Error:** §5 card + call link.
- **Edge — closed-hours visit:** chip muted "Closed now · opens 10 am"; still shows call + address
  (US-04 site pattern). **Edge — long FAQ answers:** expand in place; no scroll-jacking.
  **Edge — override today (holiday):** row added, dated, reason text from the override record —
  if reason NULL, just the date + closed (no invented reason).
