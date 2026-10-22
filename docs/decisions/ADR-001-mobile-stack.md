# ADR-001 — Mobile stack: React Native + Expo (managed, TypeScript, Expo Router)

- Status: PROPOSED — awaiting owner sign-off (Gate 1)
- Date: 2026-10-22
- Sources: M01 ("both android and ios"), kickoff brief ("Target platforms: React Native / Expo"),
  CalmAnchor lessons (Expo Go vs dev build trap), website evidence W01–W08.

## Context

One small clinic, three privileged staff, one-tenant customer app. The team's proven delivery path
(CalmAnchor) is a single React Native codebase. The app needs: auth (email + phone), a public
content catalogue, booking requests, push notifications, an admin queue, and future camera/photos
(progress images) — several of which are native capabilities.

## Decision

- **Expo (managed workflow) + React Native + TypeScript**, EAS Build for dev/preview/store
  profiles.
- **Expo Router** for file-based navigation (bottom tabs: Home, Treatments, Book, Appointments,
  Profile — validated in UI stage; leaner alternative noted in ADR discussion).
- **expo-notifications** for push (scheduled reminders, status updates).
- Secure storage (`expo-secure-store`) for session tokens; no secrets in JS bundles.
- Data access only through a single seam (`lib/db.ts`); screens never import the backend client.

## Alternatives considered

| Option | For | Against | Decision |
|---|---|---|---|
| Expo/React Native (chosen) | One codebase, team competence, mature push/auth/storage, EAS handles store builds | Dev build required (not Expo Go) once native modules land — accepted, it is needed for notifications anyway | **Accepted** |
| Flutter | Single codebase, strong UI | Team has no proven Flutter delivery; recruiting/handover cost; same native-module reality | Rejected for this project, not on quality grounds |
| Native Swift + Kotlin | Best per-platform feel | Two codebases for a one-clinic MVP; roughly double cost and surface | Rejected |
| WebView wrapper of the site | Fastest | Staff message asks for accounts, reminders, admin control — not achievable credibly in a wrapper; poor trust signal for a clinic | Rejected |

## Consequences

- Dev builds from M1 (`eas build --profile development`) — the kickoff "Expo Go vs dev build" trap
  is scheduled up front, not discovered at feature time.
- SDK pinning: check current Expo Go support at scaffold time, but plan for dev builds regardless
  (push is required for S07).
- Apple Developer + Google Play accounts are a client dependency (Q12); store review lead time for
  a health-adjacent booking app should be planned into the release phase.
