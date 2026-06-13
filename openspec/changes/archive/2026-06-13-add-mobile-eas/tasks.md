# Tasks — add-mobile-eas

> Config-only step. Everything credential-/account-/console-/device-bearing is tagged
> `(HUMAN: see inbox/2026-06-13-eas-credentials.md)` — the implementer skips those and
> continues. No CI proof test (design D8: this is build/release config, not runtime
> behavior; the EAS CLI + `expo config` are the enforcing gates, not Jest).

## 1. EAS build configuration (`mobile/eas.json`)

- [x] 1.1 Add `expo-updates` to `mobile/` (`npx expo install expo-updates`); update the lockfile.
- [x] 1.2 Create `mobile/eas.json` with `cli` block and three build profiles:
  - `development`: `developmentClient: true`, `distribution: "internal"`,
    `env: { APP_VARIANT: "development" }`, `ios.simulator: true`,
    `android.buildType: "apk"`.
  - `preview`: `distribution: "internal"`, production identity (no `APP_VARIANT`),
    `android.buildType: "apk"`, iOS device build, `channel: "preview"`.
  - `production`: `distribution: "store"`, `android.buildType: "app-bundle"`,
    `channel: "production"`, `autoIncrement: true`.
- [x] 1.3 Add the `submit` skeleton: `submit.production.ios` (`appleId`, `ascAppId`,
  `appleTeamId` via `$EXPO_..`/env, never literal) and `submit.production.android`
  (`serviceAccountKeyPath` pointing outside git) — structure only, no secret values.

## 2. expo-updates wiring (`mobile/app.config.ts`)

- [x] 2.1 Add `"expo-updates"` to the `plugins` array.
- [x] 2.2 Add `runtimeVersion: { policy: "fingerprint" }` (design D3).
- [x] 2.3 Add the `updates.url` + `extra.eas.projectId` seam: read `EAS_PROJECT_ID` from
  env (or a clearly marked placeholder) and derive `updates.url` =
  `https://u.expo.dev/<id>`; ensure `expo config --json` parses with the value absent.

## 3. Docs

- [x] 3.1 Create `mobile/EAS.md` (or a README section) documenting profiles ↔ channels ↔
  variants, the human prerequisites, and the `fingerprint` OTA-safety behavior.
- [x] 3.2 Add an "EAS / distribution" section to `.claude/rules/mobile/architecture.md`
  (profiles, channel mapping, runtime-version policy, EAS-managed signing vs Flutter
  `match`, CI-untouched decision); append an entry to
  `.claude/rules/mobile/architecture-changelog.md`.
- [x] 3.3 Add an ADR for the `fingerprint` runtime-version policy + the human-invoked-EAS
  / CI-untouched decision in `.claude/rules/mobile/decisions/` (design D3, D4 are
  load-bearing). — ADR 006 (`006-eas-distribution.md`), indexed in `decisions/README.md`.
- [x] 3.4 Mark step 11's config-half in
  `docs/react-native-migration/01-roadmap/01-foundation.md`; note the device-install /
  internal-channel half is human (inbox), so the step is not fully ✅ until the human runs.

## 4. Local verification (gates that apply)

- [x] 4.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 4.2 `npm run lint` clean (`--max-warnings 0`) in `mobile/`.
- [x] 4.3 `npm test` green in `mobile/` (no new tests; existing suites unaffected). — 8 suites / 26 tests.
- [x] 4.4 `npx expo config --json` parses under **both** variants
  (`APP_VARIANT=development` and unset) — confirms the production profile carries the
  production identity/Firebase and the dev profile the `.dev` identity (design D1, D6 risk).
  Verified: prod → `fr.samuelprak.timecalendar` + `GoogleService-Info.plist`; dev →
  `fr.samuelprak.timecalendar.dev` + `.dev.plist` + `NSAllowsLocalNetworking`; both show
  `runtimeVersion {policy:fingerprint}` and the placeholder `updates.url`/`projectId`.
- [x] 4.5 `npx eas-cli build --profile preview --platform all --dry-run` (or
  `eas build:inspect`) — sanity-check `eas.json` parses if the CLI is available without
  login; otherwise note that EAS-CLI validation rides task 5.1. — **Falls back to 5.1:**
  the EAS CLI (20.1.0) requires login even for offline validation (`eas config` /
  `build:inspect` both error logged-out, as the planner flagged). `eas.json` confirmed
  valid JSON; config shape verified via the `expo config --json` variant diff (4.4).

## 5. Human-only (out-of-band — credentials / account / console / device)

- [ ] 5.1 `eas login` + `eas init` → real `projectId` / `updates.url`; commit the resolved
  `projectId` (not a secret). (HUMAN: see inbox/2026-06-13-eas-credentials.md)
- [ ] 5.2 Apple Developer credentials + EAS-managed iOS signing for
  `fr.samuelprak.timecalendar`; supply `ascAppId`/`appleTeamId`/`appleId` via env.
  (HUMAN: see inbox/2026-06-13-eas-credentials.md)
- [ ] 5.3 Google Play service-account key for `eas submit` (Android).
  (HUMAN: see inbox/2026-06-13-eas-credentials.md)
- [ ] 5.4 `eas build --profile preview` (both platforms) + install on a real device; set up
  TestFlight internal + Play internal testing channels (dogfooding starts).
  (HUMAN: see inbox/2026-06-13-eas-credentials.md)
- [ ] 5.5 Verify an `eas update --channel preview` is picked up by the installed build, and
  that production-identity crashes/analytics land in `timecalendar-samuelprak`.
  (HUMAN: see inbox/2026-06-13-eas-credentials.md)

## 6. No CI proof test (justified N/A)

- [x] 6.1 Confirm no Jest proof test is added and CI workflows are unchanged — this change
  ships configuration, not runtime behavior (design D8); the EAS CLI and `expo config`
  are the enforcing gates (R-1), and the DoD E2E axis is N/A for this change with that reason.
  Confirmed: no `*.test.*` added; `.github/workflows/` and `.eas/` untouched.
