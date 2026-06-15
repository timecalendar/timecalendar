# iCal URL import — on-device DoD manual pass

## What I need

A manual on-device verification of the iCal-URL import flow (Phase 03 ship 4,
`add-mobile-ical-import`) on **both iOS and Android** (dev variant), covering the axes CI
cannot assert:

1. **The real import round-trip.** From the onboarding welcome screen, tap "add by URL",
   paste a **real, reachable `.ics` URL** (e.g. a school iCal or a known public calendar
   feed), submit, and confirm the server `POST /calendars` succeeds and a token comes back
   (the screen confirms the imported URL and dismisses).
2. **The server-failure + retry path.** Submit a syntactically-valid-but-unimportable URL
   (e.g. a `https://` URL that 404s or isn't a calendar) and confirm an accessible error
   state with a working **Retry** appears, and that the failure lands in **Crashlytics**
   (`recordError` context `calendar-sources/ical-import`) — the manual half CI can't assert.
3. **The inline validation path.** Submit empty / a non-URL value and confirm the translated
   inline error shows and no network call / no recorded error occurs.
4. **Accessibility (VoiceOver + TalkBack).** The URL `TextInput` label is announced; the
   importing/error/inline-error live regions announce; the submit + retry + CTA controls have
   meaningful labels and ≥44pt/48dp targets; focus order is sane.
5. **Native correctness (R-3).** The URL keyboard, paste affordance, and the screen read as
   the platform's own (not a Flutter port) on each OS; FR + EN both render.

## Why

- The dev e2e harness (`ci/e2e-server.sh`) **seeds no parseable `.ics` import endpoint**, and
  a live external `.ics` would be flaky cross-platform — so the import round-trip cannot be
  Maestro-driven (same posture as ship 3's camera). CI proves the validate→create→handoff
  **wiring** by mocking the `customFetch` mutator; the *real* server round-trip, the
  Crashlytics arrival, the screen-reader passes, and the platform-correctness review are
  irreducibly on-device.
- The deterministic part (URL-entry screen renders, reachable from onboarding, empty-submit
  shows the inline error — no network) MAY be added as a Maestro step; the import itself is
  here.

## How to verify

- Build + install the **dev-variant** app on an iOS simulator/device and an Android
  emulator/device (`mobile/e2e/run_e2e.sh` builds nothing — install a release-config dev
  build first; or `npm run ios` / `npm run android`).
- Deep-link `timecalendar-dev://onboarding`, tap "add by URL", and run the five checks above
  on both platforms.
- Confirm the forced-failure import appears in the **Crashlytics** dashboard (dev Firebase
  project `timecalendar-dev`) as a non-fatal `recordError` with the
  `calendar-sources/ical-import` breadcrumb.

## Blocks

- The **E2E**, **Accessibility** (screen-reader), **Native correctness**, and **Observability
  (Crashlytics arrival)** DoD axes of `add-mobile-ical-import` (tasks 9.x). Skip-and-continue
  — CI (tsc + lint + Jest at the mutator seam) is green without this; this clears the
  on-device axes for the DoD sign-off. Nothing else is blocked.
