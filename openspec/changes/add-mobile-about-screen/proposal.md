## Why

The React Native app has no About destination, so students cannot reach the useful
privacy, contact, version, or developer information that exists in the legacy Flutter
app. Phase 07 now needs that content in a concise, platform-idiomatic Settings surface
without reviving Flutter-only debug, suggestions, or an unimplemented Changelog route.

## What Changes

- Add a localized `/about` screen with a short two-paragraph product blurb and native
  grouped rows for the privacy policy, email contact, installed version/build, and the
  two developer websites.
- Open HTTP(S) destinations in the app's browser surface and email through the platform
  mail URL handler; keep row definitions data-driven for the later Changelog addition.
- Read installed version/build metadata through the SDK-compatible `expo-application`
  module, represent unavailable native values truthfully, and set the Expo app version
  to `4.0.0`.
- Add About to a new explicit third section of the Settings hub and register a working,
  deep-linkable root Stack route with accessible, localized navigation.
- Add component, route-structure, localization, and Maestro proofs, plus the required
  Architecture Book, Phase 07 roadmap, and non-blocking device-pass documentation.
- Deliberately omit Suggestions, the hidden Debug gesture, OTA identifiers, and the
  Changelog row until their own work is implemented.

## Capabilities

### New Capabilities

- `mobile-about-screen`: Localized About content, native metadata presentation,
  accessible grouped rows, and outbound privacy/contact/developer actions.

### Modified Capabilities

- `mobile-settings-hub`: Add a live About destination under an explicit third Settings
  section and extend its automated/device proof obligations accordingly.

## Impact

- Mobile feature/navigation/UI: `mobile/src/features/about/`, the thin
  `mobile/src/app/about.tsx` route, root Stack registration, Settings hub row data, and
  the existing Settings section/row grammar.
- Native/runtime dependencies: `expo-application` in `mobile/package.json` and
  `mobile/package-lock.json`; `mobile/app.config.ts` changes the app version and
  therefore changes the Expo runtime fingerprint and requires a fresh native build.
- Localization/tests: typed EN/FR catalogs, About and Settings RNTL suites, the Settings
  route-structure proof, and a stable Maestro About flow. No `run-e2e` label is added;
  native E2E runs from `main` on simulator-capable CI.
- Documentation: Architecture Book feature ownership/navigation current state, Phase 07
  shipped marker with the PR number, and a migration inbox note for light/dark,
  VoiceOver/TalkBack, large-text, and both-platform device checks. No ADR is warranted
  for the reversible feature placement, and the retired Architecture Book chronology
  file is not recreated.
- Sensitive surfaces: `mobile/app.config.ts` (native/store configuration; human merge
  required), native dependency manifests/lockfile, and binding Architecture Book docs.
  Legacy `app/` is read-only reference. No OpenAPI/generated client, server migration,
  Firebase config, infrastructure, workflow, or secret changes are expected.
