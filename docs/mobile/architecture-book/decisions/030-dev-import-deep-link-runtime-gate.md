# 030 — Dev-only import deep link, runtime-gated on `extra.appVariant`

## Status

Accepted.

## Context

The four calendar-family Maestro E2E flows (`calendar` / `home` /
`event-checklists` / `hidden-events`) asserted only **empty / not-found** states.
The cause was a missing seam, not a missing fixture: the startup sync reads durable
tokens from the local `user_calendars` SQLite table, and on a fresh e2e launch that
table is empty, so the sync no-ops and every view is empty. The server already
seeds a token-addressable calendar under `NODE_ENV=test`
(`seed-e2e-calendar.ts`, `E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"`), returned
verbatim by `POST /calendars/sync` — but there was **no way for a Maestro flow to
make the app durably HOLD that token**, so the seeded data was never synced in. The
most important surface in the app (the calendar the product exists to show) had no
end-to-end render proof: a broken sync mapper, a dropped sync-DTO field, or an
events-source merge bug would pass every gate.

The fix must give an E2E flow a stable way to hold the token and sync it, **without**
shipping a production "add by token" feature (the Flutter app has none — R-2) and
**without** exposing a token-import attack surface in production builds.

## Decision

Add a route `src/app/dev-import.tsx` (thin re-export of `DevImportScreen` in
`calendar-sources/ui/`) reachable as `timecalendar-dev://dev-import?token=<token>`.
**Only when the runtime variant is `development`** it runs `addCalendarFromToken(token)`
(the resolve + durable `user_calendars` upsert half of `addCalendarFromUrl`, no
create-POST) → `useSyncCalendars().sync()` → `router.replace("/calendar")`. In
production it renders an inert, accessible "not available" state and imports nothing.

The gate is `Constants.expoConfig?.extra?.appVariant === "development"`, read through
a single `src/config/variant.ts` `isDevVariant()` helper, backed by a new
`extra.appVariant: IS_DEV ? "development" : "production"` field in `app.config.ts`.

**Why the runtime gate — not the scheme — is the security boundary.** The
`timecalendar-dev` *scheme* is dev-only, but the route *file* still ships in the
prod bundle (Expo Router's `require.context` bundles every `src/app/*.tsx`) and is
reachable as `timecalendar://dev-import?token=…`. Without a runtime gate, a crafted
`timecalendar://` link in a production build could import an arbitrary
attacker-supplied token onto a user's device. The gate makes the *action* inert in
production regardless of how the route is reached; a unit test asserts the
production branch performs no import.

**Alternatives to the variant read, rejected.**
- **`__DEV__`** — the e2e build is **release-config** dev-variant, so `__DEV__` is
  `false` in exactly the build we need the import to work in. It would gate the
  import OFF in e2e. Wrong tool.
- **Scheme-sniffing (`Constants.expoConfig?.scheme === "timecalendar-dev"`)** —
  works, but couples the security gate to a navigation string and reads as
  incidental (R-1: state the meaning in a named field).
- **`expo-application` bundle-id `.dev` suffix** — a second source of truth for a
  fact `app.config.ts` already computes as `IS_DEV`.
- **Build-time stripping the route from prod** — Expo Router bundles every
  `src/app/*.tsx`; conditional route exclusion is not a first-class mechanism, and
  the runtime gate is simpler and provably inert.

`extra` is embedded in the resolved manifest at build time and is the Expo-blessed
place for build-time constants the JS runtime needs — available via
`Constants.expoConfig?.extra` in both debug and release. Pure JS config: **no
fingerprint bump**, so the dev-variant e2e binary gains the route at the next
`expo prebuild` (which CI does every run).

**Cross-flow state isolation (a consequence that shapes the E2E harness).** The
import writes a **durable** token to SQLite, and `maestro test .maestro/` runs the
whole folder in one device session where `stopApp` does **not** clear app data. So
the shared `import-seed.yaml` preamble opens with `launchApp: clearState: true`
before cold-starting into the deep link — every calendar-family flow begins from a
wiped store, so one flow's imported token can't pollute a later flow's empty-state
assertions (home's empty-day, hidden/checklist empty states). The trailing
non-calendar flows deep-link their own routes and never assert calendar emptiness,
so a residual token is harmless to them.

## Consequences

- The four flows become real round-trips: import a seeded token → sync → assert real
  synced data renders and round-trips (calendar tile→details, home today-timeline,
  checklist add/toggle/delete, hide/un-hide). The calendar's E2E axis is honest.
- A new dev-only route file ships in the prod bundle, inert by the runtime gate —
  the gate, not the scheme, is the boundary, and a unit test locks the
  production-no-import behaviour.
- The E2E harness carries a `clearState`-first preamble; adding a calendar-family
  flow means `- runFlow: import-seed.yaml` first (documented in `mobile/e2e/README.md`
  and `testing.md`).
- No new dependency (`expo-constants` was already a dep), no native module, no
  EAS-fingerprint bump, no sync/persist path, and no API/DTO/OpenAPI change — only
  the seeded row content and the new JS route/seam.
- `addCalendarFromToken` is a narrow reuse of the one tested persist chain
  (`fromCalendarForPublic` → `upsert`), so no fidelity drift versus the URL/QR add.

## Revisit if

- A production add-by-token surface ever becomes a real feature (then it is a
  first-class UI + its own ADR, not this E2E hook).
- Expo Router gains a supported build-time route-exclusion mechanism (re-weigh
  stripping the route from prod entirely versus the runtime gate).
- `maestro test` gains per-flow state isolation (the `clearState`-first preamble
  could relax).
- A second runtime consumer needs the variant fact (the `isDevVariant()` helper is
  the single read site to extend, not duplicate).
