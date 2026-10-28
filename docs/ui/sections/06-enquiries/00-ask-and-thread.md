# 06-enquiries / 00 — Ask & Thread (C5 · S09 · S13 mirror · R06)

Private question → staff answer, visible to this client only (RLS, R07). Thread is **append-only**
(`enquiry_messages` guard) — no edits, no deletes; the UI has no such verbs either.
**Seams:** `createEnquiry()` EXISTS (first message in one call) · `myEnquiries()`,
`enquiryThread(id)`, `replyEnquiry(id,body)` **ADD(M1)**. `treatment_context_id` carries the detail
screen's "Ask about this treatment" context (seeded from `03/01`).

```text
┌── compose (new.tsx) ─────────┐ ┌── thread ([id].tsx) ──────────┐
│ ←  Ask the clinic            │ │ ←  About: Laser Hair Removal │
│ [About: Laser Hair Removal ✕]│ │ ● Open      [🔔 generic R06]  │
│ ┌──────────────────────────┐ │ │ ┌──────────────────────────┐ │
│ │ Do I need to stop        │ │ │ │ You · Tue 10:12          │ │  CLIENT bubble
│ │ shaving before the       │ │ │ │ “Do I need to stop…”     │ │  (pearl, right)
│ │ patch test?              │ │ │ └──────────────────────────┘ │
│ └──────────────────────────┘ │ │ ┌──────────────────────────┐ │
│ ⓘ Please don’t include       │ │ │ The clinic · Tue 15:40   │ │  STAFF bubble
│   medical details — we       │ │ │ “Shave the area the       │ │  (plumDeep, left,
│   discuss anything health-   │ │ │  morning of your patch    │ │   pearl text)
│   related at your free       │ │ │  test.”                   │ │
│   consultation.  (DA-10)     │ │ └──────────────────────────┘ │
│ [          Send        ]     │ │ ┌──────────────────────────┐ │
│  Draft kept on-device if     │ │ │ You · typing… [ field ]  │ │  reply dock,
│  the network drops (§6)      │ │ └──────────────────────────┘ │  keyboard-aware
└──────────────────────────────┘ └──────────────────────────────┘
```

Status badge (P7): `OPEN` "Awaiting reply" · `ANSWERED` "Answered" · `CLOSED` "Closed — ask again"
(re-open creates a new thread row? NO — schema keeps one `enquiries` row; client reply flips
`OPEN` via trigger `flip_enquiry_answered` — UI just says: reply again.)

**States**
- **Signed-out:** compose opens from anywhere but Send → `AuthGateSheet` (S09 requires sign-in;
  draft survives; this is the "inline enquiry teaser (requires sign-in)" of U4).
- **Null — no enquiries yet:** inbox row list empty: "No conversations yet. [ Ask a question ]" +
  "Can’t wait to call? 07301 166333" (W05 — real fallback, not invented chat promise).
- **Loading:** thread `ListSkeleton(3)` bubbles; send = bubble shows "Sending…" locally then
  replaces with server row (append-only id).
- **Offline:** compose keeps draft (§6 pending banner); existing thread renders from last fetch
  *read-only with banner* (a conversation is not actionable-stale in the dangerous way; noted
  deviation from appointments posture, with "may be missing replies" line).
- **Error:** create fail → §5 + retry; 500-char cap counter; empty message disabled Send.
- **Edge — long thread (40 messages):** virtualise; role labels repeat per bubble (screen readers).
- **Edge — staff closes thread (closed_by):** banner row "The clinic closed this conversation —
  send a new question" + compose shortcut. **Edge — R06:** the push when ANSWERED is
  *generic* only; the app never composes "Answer about Laser Hair Removal" into a notification
  (DB tripwire would reject it anyway).
