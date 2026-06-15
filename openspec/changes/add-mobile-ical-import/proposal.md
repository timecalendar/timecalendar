## Why

Phase 03 ("Onboarding & calendar sources", roadmap ship 4 of 5) needs the **second**
input method for adding a calendar: pasting an **iCal URL**. Ship 3 added the camera
(QR) surface and established `src/features/calendar-sources/` (ADR 017, which already
decided ship 4 grows this folder in place — QR and iCal are two inputs feeding the same
"add a calendar source" concern). This ship reaches parity with the Flutter `import_ical`
module: the user enters a URL, the app **POSTs it to the server** (`POST /calendars`,
`CreateCalendarDto { url }`), and the server returns a `{ token }` — the same primitive
ship 5 will make durable. URL-only (matching Flutter); file-pick is deferred.

## What Changes

- **Grow `src/features/calendar-sources/` in place** (ADR 017 D3 — sublayers, not a new
  folder): add a `data/create.ts` create-calendar layer (the **only** generated-hook
  import site for this feature, B-1) wrapping the generated
  `useCalendarSyncControllerCreateCalendar` mutation over the single `customFetch`
  mutator, returning `{ token }` from `POST /calendars { url }`; and a pure tested
  **URL validator** (`data/validate-url.ts`) returning a **localizable error key** (not a
  sentence), mirroring `personal-events/form/validate.ts`.
- **Reuse the ship-3 domain shape and ephemeral holder.** The URL the user types is
  parsed/validated into the same `ScannedCalendarSource` (`{ url }`) and, on a successful
  server create, the resulting token is the artifact ship 5 persists. The screen feeds the
  **same ephemeral in-memory holder** ship 3 built (`data/scanned-source.ts`) so QR and
  URL converge on one handoff that ship 5 swaps for durable storage. (No new domain type;
  the create layer is the new seam.)
- **A URL-entry screen** at `src/features/calendar-sources/ui/ical-url-screen.tsx`
  (presentational, 70% floor): a labeled `TextInput` for the URL, a submit control, and
  accessible **loading / error-with-retry** states over the create mutation (mirroring
  school-selection's read flow per `data.md`). On success it stashes the source+token into
  the ephemeral holder and dismisses; an invalid URL shows the validator's translated error
  inline (recoverable, no `recordError`); a **failed server create** records through the
  `@/firebase` `recordError` seam (this feature can fail — network / invalid URL / server
  error — like personal-events writes).
- **Reachable from onboarding**: a thin route `src/app/onboarding/ical-url.tsx` (re-export
  through the `ui/` sub-barrel) as a `Stack` sibling, plus an "add by URL" CTA on the
  welcome screen — reusing the accent-border CTA pattern ship 3 established next to the
  "scan a QR code" CTA.
- **FR + EN i18n keys** for every user-facing string (URL field label/placeholder, submit,
  validation error keys, loading, server-error + retry).
- **A Jest/component proof** of the validate → create → handoff wiring: mock at the
  `customFetch` mutator seam (never the network — `testing.md`), drive the real generated
  mutation + a real `QueryClient`, assert localized text, the valid-submit → token →
  ephemeral-holder path, the invalid-URL inline-error path (no `recordError`), and the
  server-failure → `recordError` path (mocked `@/firebase`).
- **Architecture Book updates**: `features.md` (the calendar-sources iCal-import sublayer),
  `data.md` (the create-calendar mutation as a new generated-hook consumer behind the
  `data/` seam), `architecture-changelog.md`. **No new ADR** — this is growth within ADR
  017 D3 + the existing `data/` + form-validator patterns.

## Capabilities

### New Capabilities
- `mobile-ical-import`: adding a calendar by iCal URL — the pure URL validator returning a
  localizable key, the `data/` create-calendar layer over `POST /calendars` via the
  generated hook + `customFetch`, the URL-entry screen with accessible loading/error/retry,
  the reuse of ship 3's `ScannedCalendarSource` + ephemeral holder, the onboarding
  reachability, and the create-failure observability path.

### Modified Capabilities
<!-- None. The QR-scan spec's requirements are unchanged; this ship adds a sibling input
     surface and a new data sublayer to the same feature folder. The ephemeral holder it
     reuses keeps its ship-3 contract (still ephemeral until ship 5). -->

## Impact

- **Dependencies:** none new. The `POST /calendars` endpoint already exists in the
  committed generated client (`src/api/generated/calendars/calendars.ts` —
  `useCalendarSyncControllerCreateCalendar`, `CreateCalendarDto`, `CreateCalendarRepDto`);
  no OpenAPI regen, no native dep, no `app.config.ts`/babel change. **URL-only** — no
  `expo-document-picker` (file-pick deferred; the Flutter `import_ical` module has no file
  path).
- **New code:** `src/features/calendar-sources/data/{create.ts,validate-url.ts}` (+ their
  tests) re-exported from the existing `data/` sub-barrel; the feature barrel re-exports the
  screen; `src/features/calendar-sources/ui/ical-url-screen.tsx` (+ test);
  `src/app/onboarding/ical-url.tsx` (thin route); a welcome-screen CTA.
- **i18n:** new flat keys in `en.json` + `fr.json` (tsc-typed parity, both directions).
- **Tests:** new colocated Jest tests (validator at 90% logic; the create layer's wiring
  proven through the mutation; the screen at the 70% floor). The create round-trip is
  **not** Maestro-driven (the dev e2e harness seeds no parseable `.ics` import endpoint and
  a live external `.ics` would be flaky cross-platform — same posture as ship 3's camera);
  the URL-entry render + inline validation is deterministic and gets a light Maestro step,
  the actual import is an inbox/DoD on-device check.
- **Docs:** `features.md`, `data.md`, `architecture-changelog.md`. One inbox note
  (on-device iCal import round-trip + a11y/observability DoD pass). **No ADR** (growth
  within ADR 017).
