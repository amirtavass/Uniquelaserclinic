# 13-staff-catalogue / 01 — Opening Hours & Overrides (F5 · S17 · DA-13)

💆 Care tab block 4. Read via `getOpeningStatus()` EXISTS; writes `saveOpeningHours(rows)` +
`saveHoursOverride(day,isOpen,reason)` ADD(M1). Versioning law: **never edit a historic row** — a
change appends a new `valid_from` version (kickoff: mutable records = current snapshot + append
history; the `unique(clinic,weekday,valid_from)` index makes it real).

```text
┌──────────────────────────────┐
│ ←  Opening hours             │
│ CURRENT · from 1 Jan 2026    │  effective version banner
│ Mon  10:00 – 18:00          │  every weekday = one row
│ Tue  10:00 – 18:00          │  (7 rows seeded, DA-13 —
│ …  Sun  10:00 – 18:00       │  matches “OPEN EVERY DAY
│ ──────────────────────────── │  10AM–6PM” W01)
│ [ Change these hours ]        │ → edits become a NEW valid_from
│   ⓘ “saves as a new version  │   version; old rows immutable;
│     from the date you pick”   │   confirm sheet shows both
│ ──────────────────────────── │
│ SINGLE DAYS (overrides)       │  holiday/one-off, not weekly
│ 25 Dec 2026 · Closed          │  override row (reason from
│   “Christmas Day” [✎][×]      │  staff text — free field,
│ 1 Jan 2027 · 12:00 – 17:00    │  verbatim, no template set)
│ [ + Add a day ]               │
│   date [__] (◉ closed ○ hours)│
│   reason [ optional……… ]      │
│ Preview: “What clients see    │  C4 OpenClosedBanner rendered
│   tomorrow: ● Open 10–6”      │  live from the same seam —
└──────────────────────────────┘  staff tests reality here
```

**States** — **Loading:** rows skeleton, preview hidden until computed. **Offline:** §5 — hours
drive the client "Open now" promise; a half-saved hour is the worst kind of stale (W01 trust).
**Validation:** closes-after-opens (DB check? none exists — UI enforces `closes > opens` inline
"Closing time is after opening" and flags the missing CHECK as a schema note for the register, NOT
silently fixed); past `valid_from` dates warn ("this back-dates the record — the client preview
uses the newest anyway").
**Edge — override on an all-closed version day:** both render (version row says open, override wins
— preview demonstrates). **Edge — many overrides:** list scrolls, year group headers. **Edge —
reason left blank:** chip shows just the date (no invented "Closed — reason unknown"). **Edge —
concurrent save:** newest `valid_from` wins; UI reloads and names the actor from audit (mapped
cross-cutting §8 pattern).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
