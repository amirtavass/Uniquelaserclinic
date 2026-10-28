# 07-updates / 00 — Clinic Updates Feed & Read State (C6 · S08 · DA-09 R06)

Announcements only (scope pending Q06 — drafted narrowly per S08). Client sees `PUBLISHED` rows —
`DRAFT` invisibility is an RLS truth, not a UI filter (`verify:rls` proved isolation; UI simply
never offers a drafts view). **Seams:** `getPublishedUpdates()` EXISTS · `markUpdateRead()` EXISTS.

```text
┌──────────────────────────────┐
│ ←  Clinic updates      (2 ●) │  unread count from dashboard
│ ┌──────────────────────────┐ │
│ │ ● Opening hours note     │ │  unread = left rail dot,
│ │   We’re open every day…  │ │  tap → detail + auto
│ │   3 days ago             │ │  markUpdateRead (idempotent
│ ├──────────────────────────┤ │  upsert, unique (update,user))
│ │ ● Summer pigmentation    │ │
│ │   tips from our team…    │ │
│ │   5 days ago             │ │
│ ├──────────────────────────┤ │
│ │   Client story: Sarah M… │ │  testimonials as updates ONLY
│ │   2 weeks ago            │ │  where seeded (W07, three
│ └──────────────────────────┘ │  verified names — no more)
└──────────────────────────────┘
```

**States**
- **Signed-out (guest):** feed *is public content* → browsable via guest-home FAQs rail/consult
  sheet footer; read-state rows hidden (anon can't mark read — silent skip, no gate nag).
- **Null:** "No updates right now — news lands here first." (never a spinner graveyard).
- **Loading:** `ListSkeleton(3)`; **offline:** public content → cached render + §4 banner, and the
  *mark-read* write queues safely? NO — simple rule: read-marking retries on next open; a missed
  dot is cosmetic, never worth dialog chrome (documented decision, honest).
- **Error:** cold + offline → §5 card.
- **Edge — very long body:** detail screen wraps fully, "Read more" at 8 lines on cards.
- **Edge — unpublished while open:** detail refetch → "This update is no longer available" card
  (S14 unpublish, RLS returns null — never a white screen or crash).
- **Edge — all-read:** unread count disappears (rule P7: no zero badges).
