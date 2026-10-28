# 13-staff-catalogue / 00 — Price & Content Edit (F5 · S17 · R05)

💆 Care tab block 3. `getCatalogueForStaff()` + `editTreatmentPrice(id,pence,pricingModel)` ADD(M1)
— the `append_price_history` trigger snapshots old→new with actor (R05: screens show the NEW price,
history is a DB fact, never a UI "undo"). Money entry = integer pence behind a £ field with 2-dp
clamp (R05: no floats anywhere; formatter round-trips `3500 ⇄ £35`).

```text
┌──────────────────────────────┐
│ ←  Laser Hair Removal        │  getCatalogueForStaff row →
│ LASER · in directory ✓       │  show_* flags as chips (read
│ ──────────────────────────── │  only here; toggling flags =
│ Price from                   │  Q09 scope — listed not built)
│ [ £ 35    ]  per session     │  Field: numeric, £ prefix
│ model (◉ From  ○ Per session │  pricing_model enum radios;
│        ○ On consultation ○Free│  PRICE_ON_CONSULTATION forces
│ ┌──────────────────────────┐ │  price field to disabled+NULL
│ │ History (append-only)     │ │  treatment_price_history:
│ │ £35 ← £30 · 12 Sep · Sam │ │  old, new, date, actor —
│ │ £30 ← £28 · 4 Jun · Owner│ │  exactly the rows the RLS
│ └──────────────────────────┘ │  guard makes immutable
│ [ Save price ]  [ Cancel ]   │
│ ⓘ “From £35 per session” is  │  P9 label preview — the client
│   how clients will see it    │  string is DERIVED, never typed
│ (coherence check: model vs    │  treatments_price_model_
│  value is enforced by the DB— │  coherent constraint — save
│  an impossible combo errors   │  surfaces the constraint name
│  with a friendly line, §8)    │  in mapped copy, verbatim-ish
└──────────────────────────────┘
```

**States** — **Loading:** fields skeleton; **offline:** §5 (a price that didn't save must not look
saved — this screen's whole job is truth). **Validation:** negative/blank → inline; £→pence
conversion losslessness tested (3500.00 vs 35.004 — reject 3-dp with "prices are in whole pence").
**Edge — featured treatment to NULL price:** DB `treatments_featured_priced` rejects → friendly:
"Featured cards need a From price — unpublish featured first (owner Q09)." (constraint mapped, not
dodged). **Edge — concurrent edits:** last-write-wins rows in history; UI refetch shows both
history lines ("…· Lena at 16:02") and warns if the loaded value changed under you
("Sam just changed £35→£36 — reload"). **Edge — long description edit:** NOT in M1 (copy edits =
client-approved text; Q09 open; only price/hours surfaces built — stated, not silently expanded).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
