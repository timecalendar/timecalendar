# EAS Build / Submit / Update configured; dogfooding via an internal channel

## Why

`mobile/` has no release path: there is no `eas.json`, no `expo-updates` wiring, no
build profiles, and no way to put the app on a real device for dogfooding. Foundation
roadmap step 11 (and the Phase 0 exit criterion *"App builds and ships to a real device
via EAS internal channel"*) needs the **distribution skeleton** in place — aligned to the
existing `APP_VARIANT` dev/prod identity (the RN app ships as an *update* to the Flutter
store app, so `fr.samuelprak.timecalendar` must be preserved) and to the per-environment
Firebase projects. This change lands every piece of config that needs **no secrets**;
the credential-bearing, console, and real-device steps are irreducibly human and are
handed off to the inbox.

## What Changes

- **`mobile/eas.json`** with three build profiles keyed to the existing variants:
  - `development` — `developmentClient: true`, `distribution: internal`, dev-variant
    identity (`APP_VARIANT=development`), iOS simulator + Android APK so a dev build is
    installable without store flow.
  - `preview` — the **internal dogfooding** profile: `distribution: internal`,
    **production identity** (real `fr.samuelprak.timecalendar`), release config, iOS
    device `.ipa` + Android `.apk`, `channel: "preview"`. This is the build a human shares
    via the Expo internal-distribution URL / TestFlight internal / Play internal testing.
  - `production` — `distribution: store`, store artifacts (iOS `.ipa` + Android
    `.aab` app-bundle), `channel: "production"`, `autoIncrement`.
- **`submit` profiles skeleton** in `eas.json` for iOS (App Store Connect: `appleId`,
  `ascAppId`, `appleTeamId` referenced via env, not committed) and Android (Play
  service-account key path) — structure only; the credentials themselves are human-supplied.
- **`expo-updates` wired**: add the `expo-updates` dependency + `runtimeVersion`
  (`{ "policy": "fingerprint" }`) and the `updates.url` / `extra.eas.projectId` *seam* in
  `app.config.ts`. The actual `projectId` / `updates.url` are filled by `eas init` (a human
  step — no project exists yet); the config reads them from env/placeholder so `tsc` and
  `expo config` stay green until then.
- **Channel ↔ profile mapping** documented and encoded: `preview` channel for dogfood,
  `production` channel for store. `eas update --channel <name>` pushes JS-only OTA updates
  to installed builds on the matching channel.
- **CI is deliberately untouched.** The native E2E builds still go through
  `expo prebuild` + native tooling locally/in-CI (Architecture Book "E2E — Maestro"), *not*
  EAS. EAS Build/Submit/Update stay **human-invoked** (`eas build` / `eas submit` /
  `eas update`) this step — no `.eas/workflows/` is added (deferred, recorded as debt). This
  keeps the step minimal: configure so a human *can* dogfood, don't wire a second build path.
- **Architecture Book** gains an "EAS / distribution" section; roadmap step 11's
  config-half is marked, with the human-half pointing at the inbox.

## Capabilities

### New Capabilities

- `mobile-distribution`: the mobile app's build + over-the-air release contract — the three
  EAS build profiles and how they map to the `APP_VARIANT` dev/prod identity and the
  per-environment Firebase projects; the internal-distribution dogfood profile; the submit
  skeleton; the `expo-updates` runtime-version policy and channel↔profile mapping; the
  decision to keep EAS human-invoked (CI untouched); and which parts are config (landed
  here) versus irreducibly human (credentials, `eas init`, real-device install, store
  internal-testing setup — handed to the inbox).

### Modified Capabilities

<!-- none. mobile-firebase already owns the per-environment project mapping; this change
consumes it (each EAS profile must carry the right APP_VARIANT so the right
googleServicesFile is bundled) but changes none of its requirements. The Architecture Book
gains a section — normal book evolution, not a requirement change. -->

## Impact

- `mobile/`: new `eas.json`; `app.config.ts` gains the `expo-updates` plugin entry,
  `runtimeVersion` policy, and the `updates.url` / `extra.eas.projectId` seam; new
  `expo-updates` dependency (lockfile updated); `mobile/EAS.md` (or section in a README)
  documenting profiles ↔ channels ↔ variants and the human prerequisites.
- **Human prerequisites (cannot be automated — see
  `docs/react-native-migration/inbox/2026-06-13-eas-credentials.md`):** `eas login` +
  `eas init` (creates the EAS project and the real `projectId`/`updates.url`); Apple
  Developer signing credentials + push; Google Play service-account JSON; the actual
  `eas build`/`eas submit` runs; real-device install; TestFlight internal + Play internal
  testing channel setup. `tsc`/lint/Jest do **not** read EAS credentials or a real
  `projectId`, so CI `test-mobile` is unaffected by these being absent.
- `.claude/rules/mobile/architecture.md`: "EAS / distribution" section added.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 11 config-half noted; the
  device-install / internal-channel half flagged as human (inbox).
- **No CI proof test** — this change is build/release *configuration*, not runtime app
  behavior; there is nothing for Jest to assert beyond `expo config` parsing, which the
  existing `tsc`/lint gates and the manual `expo config --json` sanity check already cover.
- No server/web/`app/` code touched. Native projects are CNG/gitignored; the
  `expo-updates` config flows through `app.config.ts` and regenerates on the next prebuild.
