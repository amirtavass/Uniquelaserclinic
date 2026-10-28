# 10-staff-dialler / 01 — Client Detail (staff view) (F3 · S18 · R04)

**Seam:** `staffClientDetail(userId)` ADD(M1) — profile + requests + appointments (+ chain hints).
Every open = audited `directory_view`/detail read pattern; no notes field invented, no health
column exists to show (R04).

```text
┌──────────────────────────────┐
│ ←  Priya Sharma        [☎]   │
│ ✓ 07911 555012 · since 22 Oct│  verified chip (DA-12)
│ ──────────────────────────── │
│ NEXT                          │
│ Consultation Thu 6 · 2:30 pm  │  upcoming (SCHEDULED)
│ Patch test   Fri 7 · 11 am    │  chain-aware order (R03)
│ Session      Tue 25 · 3 pm    │
│   ①──✓────②────●──③  stepper  │  C5 read-only for staff
│ ──────────────────────────── │
│ PAST                          │
│ ✓ Consultation 22 Oct         │  COMPLETED
│ ✕ Did not attend   14 Oct     │  NO_SHOW — factual chip
│ ⚠ number was unverified until│  audit-visible history line
│   23 Oct (staff note)         │  (from event log, not opinions)
│ ──────────────────────────── │
│ OPEN ITEMS                    │
│ 1 reschedule request          │  → 11/02 resolve
│ 1 enquiry unanswered · [▸]    │  → 12/00 thread (cross-tab)
│ ──────────────────────────── │
│ [ Book nothing here — use the │  honesty: intake stays in the
│   queue ]                     │   queue/diary, single path (no
└──────────────────────────────┘  second write surface to drift)
```

**States** — **Empty new client:** blocks collapse to "First contact — nothing booked yet"; no
ghost chrome. **Offline/error:** §5. **Edge — deletion pending (queue 14/01):** top warn banner
"Deletion requested — do not contact?" **NO** — copy: "A deletion request is pending for this
account." (fact only; owner handles; staff see, no action invented). **Edge — long names/dupes:**
disambiguate row with phone + since-date; **Edge — same-client phone raw/e164 variants:** detail
shows stored raw + normalised, labelled (DA-12 discipline).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
