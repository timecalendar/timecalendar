# mobile-app-scaffold Specification

## Purpose
Defines the `mobile/` React Native (Expo) app scaffold — the walking skeleton of
the Flutter→RN migration: its runtime baseline (Expo SDK, New Architecture,
Hermes, dev-client), standalone npm-project placement, TypeScript strictness,
CNG-managed native projects, `APP_VARIANT` app identity, minimum OS floors, and
launchability on both platforms. See the Architecture Book at
`.claude/rules/mobile/` for the living rules these requirements seeded.

## Requirements

### Requirement: Mobile app is a standalone npm project
The repository SHALL contain an Expo app at `mobile/` as a standalone npm project with its own `package-lock.json`, NOT listed in the root `package.json` `workspaces` (mirroring `server/`), so its dependency tree is fully isolated from web's.

#### Scenario: Fresh install resolves in isolation
- **WHEN** a developer runs `npm install` in `mobile/`
- **THEN** `mobile`'s dependencies are installed without errors and `npx expo-doctor` run in `mobile/` reports no failures

#### Scenario: Root workspace is unaffected
- **WHEN** the root `package.json` is inspected
- **THEN** `mobile` is not listed in `workspaces` and the root lockfile contains no mobile dependencies

### Requirement: Runtime baseline is the latest stable Expo SDK with New Architecture, Hermes, and expo-dev-client
The mobile app SHALL be pinned to Expo SDK 56 (React Native 0.85) with the New Architecture and Hermes enabled, and SHALL include `expo-dev-client` so local builds are development-client builds rather than Expo Go.

#### Scenario: SDK and architecture verified
- **WHEN** the installed `expo` package version and the generated native projects are inspected
- **THEN** the Expo SDK major version is 56, the New Architecture is enabled, the JS engine is Hermes, and `expo-dev-client` is a dependency

### Requirement: TypeScript strict mode is enforced
The mobile app's TypeScript configuration SHALL enable `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`, and the codebase SHALL type-check cleanly.

#### Scenario: Clean type-check under strict flags
- **WHEN** `npx tsc --noEmit` is run in `mobile/`
- **THEN** it exits with zero errors

### Requirement: Native projects are managed by Continuous Native Generation
The `mobile/android/` and `mobile/ios/` directories SHALL be gitignored and SHALL be reproducible from the app config via `npx expo prebuild`.

#### Scenario: Native directories are regenerable, not tracked
- **WHEN** `npx expo prebuild --clean` is run in `mobile/`
- **THEN** the native projects are regenerated successfully and `git status` shows no tracked changes under `mobile/android/` or `mobile/ios/`

### Requirement: App identity follows the APP_VARIANT pattern with the existing store identity
The app config SHALL be dynamic (`app.config.ts`) and derive identity from `APP_VARIANT`: the production identity SHALL be `fr.samuelprak.timecalendar` (iOS bundle identifier and Android package), and the development variant SHALL be `fr.samuelprak.timecalendar.dev` with a visibly distinct app name, so development builds can coexist with the installed Flutter app.

#### Scenario: Development variant
- **WHEN** the app config is resolved with `APP_VARIANT=development`
- **THEN** the iOS bundle identifier and Android package are `fr.samuelprak.timecalendar.dev` and the app name marks the build as a development variant

#### Scenario: Production identity by default
- **WHEN** the app config is resolved without `APP_VARIANT` (or with `APP_VARIANT=production`)
- **THEN** the iOS bundle identifier and Android package are `fr.samuelprak.timecalendar` and the app name is "TimeCalendar"

### Requirement: Minimum OS floors match K-2
The app SHALL configure `expo-build-properties` with an iOS deployment target of 15.1 and Android `minSdkVersion` 24. If the chosen SDK's own minimums exceed these values, the SDK minimums SHALL prevail and the resulting effective floors SHALL be recorded in the Architecture Book.

#### Scenario: Floors present in resolved native config
- **WHEN** the native projects are generated via prebuild
- **THEN** the iOS deployment target is at least 15.1 and the Android `minSdkVersion` is at least 24, each being the greater of the K-2 floor and the SDK's own minimum

### Requirement: The default app launches on both platforms
The scaffolded app SHALL build and launch its default screen as a development-client build on an iOS simulator and on an Android emulator.

#### Scenario: iOS launch
- **WHEN** a developer runs the app's iOS launch script (development variant) on an iOS simulator
- **THEN** the build succeeds and the default screen renders

#### Scenario: Android launch
- **WHEN** a developer runs the app's Android launch script (development variant) on an Android emulator
- **THEN** the build succeeds and the default screen renders
