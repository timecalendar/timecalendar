# EAS — build, submit, and over-the-air updates

For the ELI5 release flow, signing recovery and current readiness audit, start with
[`docs/mobile/releases/`](../docs/mobile/releases/README.md). This file describes the committed
configuration; the release pack explains what an operator must do around it.

How `mobile/` ships. Configured by the `add-mobile-eas` change (foundation roadmap
step 11). EAS is **human-invoked** — there is no CI wiring (see the Architecture Book
"EAS / distribution", decision D4). The native E2E keeps building via `expo prebuild`,
not EAS.

## Profiles ↔ channels ↔ variants

Three build profiles in [`eas.json`](./eas.json), split along the `APP_VARIANT`
identity line (not a third identity — design D1):

| Profile       | `APP_VARIANT` | Identity / Firebase                         | Distribution | Artifacts                         | Update channel |
| ------------- | ------------- | ------------------------------------------- | ------------ | --------------------------------- | -------------- |
| `development` | `development` | `…timecalendar.dev` / `timecalendar-dev`    | `internal`   | iOS **simulator** + Android APK   | —              |
| `preview`     | _(unset)_     | `…timecalendar` / `timecalendar-samuelprak` | `internal`   | iOS device **.ipa** + Android APK | `preview`      |
| `production`  | _(unset)_     | `…timecalendar` / `timecalendar-samuelprak` | `store`      | iOS **.ipa** + Android **.aab**   | `production`   |

- `development` is the fast inner loop: `developmentClient: true`, simulator + APK, no
  signing needed. It carries the `.dev` id, the dev Firebase project, and the dev-variant
  network exceptions (cleartext / local-networking).
- `preview` is the **internal dogfood** track: it builds the **real production identity**
  so dogfooders run the thing we ship and their crashes/analytics land in
  `timecalendar-samuelprak`. Internal distribution forces directly-installable artifacts
  (`.ipa`/`.apk`, never `.aab`).
- `production` is the store track: `.aab` for Play, store `.ipa` for App Store,
  `autoIncrement` for the build number.

Only `development` sets `APP_VARIANT`; `preview`/`production` omit it so they take the
production default in `app.config.ts`. **Verify with the variant diff:**
`npx expo config --json` (production) vs `APP_VARIANT=development npx expo config --json`
— the production config must show `fr.samuelprak.timecalendar` and the
`timecalendar-samuelprak` Firebase files; the dev config the `.dev` id and the
`timecalendar-dev` files.

## Over-the-air updates (`expo-updates`)

- `runtimeVersion: { policy: "fingerprint" }` in `app.config.ts`. An `eas update` JS bundle
  is only delivered to a build whose **native runtime fingerprint matches**. Any
  native-affecting change — a new config plugin, a dependency with native code, an SDK bump —
  changes the fingerprint and therefore **requires a fresh native build**; it will not (and
  must not) ship as an OTA. This is the intended safety property, not a bug: if an expected
  OTA "doesn't apply," check whether the change touched native config.
- `updates.url` and `extra.eas.projectId` are derived from `EAS_PROJECT_ID`, falling back to the
  committed real EAS project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b` for
  `@samuelprak/timecalendar`. The ID is public build metadata, not a secret.
- Push an update: `eas update --channel preview` (dogfood) / `eas update --channel production`
  (store). Updates only reach installed builds on the matching channel.

## Submit skeleton

`submit.production` in `eas.json` is **structure only — no secrets**:

- iOS: `appleId` / `ascAppId` / `appleTeamId` read from `$EXPO_APPLE_ID` /
  `$EXPO_ASC_APP_ID` / `$EXPO_APPLE_TEAM_ID` (mirrors the Flutter Appfile pattern). Never
  committed.
- Android: `serviceAccountKeyPath` points at `../ci/keys/eas-android-sa-key.json` (outside
  git), `track: internal`.

## Signing

EAS uses its own **managed credentials** (it generates/stores the iOS distribution cert +
provisioning profile, links the Apple account on first `eas build`). We do **not** reuse the
Flutter Fastlane `match` repo — that stays with the Flutter app (design D5). Same production
bundle id, so EAS targets the existing App Store record (the RN app ships as an update).

## Human prerequisites (cannot be automated)

Real builds still require account access, signing and submission credentials, remote version
initialization, and physical-device verification. The current `preview` profile creates direct
installation artifacts and is not store-submittable. The release guide's
[readiness checklist](../docs/mobile/releases/05-readiness-and-gaps.md) owns current status, and the
[(HUMAN: mobile release bootstrap) inbox note](../docs/react-native-migration/inbox/2026-08-26-mobile-release-bootstrap.md)
owns the exact operator actions. No credential or private key belongs in git.
