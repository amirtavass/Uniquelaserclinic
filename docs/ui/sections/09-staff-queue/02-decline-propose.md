# 09-staff-queue / 02 — Decline & Propose Alternative (S12 · R02 · DA-07)

Both are `decideBooking` variants — DECLINED requires a reason (shown to client verbatim on
`04-book/02`, so tone matters; helper copy nudges without scripting); RESCHEDULED = "alternative
proposed" — no client self-accept (R02: the call is the handshake).

```text
┌── Decline sheet ─────────────┐ ┌── Propose sheet ─────────────┐
│ Decline — Tom H. (Advise me) │ │ Propose — Lena K. · resched. │
│ Reason (shown to Tom):       │ │ Current: Fri 7 Nov · 11:00   │
│ ┌──────────────────────────┐ │ │ Suggest instead:             │
│ │ “All appointments for    │ │ │ [ date ]  [ time ]           │
│ │  that week are full —     │ │ │ [ alt 2 ]  [ alt 3 ] (+)     │
│ │  shall I hold Tue?”       │ │ │ Note (optional):             │
│ └──────────────────────────┘ │ │ [ “or I can call Thursday” ]  │
│ tone helper: plain, warm,     │ │ [ Send proposal ]            │
│ no-blame; no invented policy  │ │  → status RESCHEDULED +      │
│ [ Decline ] [ Cancel ]        │ │    client row “Alternative   │
│ dangerText, ConfirmSheet C19  │ │    proposed — staff will     │
└──────────────────────────────┘ │    call you.” (04/02 mirror)  │
                                  └──────────────────────────────┘
```

**States**
- **Empty reason on Decline:** inline required — "Clients see this exact wording." (one nudge, no
  template library invented).
- **Offline/error:** §5; a decline is a write — hard fail, no stale swipe.
- **Edge — decline an ADVISE_ME:** normal path (the advice IS the consultation — helper suggests
  offering a consult first; staff decides, nothing forced). **Edge — long reason:** wraps to 500
  with counter; client side shows full text (no truncate — verbatim rule). **Edge — double
  decide:** concurrent guard from `00` applies (handled-by toast).

- **Signed-out / wrong-role access:** blocked by the shell guard (../02-navigation-and-ia.md §4) —
  the friendly “You don’t have access” card; no admin chrome or data renders behind it, and a
  session that dies mid-screen lands there (R07 posture; RLS rejects the write anyway).
