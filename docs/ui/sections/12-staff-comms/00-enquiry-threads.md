# 12-staff-comms / 00 — Enquiry Threads (staff side) (F4 · S13)

💆 Care tab block 1. `staffEnquiries(status?)` + `staffEnquiryThread(id)` + `staffReplyEnquiry`
ADD(M1) (append message; trigger flips `ANSWERED`; RLS staff-insert + all-thread read).

```text
┌── Care hub ──────────────────┐ ┌── thread ────────────────────┐
│ 💆 Care                [⋯]   │ │ ←  Priya · “About Laser Hair │
│ ENQUIRIES                    │ │    Removal” · ● OPEN         │
│ ● 2 open · 1 answered today  │ │ ┌──────────────────────────┐ │
│ ┌──────────────────────────┐ │ │ │ You · Tue 10:12          │ │  client
│ │ ● Priya S. · 10:12       │ │ │ │ “Do I need to stop…”     │ │  bubble
│ │   “Do I need to stop…?”  │ │ │ └──────────────────────────┘ │
│ ├──────────────────────────┤ │ │ ┌──────────────────────────┐ │
│ │ ○ Tom H. · ANSWERED      │ │ │ │ Clinic · 15:40           │ │  staff
│ │   2 msgs · yesterday     │ │ │ │ “Shave the area the…”    │ │  bubble
│ └──────────────────────────┘ │ │ └──────────────────────────┘ │
│ UPDATES · PRICES · HOURS     │ │ [ Reply (staff)………       ] │
│ (blocks below / in nav rows) │ │ [ Send reply ]  R06 pinned:  │
└──────────────────────────────┘ │  push stays generic — client  │
                                  │  sees a bell, not this text.  │
                                  └──────────────────────────────┘
```

**States** — **Empty:** "No enquiries yet — they arrive when clients tap Ask." (S09 mirror).
**Loading:** `ListSkeleton(2)`; Send disabled in-flight. **Offline:** §5 hard — staff must not
double-answer what a colleague sent (freshness = data-integrity, R07).
**Concurrency:** if the client replied while staff typed, new bubbles appear above the composer with
a "1 new reply" nudge (append-only thread makes this safe).
**Error:** §5; 500-char cap counter on reply.
**Edge — long thread:** virtualised with date gutters. **Edge — closed by colleague:** status chip
only; NO edit affordance anywhere (append-only law — `enquiry_messages` guard). **Edge —
medical-sounding question:** answerable in human words; the UI offers NO clinical template library
(R04 discipline — templates = health advice authored by developers; named anti-pattern). **Edge —
unverified phone client (DA-12):** context header shows the ⚠ unverified chip from `10/01`.

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
